import { Location } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AudioVideoObserver, ContentShareObserver, DefaultModality, MeetingSession } from 'amazon-chime-sdk-js';
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
  
  public isScreenShareOn = false;
  public isOtherScreenShareOn = false;

  public showLoader: boolean;

  public statusText = '';
  public isConnected = false;

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
      if (!tileState.boundAttendeeId) {
        return;
      }
      console.log("video element came", tileState);
      const yourAttendeeId = this.meetingSession.configuration.credentials.attendeeId;

      // tileState.boundAttendeeId is formatted as "attendee-id#content".
      const boundAttendeeId = tileState.boundAttendeeId;
      this.callService.setTileIdAttendeeEntry(tileState.tileId, tileState.boundAttendeeId);
      if (boundAttendeeId.includes("#content")) {
        const baseAttendeeId = new DefaultModality(boundAttendeeId).base();
        if (baseAttendeeId !== yourAttendeeId) {
          console.log(`${baseAttendeeId} is sharing screen now`);
          this.isOtherScreenShareOn = true;
          this.contact.screenShareTileId = tileState.tileId;
          if (this.otherVideoElement) {
            this.meetingSession.audioVideo.bindVideoElement(tileState.tileId, this.otherVideoElement.nativeElement);
          }
        } else if (baseAttendeeId === yourAttendeeId) {
          console.log("you are sharing screen");
          this.ownContact.screenShareTileId = tileState.tileId;
        }
      } else {
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
      }
    },
    videoTileWasRemoved: tileId => {
      console.log("videoTileWasRemoved called");
      
      if (this.callService.getTileIdAttendeeEntry(tileId).includes("#content")) {
        if (!this.callService.getTileIdAttendeeEntry(tileId).includes(this.meetingSession.configuration.credentials.attendeeId)) {
          this.isOtherScreenShareOn = false;
        } else {
          this.toggleScreenShare();
        }
      } else if (this.meetingSession.configuration.credentials.attendeeId !== this.callService.getTileIdAttendeeEntry(tileId)) {
        this.isOtherVideoOn = false;
      }
    }
  };

  private contentShareObserver: ContentShareObserver = {
    contentShareDidStart: () => {
      console.log("content share started"); 
    },
    contentShareDidStop: () => {
      console.log("contentshare did stop called");
      this.toggleScreenShare();
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
      this.statusText = "Connecting...";
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
          this.ownContact.attendeeId = x.meetingData.Info.Attendee.attendeeId;
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
        this.meetingSession.audioVideo.addContentShareObserver(this.contentShareObserver);
        console.log("done creation", this.meetingSession, this.meetingSession.audioVideo.realtimeIsLocalAudioMuted());
        this.setStatusText("Call Connected...");
        this.attendeeSubscription();
        this.isConnected = true;
      });

      this.callService.getSocketConnection()
        .subscribe(x => {
          if ((x.type === TypeOfMessage.callTerminate)) {
            this.setStatusText("Disconnected...");
            of(1).pipe(delay(1500)).subscribe(() => {
              this.backToHome();
            });
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
        this.statusText = "Ringing...";
        this.callService.getSocketConnection()
          .subscribe(x => {
            console.log("socky", x);
            
            if (((x.type === TypeOfMessage.callBusy || x.type === TypeOfMessage.reject || x.type === TypeOfMessage.callTerminate))) {
              if (x.type === TypeOfMessage.callBusy || x.type === TypeOfMessage.reject) {
                this.setStatusText("Line Busy...");
              } else {
                this.setStatusText("Disconnected...");
              }
              of(1).pipe(delay(1500)).subscribe(() => {
                this.backToHome();
              });
            } else if (x.type === TypeOfMessage.callAcceptedAndMeetingCreated) {
              this.callingAudio.pause();
              this.callService.createOrJoinMeeting({
                type: TypeOfMessage.joinMeeting,
                data: x.data,
                id: this.ownContact.id
              }).pipe(
                tap(y => {
                  this.callService.meeting = y.meetingData.Info.Meeting;
                  this.callService.attendee = y.meetingData.Info.Attendee;
                  this.ownContact.attendeeId = y.meetingData.Info.Attendee.attendeeId;
                }),
                switchMap(() => this.callService.constructMeeting())
              ).subscribe(y => {
                this.meetingSession = y;
                this.meetingSession.audioVideo.bindAudioElement(<HTMLAudioElement>document.getElementById("audio-el"));
                this.meetingSession.audioVideo.start();
                this.isAudioOn = !this.meetingSession.audioVideo.realtimeIsLocalAudioMuted();
                this.meetingSession.audioVideo.addObserver(this.observer);
                this.setStatusText("Call Connected...");
                console.log("joined meeting", this.meetingSession);
                this.attendeeSubscription();
                this.isConnected = true;
              });
            }
          });
      }
    }
  }

  private attendeeSubscription(): void {
    this.subscribeToVolumeChanges(this.meetingSession.configuration.credentials.attendeeId);
    this.meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence((attendeeId: string, present: boolean) => {
      console.log("attendee presence", attendeeId, present);
      if (present) {
        this.subscribeToVolumeChanges(attendeeId);
      } else {
        this.callService.removeFromAttendeeList(attendeeId);
      }
    });
  }

  private subscribeToVolumeChanges(attendeeId: string): void {
    this.meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(attendeeId, (attendeeId,volume, muted, signalStrength) => {
      console.log("recieved volume data", attendeeId, this.meetingSession.configuration.credentials.attendeeId, volume, muted, signalStrength);
      
      this.callService.insertIntoAttendeeList(attendeeId, {
        volume,
        muted, 
        signalStrength
      });
      if (this.meetingSession.configuration.credentials.attendeeId !== attendeeId) {
        this.contact.volume = volume;
        this.contact.muted = muted;
        this.contact.calculatedBorderWidth = (30 * (volume));
      } else {
        this.ownContact.volume = volume;
        this.ownContact.calculatedBorderWidth = (30 * (volume));
      }
    });
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

  setStatusText(txt: string): void {
    this.statusText = txt;
    of(1).pipe(delay(1000)).subscribe(() => this.statusText = '');
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

  async toggleScreenShare(): Promise<void> {
    console.log("calling toggleScreenShare with state", this.isScreenShareOn);
    if (!this.isScreenShareOn) {
      try {
        await this.meetingSession.audioVideo.startContentShareFromScreenCapture();
        this.isScreenShareOn = true;
      } catch(err) {
        this.isScreenShareOn = false;
      }
    } else {
      this.meetingSession.audioVideo.stopContentShare();
      this.isScreenShareOn = false;
    }
    console.log("ending toggleScreenShare with state", this.isScreenShareOn);
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
