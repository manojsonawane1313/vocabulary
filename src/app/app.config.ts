import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
// 1. Add this import
import { provideHttpClient, withFetch } from '@angular/common/http'; 

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    // 2. Add the HttpClient provider with Fetch enabled here
    provideHttpClient(withFetch()) 
  ]
};