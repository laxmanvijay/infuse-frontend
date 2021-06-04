import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallWindowComponent } from './call-window.component';
import { CoreModule } from '../../core/core.module';



@NgModule({
  declarations: [
    CallWindowComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ]
})
export class CallWindowModule { }
