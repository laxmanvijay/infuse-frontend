import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { CallWindowComponent } from './call-window.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
    {
        path: 'call',
        component: CallWindowComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    declarations: [],
    imports: [CommonModule, RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CallWindowRoutingModule {}
