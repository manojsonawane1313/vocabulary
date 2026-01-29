import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService, WordResponse, WordEntity } from '../../services/main-service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, Subscription } from 'rxjs';
import { Router } from '@angular/router';

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

  viewMode: 'search' | 'history' | 'progress' = 'search';
  selectedHistoryId: string | null = null; 

  constructor(
    private dictionaryService: MainService,
    private cdr: ChangeDetectorRef,
    private router: Router 
  ) {}

  ngOnInit() {
  this.searchSubscription = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => {
      if (term.length < 2) {
        this.suggestions = [];
        this.isValidWord = false; // Disable if too short
        return of([]);
      }

      this.isChecking = true;
      // We no longer set isValidWord here based on Regex alone
      return this.dictionaryService.getSuggestions(term);
    })
  ).subscribe({
    next: (list: string[]) => {
      this.suggestions = list;
      this.isChecking = false;

      // NEW LOGIC: Enable button ONLY if the typed word is exactly in the suggestion list
      // We use case-insensitive comparison for better UX
      this.isValidWord = list.some(s => s.toLowerCase() === this.searchTerm.toLowerCase());
      
      this.cdr.detectChanges();
    }
  });
}

onTyping() {
  this.isValidWord = false; // Lock the button immediately when user starts typing
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

switchToMastery() {
  this.viewMode = 'history'; // Represents "Mastered"
  this.selectedHistoryId = null; 
  this.fetchMastery();
}

switchToProgress() {
  this.viewMode = 'progress'; // Now this matches your template check!
  this.selectedHistoryId = null; 
  this.fetchProgress();
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

  fetchMastery() {
    this.isLoading = true;
    this.dictionaryService.getMastery().subscribe({
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

  fetchProgress() {
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

  // 1. Determine which service method to use
  const deleteObservable = this.viewMode === 'progress' 
    ? this.dictionaryService.deleteCurrentWord(id)  // For In Progress
    : this.dictionaryService.deleteWord(id);         // For Mastered

  // 2. Execute the delete
  deleteObservable.subscribe({
    next: () => {
      // Remove from the local array so the UI updates immediately
      this.history = this.history.filter(item => (item.id || (item as any)._id) !== id);
      
      if (this.selectedHistoryId === id) {
        this.selectedHistoryId = null;
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Delete failed:', err);
      this.errorMsg = 'Could not delete the word. Please try again.';
      this.cdr.detectChanges();
    }
  });
}

  quiz() {
    // Navigate back to home route
    this.router.navigate(['/quiz']); 
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }
}