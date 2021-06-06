import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IContact, TypeOfMessage } from '../../../core/models/call.models';
import { CallService } from '../../../core/services/call.service';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

    constructor(private router: Router, private callService: CallService) { }

    @Input() public contact: IContact;

    @Output() public deleteEventEmitter = new EventEmitter<IContact>();

    ngOnInit(): void {
    }

    beginCall(): void {
        this.callService.currentState.next(TypeOfMessage.call);
        this.callService.caller = this.contact;
        this.router.navigate(['call'], {
            queryParams: {
                id: this.contact.id
            }
        });
    }
}
