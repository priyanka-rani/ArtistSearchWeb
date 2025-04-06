import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  isAuthenticated: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  searchArtists(): void {
    if (!this.searchQuery.trim()) return;

    this.loading = true;
    this.errorMessage = '';
    this.selectedArtistId = null;

    this.http.get<{ artists: any[] }>(`/api/search?query=${this.searchQuery}`).subscribe({
      next: (data: { artists: any[] }) => {
        if (!data.artists.length) {
          this.errorMessage = 'No results.';
          this.artists = [];
        } else {
          this.artists = data.artists.map((artist: any) => ({
            id: artist.id,
            name: artist.title,
            image: artist.links?.thumbnail?.href !== "/assets/shared/missing_image.png"
              ? artist.links.thumbnail.href
              : "images/artsy_logo.svg"
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
  }

  selectArtist(artist: any): void {
    this.selectedArtistId = artist.id;
    this.selectedArtist = null;
    this.artworks = [];
    this.activeTab = 'info';
    this.loadingDetails = true;

    this.http.get<any>(`/api/artists/${artist.id}`).subscribe({
      next: (data: any) => {
        this.selectedArtist = {
          id: data.id,
          name: data.name,
          biography: data.biography,
          nationality: data.nationality,
          birth_year: data.birthday,
          death_year: data.deathday
        };
        this.loadingDetails = false;
      },
      error: () => {
        this.selectedArtist = null;
        this.errorMessage = 'Could not load artist details.';
        this.loadingDetails = false;
      }
    });

    this.http.get<any[]>(`/api/artists/${artist.id}/artworks`).subscribe({
      next: (data: any[]) => {
        this.artworks = data.map((artwork: any) => ({
          title: artwork.title,
          date: artwork.date,
          image: artwork.links?.thumbnail?.href || 'images/artsy_logo.svg'
        }));
      },
      error: () => {
        this.artworks = [];
      }
    });
  }

  toggleFavorite(event: Event, artist: any): void {
    event.stopPropagation();
    if (this.favorites.has(artist.id)) {
      this.favorites.delete(artist.id);
    } else {
      this.favorites.add(artist.id);
    }
    // Optional: call backend to update favorite status
  }

  isFavorite(artistId: string): boolean {
    return this.favorites.has(artistId);
  }
}