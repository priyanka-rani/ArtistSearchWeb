import { Routes } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { FavoritesComponent } from './favorites/favorites.component'; // if used

export const appRoutes: Routes = [
  { path: '', component: SearchComponent },
  { path: 'search', redirectTo: '', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'favorites', component: FavoritesComponent } // optional
];