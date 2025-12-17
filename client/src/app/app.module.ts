// src/app/app.module.ts (or core module)

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { NgModule } from '@angular/core';
import { NgxStripeModule } from 'ngx-stripe';
import { environment } from '../environments/environment';

@NgModule({
  // ... declarations, imports, etc.
  imports: [NgxStripeModule.forRoot(environment.stripePublishableKey)],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true, // Essential for registering multiple interceptors
    },
  ],
})
export class AppModule {}
