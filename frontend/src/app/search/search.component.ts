import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoritesService } from '../favorites.service';
import { AuthService } from '../auth.service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CategoryModalComponent } from '../category-modal/category-modal.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, CategoryModalComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchQuery: string = '';
  artists: any[] = [];
  loading: boolean = false;
  loadingDetails: boolean = false;
  errorMessage: string = '';
  selectedArtistId: string | null = null;
  selectedArtist: any = null;
  artworks: any[] = [];
  activeTab: string = 'info';
  favorites: Set<string> = new Set();
  isLoggedIn: boolean = false;

  constructor(
    private http: HttpClient,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) this.loadFavorites();
      else this.favorites.clear();
    });
  }

  searchArtists(): void {
    if (!this.searchQuery.trim()) return;

    this.loading = true;
    this.errorMessage = '';
    this.selectedArtistId = null;
    this.selectedArtist = null;
    this.artworks = [];
    this.similarArtists = [];

    this.http.get<{ artists: any[] }>(`/api/search?query=${this.searchQuery}`).subscribe({
      next: (data) => {
        if (!data.artists.length) {
          this.errorMessage = 'No results.';
          this.artists = [];
        } else {
          this.artists = data.artists.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            image: artist.links?.thumbnail?.href && artist.links.thumbnail.href !== '/assets/shared/missing_image.png'
            ? artist.links.thumbnail.href
            : 'images/artsy_logo.svg'          
          }));
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error fetching results. Please try again.';
        this.loading = false;
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.artists = [];
    this.selectedArtistId = null;
    this.selectedArtist = null;
    this.errorMessage = '';
    this.artworks = [];
    this.similarArtists = [];
  }

  selectArtist(artist: any): void {
    this.selectedArtistId = artist.id;
    this.selectedArtist = null;
    this.artworks = [];
    this.similarArtists = [];
    this.activeTab = 'info';
    this.loadingDetails = true;

    this.http.get<any>(`/api/artists/${artist.id}`).subscribe({
      next: (data) => {
        this.selectedArtist = {
          id: data.id,
          name: data.name,
          biography: data.biography,
          nationality: data.nationality,
          birth_year: data.birthday,
          death_year: data.deathday
        };
        this.loadingDetails = false;
        this.fetchSimilarArtists(artist.id);
      },
      error: () => {
        this.selectedArtist = null;
        this.errorMessage = 'Could not load artist details.';
        this.loadingDetails = false;
      }
    });

    this.http.get<any[]>(`/api/artists/${artist.id}/artworks`).subscribe({
      next: (data) => {
        this.artworks = data.map((artwork: any) => ({
          id: artwork.id,
          title: artwork.title,
          date: artwork.date,
          image: artwork.links?.thumbnail?.href && artwork.links.thumbnail.href !== '/assets/shared/missing_image.png'
          ? artwork.links.thumbnail.href
          : 'images/artsy_logo.svg'    
        }));
      },
      error: () => {
        this.artworks = [];
      }
    });
  }
  similarArtists: any[] = [];

  private fetchSimilarArtists(artistId: string): void {
    this.http.get<any[]>(`/api/artists/${artistId}/similar`).subscribe({
      next: (data) => {
        this.similarArtists = data.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          birth_year: artist.birthday,
          death_year: artist.deathday,
          nationality: artist.nationality,
          image: artist._links?.thumbnail?.href && artist._links.thumbnail.href !== '/assets/shared/missing_image.png'
          ? artist._links.thumbnail.href
          : 'images/artsy_logo.svg'
        }));
      },
      error: () => {
        this.similarArtists = [];
      }
    });
  }

  addToFavorites(artist: any): void {
    this.favoritesService.addFavorite({
      artistId: artist.id,
      name: artist.name,
      image: artist.image,
      timestamp: new Date().toISOString(),
      birth_year: this.selectedArtist?.birth_year,
      death_year: this.selectedArtist?.death_year,
      nationality: this.selectedArtist?.nationality
    }).subscribe({
      next: () => {
        this.favorites.add(artist.id);
        alert('Added to favorites!');
      },
      error: (err) => {
        alert(err.error?.message || 'Error adding to favorites');
      }
    });
  }

  removeFromFavorites(artistId: string): void {
    this.favoritesService.removeFavorite(artistId).subscribe({
      next: () => this.favorites.delete(artistId),
      error: () => alert('Error removing from favorites')
    });
  }

  toggleFavorite(event: Event, artist: any): void {
    event.stopPropagation();
    if (this.isFavorite(artist.id)) {
      this.removeFromFavorites(artist.id);
    } else {
      this.addToFavorites(artist);
    }
  }

  isFavorite(artistId: string): boolean {
    return this.favorites.has(artistId);
  }

  private loadFavorites(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (list) => {
        this.favorites = new Set(list.map((fav: any) => fav.artistId));
      },
      error: () => {
        this.favorites.clear();
      }
    });
  }

  openCategoryModal(artwork: any): void {
    const modalRef = this.modalService.open(CategoryModalComponent, { size: 'lg' });
    modalRef.componentInstance.artwork = artwork;
  }
  onImageError(artist: any): void {
    artist.image = 'images/artsy_logo.svg'; // or '/static/images/artsy_logo.svg' depending on your setup
  }
}
