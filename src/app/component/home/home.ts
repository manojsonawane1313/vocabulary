import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService, WordResponse, WordEntity } from '../../services/main-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  searchTerm: string = '';
  result: WordResponse | null = null;
  history: WordEntity[] = [];
  isLoading: boolean = false;
  errorMsg: string = '';
  
  viewMode: 'search' | 'history' = 'search';
  selectedHistoryId: string | null = null; 

  constructor(
    private dictionaryService: MainService,
    private cdr: ChangeDetectorRef 
  ) {}

  switchToSearch() {
    this.viewMode = 'search';
    this.errorMsg = '';
    this.cdr.detectChanges();
  }

  switchToHistory() {
    this.viewMode = 'history';
    this.selectedHistoryId = null; 
    this.fetchHistory();
  }

  toggleExpand(id: string) {
    this.selectedHistoryId = this.selectedHistoryId === id ? null : id;
    this.cdr.detectChanges();
  }

  search() {
    if (!this.searchTerm.trim()) return;

    this.isLoading = true;
    this.errorMsg = '';
    this.result = null;
    this.viewMode = 'search';
    this.cdr.detectChanges();

    this.dictionaryService.getWordData(this.searchTerm).subscribe({
      next: (data) => {
        this.result = data;
        this.isLoading = false;
        this.cdr.detectChanges(); 

        this.dictionaryService.saveToDb(data).subscribe({
          next: (savedData) => console.log('Saved to MongoDB:', savedData),
          error: (dbErr) => console.error('DB Save Error:', dbErr)
        });
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMsg = 'Could not find the word. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchHistory() {
    this.isLoading = true;
    this.dictionaryService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Failed to load history.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteEntry(id: string, event: Event) {
    event.stopPropagation(); // Prevents the card from expanding when clicking delete
    if (!confirm('Are you sure you want to delete this word?')) return;

    this.dictionaryService.deleteWord(id).subscribe({
      next: () => {
        this.history = this.history.filter(item => item.id !== id);
        if (this.selectedHistoryId === id) this.selectedHistoryId = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Delete failed:', err)
    });
  }
}