import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { IGeneratedId, IValidationResponse } from '../models/home.models';

@Injectable({
  providedIn: 'root'
})
export class HomeHttpService {

  constructor(private http: HttpClient) { }

  public generateUniqueId(): Observable<IGeneratedId> {
    return this.http.get<IGeneratedId>(AppConfig.api_url + '/generateId');
  }

  public validateUniqueId(id: string, hashedId: string): Observable<IValidationResponse> {
    return this.http.post<IValidationResponse>(AppConfig.api_url + '/validateId', {
      id,
      hashedId
    });
  }
}
