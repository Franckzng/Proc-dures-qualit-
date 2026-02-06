import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SearchService, SearchFilters } from '../../../services/search.service';
import { Procedure } from '../../../models/procedure.model';

@Component({
  selector: 'app-search-advanced',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-advanced.component.html',
  styleUrls: ['./search-advanced.component.css']
})
export class SearchAdvancedComponent {
  private searchService = inject(SearchService);

  filters: SearchFilters = {};
  results = signal<Procedure[]>([]);
  loading = signal(false);
  departments = signal<any[]>([]);
  
  statutOptions = [
    { value: 'BROUILLON', label: 'Brouillon' },
    { value: 'EN_REVISION', label: 'En révision' },
    { value: 'EN_APPROBATION', label: 'En approbation' },
    { value: 'APPROUVEE', label: 'Approuvée' },
    { value: 'PUBLIEE', label: 'Publiée' },
    { value: 'REJETEE', label: 'Rejetée' },
    { value: 'ARCHIVEE', label: 'Archivée' }
  ];

  selectedStatuts: string[] = [];

  toggleStatut(statut: string) {
    const index = this.selectedStatuts.indexOf(statut);
    if (index > -1) {
      this.selectedStatuts.splice(index, 1);
    } else {
      this.selectedStatuts.push(statut);
    }
  }

  search() {
    this.loading.set(true);
    this.filters.statut = this.selectedStatuts.length > 0 ? this.selectedStatuts : undefined;
    
    this.searchService.advancedSearch(this.filters).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  reset() {
    this.filters = {};
    this.selectedStatuts = [];
    this.results.set([]);
  }

  getStatutBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      'BROUILLON': 'bg-secondary',
      'EN_REVISION': 'bg-info',
      'EN_APPROBATION': 'bg-warning',
      'APPROUVEE': 'bg-success',
      'PUBLIEE': 'bg-primary',
      'REJETEE': 'bg-danger',
      'ARCHIVEE': 'bg-dark'
    };
    return classes[statut] || 'bg-secondary';
  }
}
