import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService, WordResponse, WordEntity } from '../../services/main-service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  searchTerm: string = '';
  result: WordResponse | null = null;
  history: WordEntity[] = [];
  isLoading: boolean = false;
  errorMsg: string = '';
  
  // Validation & Suggestion State
  suggestions: string[] = [];
  isValidWord: boolean = false; 
  isChecking: boolean = false;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  viewMode: 'search' | 'history' = 'search';
  selectedHistoryId: string | null = null; 

  constructor(
    private dictionaryService: MainService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    // Logic to fetch suggestions as the user types
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300), // Wait for user to stop typing
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          this.suggestions = [];
          this.isValidWord = false;
          return of([]);
        }
        this.isChecking = true;
        return this.dictionaryService.getSuggestions(term);
      })
    ).subscribe({
      next: (list: string[]) => {
        this.suggestions = list;
        // The word is considered "valid" if it exists in the suggestion list 
        // or if the list has results (indicating it's a real word)
        this.isValidWord = list.length > 0; 
        this.isChecking = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isChecking = false;
        this.isValidWord = false;
      }
    });
  }

  onTyping() {
    this.searchSubject.next(this.searchTerm);
  }

  selectSuggestion(word: string) {
    this.searchTerm = word;
    this.suggestions = [];
    this.isValidWord = true;
    this.search(); // Automatically trigger search on click
  }

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
  closeExpanded(event: Event) {
  event.stopPropagation();
  this.selectedHistoryId = null;
  this.cdr.detectChanges();
}


  search() {
    // Logic: Disable search if empty or if no valid suggestions were found
    if (!this.searchTerm.trim() || !this.isValidWord) return;

    this.isLoading = true;
    this.errorMsg = '';
    this.result = null;
    this.suggestions = []; 
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
        this.isValidWord = false;
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
    event.stopPropagation();
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

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }
}