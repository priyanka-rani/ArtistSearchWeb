import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService, Favorite } from '../favorites.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html'
})
export class FavoritesComponent implements OnInit {
  favorites: Favorite[] = [];

  constructor(private favService: FavoritesService) {}

  ngOnInit() {
    this.favService.getFavorites().subscribe(data => {
      this.favorites = data;
    });
  }

  remove(artistId: string) {
    this.favService.removeFavorite(artistId).subscribe(() => {
      this.favorites = this.favorites.filter(f => f.artistId !== artistId);
    });
  }

  formatRelativeTime(timestamp: string): string {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const secondsAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (secondsAgo < 60) return rtf.format(-secondsAgo, 'second');
    const minutesAgo = Math.floor(secondsAgo / 60);
    return rtf.format(-minutesAgo, 'minute');
  }
}