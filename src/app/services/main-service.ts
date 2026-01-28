import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export interface WordResponse {
  word: string;
  language: string;
  meaning: string;
  explanation: string;
  examples: { marathi: string; english: string }[];
}

export interface WordEntity extends WordResponse {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private baseUrl = 'http://127.0.0.1:8080/api/dictionary'; 
  // Public API fallback for suggestions if backend doesn't support it yet
  private suggestionUrl = 'https://api.datamuse.com/sug?s=';

  constructor(private http: HttpClient) { }

  getWordData(word: string): Observable<WordResponse> {
    return this.http.get<WordResponse>(`${this.baseUrl}/lookup?word=${word}`);
  }

  getSuggestions(word: string): Observable<string[]> {
    if (!word.trim()) return of([]);

    return this.http.get<any[]>(`${this.suggestionUrl}${word}`).pipe(
      map(results => results.map(res => res.word)),
      catchError(() => of([])) 
    );
  }


  saveToDb(data: WordResponse): Observable<WordResponse> {
    return this.http.post<WordResponse>(`${this.baseUrl}/save`, data);
  }

  getHistory(): Observable<WordEntity[]> {
    return this.http.get<WordEntity[]>(`${this.baseUrl}/history`);
  }

  deleteWord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}