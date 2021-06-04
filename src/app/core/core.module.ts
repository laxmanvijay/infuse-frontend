import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirstTwoLettersPipe } from './pipes/firstTwoLetters.pipe';
import { HttpClientModule } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';

@NgModule({
  declarations: [
    FirstTwoLettersPipe
  ],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [
    FirstTwoLettersPipe
  ]
})
export class CoreModule { }
