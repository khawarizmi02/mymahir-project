import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNgxStripe } from 'ngx-stripe';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

// Initialize auth state from localStorage on app startup
function initializeAuthState(authService: AuthService): () => Promise<void> {
  return () => {
    // AuthService constructor already initializes signals from localStorage
    // This just ensures the service is instantiated early
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideNgxStripe(environment.stripePublishableKey),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthState,
      deps: [AuthService],
      multi: true,
    },
    {
      provide: 'ngsw-worker.js',
      useValue: {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000',
      },
    },
  ],
};
