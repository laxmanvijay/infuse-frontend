import { Attendee } from "amazon-chime-sdk-js";
import { Meeting } from "aws-sdk/clients/chime";

export enum TypeOfMessage {
  call = 'call',
  callTerminate = 'callTerminate',
  callBusy = 'callBusy',
  available = 'available',
  reject = "reject",
  callAcceptedAndMeetingCreated = "callAcceptedAndMeetingCreated",
  createMeeting = "createMeeting",
  joinMeeting = "joinMeeting"
}

export interface IContact {
  id?: string,
  name?: string,
  self?: boolean,
  tileId?: number,
  screenShareTileId?: number,
  attendeeId?: string
}

export interface IConnection {
  connectionId?: string,
  uniqueId?: string, 
  callerId?: IContact, 
  calleeId?: IContact, 
  callState?: TypeOfMessage, 
  meetingId?: string, 
  attendeeId?: string
}


export interface IMessage {
  type: TypeOfMessage,
  data: IConnection,
  id?: string
}

export interface IInfo {
  Meeting: Meeting,
  Attendee: Attendee
}

export interface IMeetingData {
  Info: IInfo
}

export interface ICreateOrJoinMeetingResponse {
  meetingData: IMeetingData
}