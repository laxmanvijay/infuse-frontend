import { Injectable } from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanDeactivate} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HomeHttpService } from '../services/home.http.service';

export interface CanComponentDeactivate {
    canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private router: Router, private homeService: HomeHttpService) {}

    canActivate(_route: ActivatedRouteSnapshot, _state:RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if (_route.queryParams.directlink && _route.queryParams.meetingid) {
            return true;
        }
        if (localStorage.getItem("id") != undefined && localStorage.getItem("hashedId") != undefined) {
            return this.homeService.validateUniqueId(localStorage.getItem("id"), localStorage.getItem("hashedId")).pipe(map(x => x.response));
        } else {
            this.router.navigateByUrl('');
        }
        return false;
    }
}

@Injectable({
    providedIn: 'root'
})
export class DeactivateAuthGuard implements CanDeactivate<CanComponentDeactivate> {
  
    constructor(private router: Router, private homeService: HomeHttpService) {}
  
    canDeactivate(_component: CanComponentDeactivate, _route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
        console.log(_state, _route);
    
        return false;
    }
}