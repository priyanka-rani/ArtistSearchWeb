import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FavoritesService, Favorite } from '../favorites.service';
import { NotificationService } from '../notification.service';
import { ChangeDetectorRef } from '@angular/core';
import { SelectedArtistService } from '../selected-artist.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: Favorite[] = [];
  loading = true;
  private timerSub!: Subscription;

  constructor(private favService: FavoritesService,
    private notificationService: NotificationService,
    private selectedArtistService: SelectedArtistService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.favService.getFavorites().subscribe(data => {
      this.favorites = data.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      this.loading = false;
    });
    
    this.timerSub = interval(1000).subscribe(() => {
      this.favorites = [...this.favorites];
    });
  }

  remove(artistId: string, event: MouseEvent) {
    event.stopPropagation();
    this.favService.removeFavorite(artistId).subscribe(() => {
      this.favorites = this.favorites.filter(f => f.artistId !== artistId);
      this.notificationService.show('Removed from favorites', 'danger');
    });
  }

  navigateToDetails(artistId: string, event: MouseEvent) {
    if ((event.target as HTMLElement).closest('button')) return;
      
    this.selectedArtistService.set(artistId);
    this.router.navigate(['/']);
  }

  formatRelativeTime(timestamp: string): string {
    if (!timestamp || isNaN(Date.parse(timestamp))) return '';

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = Date.now() - new Date(timestamp).getTime();
    const secondsAgo = Math.floor(diff / 1000);

    if (secondsAgo < 60) return rtf.format(-secondsAgo, 'second');
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return rtf.format(-minutesAgo, 'minute');
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return rtf.format(-hoursAgo, 'hour');
    const daysAgo = Math.floor(hoursAgo / 24);
    return rtf.format(-daysAgo, 'day');
  }
  
  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
  }

}