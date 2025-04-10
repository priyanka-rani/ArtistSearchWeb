// selected-artist.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectedArtistService {
  private selectedArtistId$ = new BehaviorSubject<string | null>(null);

  set(id: string) {
    this.selectedArtistId$.next(id);
  }

  get(): string | null {
    return this.selectedArtistId$.getValue();
  }

  getObservable() {
    return this.selectedArtistId$.asObservable();
  }

  clear() {
    this.selectedArtistId$.next(null);
  }
}