import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../../../environments/environment';
import { IContact, ICreateOrJoinMeetingResponse, IMessage, TypeOfMessage } from '../models/call.models';

import { WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable } from 'rxjs';
import { Meeting } from 'aws-sdk/clients/chime';
import { Attendee, ConsoleLogger, DefaultDeviceController, DefaultMeetingSession, LogLevel, MeetingSession, MeetingSessionConfiguration } from 'amazon-chime-sdk-js';

@Injectable({
  providedIn: 'root'
})
export class CallService {

  constructor(private http: HttpClient) { }

  private socket$: WebSocketSubject<IMessage>;

  private meetingSession: MeetingSession;

  public currentState = new BehaviorSubject<TypeOfMessage>(TypeOfMessage.available);

  public caller: IContact;

  private _meeting: Meeting; 
  public get meeting() : Meeting {
    return this._meeting;
  }
  public set meeting(v : Meeting) {
    this._meeting = v;
  }

  private _attendee: Attendee;
  public get attendee() : Attendee {
    return this._attendee;
  }
  public set attendee(v : Attendee) {
    this._attendee = v;
  }
  

  private logger = new ConsoleLogger('ChimeMeetingLogs', LogLevel.WARN);
  private deviceController = new DefaultDeviceController(this.logger);
  private configuration: MeetingSessionConfiguration;

  public getSocketConnection(id?: string): WebSocketSubject<IMessage> {
    if (this.socket$ == undefined)
      this.socket$ = new WebSocketSubject<IMessage>(AppConfig.ws_url + '?id=' + id);
    return this.socket$;
  }

  public createOrJoinMeeting(body: IMessage): Observable<ICreateOrJoinMeetingResponse> {
    return this.http.post<ICreateOrJoinMeetingResponse>(AppConfig.api_url + '/meeting/create', body);
  }

  public async constructMeeting(): Promise<MeetingSession> {

    this.configuration = new MeetingSessionConfiguration(this.meeting, this.attendee);
    
    this.meetingSession = new DefaultMeetingSession(this.configuration, this.logger, this.deviceController);

    try {
      const audioInputs = await this.meetingSession.audioVideo.listAudioInputDevices();
      await this.meetingSession.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId);
    } catch (err) {
      console.log("unable to attach audio device", err);
    }

    return this.meetingSession;
  }

  public getMeetingSession(): MeetingSession {
    if (!this.meetingSession) {
      if (this.configuration)
        this.meetingSession = new DefaultMeetingSession(this.configuration, this.logger, this.deviceController);
      else
        return undefined;
    }
    return this.meetingSession;
  }
}
