import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService, WordResponse } from '../../services/main-service';

@Component({
  selector: 'app-home',
  standalone: true, // Ensuring standalone mode is explicit
  // REMOVED HttpClientModule from here because it's already in app.config.ts
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  searchTerm: string = '';
  result: WordResponse | null = null;
  isLoading: boolean = false;
  errorMsg: string = '';

  constructor(
    private dictionaryService: MainService,
    private cdr: ChangeDetectorRef // Injected to force UI updates
  ) {}

  search() {
    if (!this.searchTerm.trim()) return;

    this.isLoading = true;
    this.errorMsg = '';
    this.result = null;

    // Trigger change detection to show the loading spinner immediately
    this.cdr.detectChanges();

    this.dictionaryService.getWordData(this.searchTerm).subscribe({
      next: (data) => {
        this.result = data;
        this.isLoading = false;
        
        // This is the "Magic Fix": 
        // It tells Angular to update the HTML immediately 
        // without waiting for a click or tab.
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMsg = 'Could not find the word. Please try again.';
        this.isLoading = false;
        
        // Update UI to show the error message immediately
        this.cdr.detectChanges();
      }
    });
  }
}