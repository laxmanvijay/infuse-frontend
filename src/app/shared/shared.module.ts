import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { ContactComponent } from './components/contact/contact.component';
import { LoaderComponent } from './components/loader/loader.component';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, ContactComponent, LoaderComponent],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, ContactComponent, LoaderComponent]
})
export class SharedModule {}
