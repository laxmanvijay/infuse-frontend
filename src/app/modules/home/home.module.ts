import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { GenerateIdComponent } from './generate-id/generate-id.component';

@NgModule({
  declarations: [HomeComponent, GenerateIdComponent],
  imports: [CommonModule, SharedModule, HomeRoutingModule, FormsModule]
})
export class HomeModule {}
