import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from '../services/data.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private dataService = inject(DataService);
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Use DataService which handles JSON parsing correctly
    const token = this.dataService.getLocalStorage<string>('token');
    
    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(clonedRequest);
    }
    
    return next.handle(req);
  }
}
