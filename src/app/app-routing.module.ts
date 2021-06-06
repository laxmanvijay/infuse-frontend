import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

import { HomeRoutingModule } from './modules/home/home-routing.module';
import { CallWindowRoutingModule } from './modules/callWindow/callWindow-routing.module';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'generateId',
        pathMatch: 'full'
    },
    {
        path: '**',
        component: PageNotFoundComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
        HomeRoutingModule,
        CallWindowRoutingModule
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
