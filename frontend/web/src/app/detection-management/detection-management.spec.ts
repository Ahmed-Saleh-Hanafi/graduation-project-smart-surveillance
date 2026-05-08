import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectionManagement } from './detection-management';

describe('DetectionManagement', () => {
  let component: DetectionManagement;
  let fixture: ComponentFixture<DetectionManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetectionManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(DetectionManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
