// src/app/app.module.ts (or core module)

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { NgModule } from '@angular/core';
// ... other imports

@NgModule({
  // ... declarations, imports, etc.
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Essential for registering multiple interceptors
    }
  ]
})
export class AppModule { }