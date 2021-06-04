import { Location } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AudioVideoObserver, MeetingSession } from 'amazon-chime-sdk-js';
import { of, Subject } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { CallState } from '../../core/constants/callWindow.constants';
import { IContact, TypeOfMessage } from '../../core/models/call.models';
import { CallService } from '../../core/services/call.service';

@Component({
  selector: 'app-call-window',
  templateUrl: './call-window.component.html',
  styleUrls: ['./call-window.component.scss']
})
export class CallWindowComponent implements OnInit, OnDestroy {
  showLoader: boolean;

  constructor(private router: Router,private activatedRoute: ActivatedRoute, private location: Location, private callService: CallService) { }

  private callingAudio: HTMLAudioElement;

  public contact: IContact;

  private contacts: IContact[];

  public callState: CallState = CallState.calling;

  public isAudioOn = true;

  public isVideoOn = false;

  public isLineBusy = false;

  public meetingSession: MeetingSession;

  public isOtherVideoOn: boolean;

  public timeoutExpiryNotifier$ = new Subject<void>();
  public destroyNotifier$ = new Subject<void>();

  public ownContact: IContact = {
    name: 'Me',
    id: localStorage.getItem('id'),
    self: true
  };

  @ViewChild('othervideoel') private otherVideoElement: ElementRef<HTMLVideoElement>;
  @ViewChild('ownvideoel') private ownVideoElement: ElementRef<HTMLVideoElement>;

  private observer: AudioVideoObserver = {
    videoTileDidUpdate: tileState => {
      if (!tileState.boundAttendeeId || tileState.isContent) {
        return;
      }
      console.log("video element came", tileState);
      if (tileState.localTile) {
        if (this.ownVideoElement)
          this.meetingSession.audioVideo.bindVideoElement(tileState.tileId, this.ownVideoElement.nativeElement);
        this.ownContact.tileId = tileState.tileId;
      } else {
        this.contact.tileId = tileState.tileId;
        if (this.otherVideoElement)
          this.meetingSession.audioVideo.bindVideoElement(tileState.tileId, this.otherVideoElement.nativeElement);
        this.isOtherVideoOn = true;
      }
    },
    videoTileWasRemoved: tileId => {
      if (tileId === this.contact.tileId) {
        this.isOtherVideoOn = false;
        return;
      }
    }
  };

  ngOnInit(): void {
    this.callingAudio = new Audio('assets/audio/calling-sound.mp3');
    this.contacts = JSON.parse(localStorage.getItem("contacts"));
    this.callingAudio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);
    this.contact = this.callService.caller;
    if (this.callService.currentState.value === TypeOfMessage.callAcceptedAndMeetingCreated) {
      console.log("inside create meeting");
      
      this.showLoader = true;
      this.callService.createOrJoinMeeting({
        type: TypeOfMessage.createMeeting,
        data: {
          callerId: this.ownContact,
          calleeId: this.contact
        },
        id: this.ownContact.id
      }).pipe(
        tap(x => {
          this.callService.meeting = x.meetingData.Info.Meeting;
          this.callService.attendee = x.meetingData.Info.Attendee;
          this.callService.getSocketConnection().next({
            type: TypeOfMessage.callAcceptedAndMeetingCreated,
            data: {
              callerId: this.contact,
              calleeId: this.ownContact,
              meetingId: x.meetingData.Info.Meeting.MeetingId
            },
            id: this.ownContact.id
          });
  
          this.showLoader = false;
        }),
        switchMap(() => this.callService.constructMeeting())
      ).subscribe(x => {
        this.meetingSession = x;
        this.meetingSession.audioVideo.bindAudioElement(<HTMLAudioElement>document.getElementById("audio-el"));
        this.meetingSession.audioVideo.start();
        this.isAudioOn = !this.meetingSession.audioVideo.realtimeIsLocalAudioMuted();
        this.meetingSession.audioVideo.addObserver(this.observer);
        console.log("done creation", this.meetingSession, this.meetingSession.audioVideo.realtimeIsLocalAudioMuted());
      });

      this.callService.getSocketConnection()
        .subscribe(x => {
          if ((x.type === TypeOfMessage.callTerminate && x.data.calleeId.id === this.ownContact.id)) {
            this.setBusyAndRedirect();
          }
        });
      
    } else if (this.callService.currentState.value === TypeOfMessage.call) {
      this.contact = this.callService.caller;
      if (this.contact == undefined) {
        this.router.navigateByUrl('/home');
      } else {
        this.callService.getSocketConnection().next({
          type: TypeOfMessage.call,
          data: { 
            calleeId: this.contact,
            callerId: this.ownContact
          },
          id: this.ownContact.id
        });
        this.callingAudio.play();

        this.callService.getSocketConnection()
          .subscribe(x => {
            console.log("socky", x);
            
            if (((x.type === TypeOfMessage.callBusy || x.type === TypeOfMessage.reject || x.type === TypeOfMessage.callTerminate) && x.data.calleeId.id === this.contact.id)) {
              this.setBusyAndRedirect();
            } else if (x.type === TypeOfMessage.callAcceptedAndMeetingCreated && x.data.calleeId.id === this.contact.id) {
              this.callingAudio.pause();
              this.callService.createOrJoinMeeting({
                type: TypeOfMessage.joinMeeting,
                data: x.data,
                id: this.ownContact.id
              }).pipe(
                tap(y => {
                  this.callService.meeting = y.meetingData.Info.Meeting;
                  this.callService.attendee = y.meetingData.Info.Attendee;
                }),
                switchMap(() => this.callService.constructMeeting())
              ).subscribe(y => {
                this.meetingSession = y;
                this.meetingSession.audioVideo.bindAudioElement(<HTMLAudioElement>document.getElementById("audio-el"));
                this.meetingSession.audioVideo.start();
                this.isAudioOn = !this.meetingSession.audioVideo.realtimeIsLocalAudioMuted();
                this.meetingSession.audioVideo.addObserver(this.observer);
                console.log("joined meeting", this.meetingSession);
                
              });
            }
          });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyNotifier$.next();
    this.destroyNotifier$.complete();
    if (this.meetingSession) {
      this.meetingSession.audioVideo.stop();
    }
  }

  backToHome(): void {
    this.callingAudio.pause();
    if (!this.isLineBusy) {
      this.callService.getSocketConnection().next({
        type: TypeOfMessage.callTerminate,
        data: { 
          calleeId: this.contact,
          callerId: this.ownContact
        }
      });
    }
    this.router.navigate(['/home']);
  }

  setBusyAndRedirect(): void {
    this.isLineBusy = true;
    console.log("busy");
  
    of(1).pipe(delay(3000)).subscribe(() => {
      this.backToHome();
    });
  }

  toggleAudio(): void {
    console.log("calling toggleAudio with state", this.isAudioOn);
    
    if (this.isAudioOn) {
      this.meetingSession.audioVideo.realtimeMuteLocalAudio();
    } else {
      if (this.meetingSession.audioVideo.realtimeCanUnmuteLocalAudio()) {
        this.meetingSession.audioVideo.realtimeUnmuteLocalAudio();
      }
    }
    this.isAudioOn = !this.meetingSession.audioVideo.realtimeIsLocalAudioMuted();
    console.log("ending toggleAudio with state", this.isAudioOn);
    
  }
  
  async toggleVideo(): Promise<void> {
    console.log("calling toggleVideo with state", this.isVideoOn);
    if (!this.isVideoOn) {
      const devices = await this.meetingSession.audioVideo.listVideoInputDevices();
      console.log("available devices", devices);
      
      await this.meetingSession.audioVideo.chooseVideoInputDevice(devices[0].deviceId);
      this.ownContact.tileId = this.meetingSession.audioVideo.startLocalVideoTile();
      console.log("video started", this.ownContact);
      this.isVideoOn = true;
    } else {
      this.meetingSession.audioVideo.stopLocalVideoTile();
      this.isVideoOn = false;
      console.log("video turned off");
    }
    console.log("ending toggleVideo with state", this.isVideoOn);
  }
}
