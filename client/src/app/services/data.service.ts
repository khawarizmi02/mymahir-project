import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private isBrowser = typeof window !== 'undefined' && !!window.localStorage;

  constructor() {}

  setLocalStorage(key: string, value: any): void {
    if (this.isBrowser) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getLocalStorage<T = any>(key: string): T | null {
    if (this.isBrowser) {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    }
    return null;
  }

  clearStorage(): void {
    return localStorage.clear();
  }

  deleteStorage(key: string) {
    return localStorage.removeItem(key);
  }
}
