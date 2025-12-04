// src/app/services/auth.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // We don't need to inject AuthService here, we can directly read localStorage
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const storedToken = localStorage.getItem('token');
    const token = storedToken ? JSON.parse(storedToken) : null; // Parse JSON since DataService stores with JSON.stringify

    // Only attach the token if one exists and the request is to our API
    if (token) {
      const cloned = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }

    return next.handle(request);
  }
}