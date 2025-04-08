import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Favorite {
  artistId: string;
  name: string;
  image: string;
  nationality?: string;
  birth_year?: string;
  death_year?: string;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  constructor(private http: HttpClient) {}

  getFavorites(): Observable<Favorite[]> {
    return this.http.get<Favorite[]>('/api/favorites', { withCredentials: true });
  }

  addFavorite(favorite: Favorite): Observable<any> {
    return this.http.post('/api/favorites', favorite, { withCredentials: true });
  }

  removeFavorite(artistId: string): Observable<any> {
    return this.http.delete(`/api/favorites/${artistId}`, { withCredentials: true });
  }
}