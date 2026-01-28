import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Quize } from './quize';

describe('Quize', () => {
  let component: Quize;
  let fixture: ComponentFixture<Quize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quize]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Quize);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
