import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService, Favorite } from '../favorites.service';
import { Observable } from 'rxjs';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html'
})
export class FavoritesComponent implements OnInit {
  favorites: Favorite[] = [];

  constructor(private favService: FavoritesService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit() {
    this.favService.getFavorites().subscribe(data => {
      console.log('💡 raw response:', data);
      this.favorites = data;
    });
  }

  remove(artistId: string) {
    this.favService.removeFavorite(artistId).subscribe(() => {
      this.favorites = this.favorites.filter(f => f.artistId !== artistId);
      this.notificationService.show('Removed from favorites', 'danger');
    });
  }

  formatRelativeTime(timestamp: string): string {
    if (!timestamp || isNaN(Date.parse(timestamp))) return '';

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const secondsAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (!isFinite(secondsAgo)) return ''; // extra safety

    if (secondsAgo < 60) return rtf.format(-secondsAgo, 'second');
    const minutesAgo = Math.floor(secondsAgo / 60);
    return rtf.format(-minutesAgo, 'minute');
  }
}