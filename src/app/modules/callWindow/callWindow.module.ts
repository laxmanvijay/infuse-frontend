import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallWindowComponent } from './call-window.component';
import { CoreModule } from '../../core/core.module';
import { DrawComponent } from './draw/draw.component';



@NgModule({
    declarations: [
        CallWindowComponent,
        DrawComponent
    ],
    imports: [
        CommonModule,
        CoreModule
    ]
})
export class CallWindowModule { }
