import { Component, OnInit, inject } from '@angular/core'; // 1. Add inject
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 
import { MainService, WordEntity } from '../../services/main-service';

@Component({
  selector: 'app-quize',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quize.html',
  styleUrl: './quize.css',
})
export class Quize implements OnInit {
  // 2. Use inject instead of constructor injection
  private dictionaryService = inject(MainService);
  private router = inject(Router);

  allWords: WordEntity[] = [];
  remainingWords: WordEntity[] = [];
  currentWord?: WordEntity;
  options: string[] = [];
  
  score = 0;
  answered = false;
  selectedAnswer: string | null = null;
  quizComplete = false;

  // 3. Keep constructor empty or remove it
  constructor() {}

  ngOnInit() {
    this.fetchAllWords();
  }
  
  // ... rest of your code


  fetchAllWords() {
    this.dictionaryService.getHistory().subscribe({
      next: (words: WordEntity[]) => {
        if (words && words.length > 0) {
          this.allWords = [...words];
          this.remainingWords = [...words];
          this.generateQuestion();
        }
      },
      error: (err) => console.error('Failed to fetch words:', err)
    });
  }

  generateQuestion() {
    // If no words left in pool, trigger completion
    if (this.remainingWords.length === 0) {
      this.quizComplete = true;
      this.currentWord = undefined; // Clear the word to stop the "stuck" UI
      return;
    }

    this.answered = false;
    this.selectedAnswer = null;

    // Pick and remove a word
    const randomIndex = Math.floor(Math.random() * this.remainingWords.length);
    this.currentWord = this.remainingWords.splice(randomIndex, 1)[0];

    // Get 3 distractors from the full list
    const distractors = this.allWords
      .filter(w => w.word !== this.currentWord?.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.meaning);

    // Combine and shuffle
    this.options = [this.currentWord.meaning, ...distractors].sort(() => 0.5 - Math.random());
  }

  nextQuestion() {
    this.generateQuestion();
  }

  checkAnswer(choice: string) {
    if (this.answered) return;
    this.answered = true;
    this.selectedAnswer = choice;
    if (choice === this.currentWord?.meaning) {
      this.score++;
    }
  }

  goHome() {
    // Navigate back to home route
    this.router.navigate(['/']); 
  }
}