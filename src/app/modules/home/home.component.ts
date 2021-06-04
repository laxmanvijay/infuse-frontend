import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IContact, TypeOfMessage } from '../../core/models/call.models';
import { CallService } from '../../core/services/call.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  addContactError: boolean;

  constructor(private router: Router, private callService: CallService) { }

  @ViewChild('video') public videoEl: ElementRef<HTMLVideoElement>;

  public isVideoOn = true;
  private videoStream: MediaStream;

  public contacts: IContact[] = JSON.parse(localStorage.getItem("contacts")) ?? [];
  public contactsToShow: IContact[] = JSON.parse(localStorage.getItem("contacts")) ?? [];
  public searchText = '';
  public showAddContactPanel = false;

  public nickname = '';
  public id = '';
  public ownContact: IContact = {
    name: 'Me',
    id: localStorage.getItem('id'),
    self: true
  };
  public incomingCall = false;
  public incomingCallContact: IContact;
  public incomingAudio = new Audio("assets/audio/pubg_theme_song.mp3");

  public destroyNotifier$ = new Subject<void>();
  public audioPauseNotifier$ = new Subject<void>();

  ngOnInit(): void {
    this.callService.currentState.next(TypeOfMessage.available);
    this.callService.caller = undefined;
    this.callService.getSocketConnection(this.ownContact.id)
      .subscribe(msg => {
        console.log(msg);
        this.incomingCallContact = this.contacts.find(x => x.id === msg.data.callerId.id);
        if (this.incomingCallContact && msg.type === 'call' && msg.data.calleeId.id === this.ownContact.id) {
          this.incomingCall = true;
          this.incomingAudio.play();
          fromEvent(this.incomingAudio, 'ended').pipe(takeUntil(this.audioPauseNotifier$)).subscribe(() => {
            this.incomingAudio.currentTime = 0;
            this.incomingAudio.play();
          });
        }
        if (msg.type === 'callTerminate' && msg.data.calleeId.id === this.ownContact.id) {
          this.resetCallState();
        }
      });
  }

  ngAfterViewInit(): void {
    if (window.innerWidth > 500) {
      navigator.mediaDevices.getUserMedia({
        video: true
      }).then(stream => {
        this.videoEl.nativeElement.srcObject = stream;
        this.videoEl.nativeElement.play();
        this.videoStream = stream;
      }).catch(err => {
        console.log("error in video stream", err);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroyNotifier$.next();
    this.resetCallState();
    this.videoStream?.getTracks().forEach(x => x.stop());
  }

  rejectIncomingCall(): void {
    this.resetCallState();

    this.callService.getSocketConnection().next({
      type: TypeOfMessage.reject,
      data: {
        callerId: this.incomingCallContact,
        calleeId: this.ownContact
      },
      id: this.ownContact.id
    });
  }

  attendIncomingCall(): void {
    this.resetCallState();
    this.callService.currentState.next(TypeOfMessage.callAcceptedAndMeetingCreated);
    this.callService.caller = this.incomingCallContact;
    this.router.navigateByUrl("call");
  }

  private resetCallState(): void {
    console.log("called");
    
    this.audioPauseNotifier$.next();
    this.incomingCall = false;
    this.incomingAudio.pause();
    this.incomingAudio.currentTime = 0;
  }

  public toggleVideo(): void {
    if (this.isVideoOn) {
      this.isVideoOn = false;
      this.videoStream.getTracks().forEach(x => x.stop());
    } else {
      this.isVideoOn = true;
      navigator.getUserMedia({ video: true }, (localMediaStream) => {
        this.videoEl.nativeElement.srcObject = localMediaStream;
        this.videoEl.nativeElement.play();
        this.videoStream = localMediaStream;
      }, (err) => {
        console.log(err);
      });
    }
  }

  public search(): void {
    if (this.searchText.length === 0) this.contactsToShow = this.contacts.slice();
    this.contactsToShow = this.contacts.filter(x => x.name.toLowerCase().includes(this.searchText) || x.id.includes(this.searchText));
  }

  public addContact(): void {
    if (this.id.length > 0 && this.nickname.length > 0) {
      this.contacts.push({
        id: this.id,
        name: this.nickname
      });
      localStorage.setItem("contacts", JSON.stringify(this.contacts));
      this.search();
      this.id = this.nickname = '';
      this.showAddContactPanel = false;
      this.addContactError = false;
    } else {
      this.addContactError = true;
    }
  }

  public deleteContact(contact: IContact): void {
    this.contacts.splice(this.contacts.findIndex(x => x.id === contact.id), 1);
    localStorage.setItem("contacts", JSON.stringify(this.contacts));
    this.search();
  }
}
