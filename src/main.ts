import { bootstrapApplication } from '@angular/platform-browser';
import { init as initApm } from '@elastic/apm-rum';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.apmServerUrl) {
  initApm({
    serverUrl: environment.apmServerUrl,
    serviceName: environment.apmServiceName,
    environment: environment.apmEnvironment,
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
