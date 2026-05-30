import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiSchedule } from './ai-schedule';

describe('AiSchedule', () => {
  let component: AiSchedule;
  let fixture: ComponentFixture<AiSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(AiSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
