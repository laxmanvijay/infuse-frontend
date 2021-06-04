import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay } from "rxjs/operators";
import { IGeneratedId, IValidationResponse } from '../../../core/models/home.models';
import { HomeHttpService } from '../../../core/services/home.http.service';

@Component({
  selector: 'app-generate-id',
  templateUrl: './generate-id.component.html',
  styleUrls: ['./generate-id.component.scss']
})
export class GenerateIdComponent implements OnInit {

  constructor(private router: Router, private homeService: HomeHttpService) { }

  public text = '';

  ngOnInit(): void {
    this.validationAndGeneration();
  }

  private validationAndGeneration(): void {
    if (localStorage.getItem('id') != undefined && localStorage.getItem('hashedId') != undefined) {
      this.text = 'Validating 10 Digit ID';
      this.homeService.validateUniqueId(localStorage.getItem('id'), localStorage.getItem('hashedId')).subscribe((x: IValidationResponse) => {
        if (x.response) {
          of(1).pipe(delay(3000)).subscribe(_ => {
            this.text = 'ID Validated Successfully';
            this.router.navigateByUrl('/home');
          });
        } else {
          this.text = 'Your ID has been Tampered :(';
          localStorage.removeItem('id');
          localStorage.removeItem('hashedId');
          of(1).pipe(delay(1000)).subscribe(_ => {
            this.text = 'Regenerating ID';
            this.validationAndGeneration();
          });
        }
      });
    } else {
      this.text = 'Generating 10 Digit ID';
      this.homeService.generateUniqueId().subscribe((x: IGeneratedId) => {
        localStorage.setItem("id", x.id);
        localStorage.setItem("hashedId", x.hashedId);
        of(1).pipe(delay(3000)).subscribe(_ => {
          this.router.navigateByUrl('/home');
        });
      });
    }
  }
}
