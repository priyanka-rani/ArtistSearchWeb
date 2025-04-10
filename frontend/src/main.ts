import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { AuthService } from './app/auth.service';
import { firstValueFrom } from 'rxjs';

bootstrapApplication(AppComponent, appConfig).then(async appRef => {
  const auth = appRef.injector.get(AuthService);
  await firstValueFrom(auth.fetchProfile());
});