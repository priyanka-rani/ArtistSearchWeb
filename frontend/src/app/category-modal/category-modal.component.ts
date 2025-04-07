import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, NgbModalModule],
  templateUrl: './category-modal.component.html'
})
export class CategoryModalComponent implements OnInit {
  @Input() artwork!: any;

  loading = true;
  error = '';
  categories: any[] = [];

  constructor(public activeModal: NgbActiveModal, private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>(`/api/artworks/${this.artwork.id}/categories`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.loading = false;
        },
        error: () => {
          this.error = 'No categories.';
          this.loading = false;
        }
      });
  }
}