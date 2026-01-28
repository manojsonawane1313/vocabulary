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

@Injectable({
  providedIn: 'root',
})
export class MainService {
  // Use 127.0.0.1 instead of localhost
  private apiUrl = 'http://127.0.0.1:8080/api/dictionary/lookup'; 

  constructor(private http: HttpClient) { }

  getWordData(word: string): Observable<WordResponse> {
    return this.http.get<WordResponse>(`${this.apiUrl}?word=${word}`);
  }
}