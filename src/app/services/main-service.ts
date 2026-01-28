import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WordResponse {
  word: string;
  language: string;
  meaning: string;
  explanation: string;
  examples: { marathi: string; english: string }[];
}

// Inherit everything from WordResponse but add the MongoDB ID
export interface WordEntity extends WordResponse {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private baseUrl = 'http://127.0.0.1:8080/api/dictionary'; 

  constructor(private http: HttpClient) { }

  getWordData(word: string): Observable<WordResponse> {
    return this.http.get<WordResponse>(`${this.baseUrl}/lookup?word=${word}`);
  }

  saveToDb(data: WordResponse): Observable<WordResponse> {
    return this.http.post<WordResponse>(`${this.baseUrl}/save`, data);
  }

  // --- NEW: FETCH ALL ---
  getHistory(): Observable<WordEntity[]> {
    return this.http.get<WordEntity[]>(`${this.baseUrl}/history`);
  }

  // --- NEW: DELETE BY ID ---
  deleteWord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }
}