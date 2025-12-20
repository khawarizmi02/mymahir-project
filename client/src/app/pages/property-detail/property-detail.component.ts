import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { PropertyApiService, Property } from '../../services/property-api.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.scss'],
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyApiService);
  private sanitizer = inject(DomSanitizer);

  property = signal<Property | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentImageIndex = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(+id);
    }
  }

  loadProperty(id: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.propertyService.getPropertyById(id).subscribe({
      next: (response) => {
        this.property.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load property');
        this.isLoading.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/properties']);
  }

  getSafeHtml(html: string | null | undefined): SafeHtml {
    if (!html) return this.sanitizer.sanitize(1, '') || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getCurrentImage(): string {
    const images = this.property()?.images || [];
    if (images.length === 0) {
      return 'https://via.placeholder.com/600x400?text=No+Image';
    }
    return images[this.currentImageIndex()].url;
  }

  previousImage() {
    const images = this.property()?.images || [];
    if (images.length === 0) return;

    let newIndex = this.currentImageIndex() - 1;
    if (newIndex < 0) {
      newIndex = images.length - 1;
    }
    this.currentImageIndex.set(newIndex);
  }

  nextImage() {
    const images = this.property()?.images || [];
    if (images.length === 0) return;

    let newIndex = this.currentImageIndex() + 1;
    if (newIndex >= images.length) {
      newIndex = 0;
    }
    this.currentImageIndex.set(newIndex);
  }

  contactLandlord() {
    const email = this.property()?.landlord.email;
    if (email) {
      window.location.href = `mailto:${email}?subject=Inquiry about ${this.property()?.title}`;
    }
  }

  getTotalImages(): number {
    return this.property()?.images?.length || 0;
  }
}
