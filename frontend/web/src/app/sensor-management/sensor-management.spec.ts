import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorManagement } from './sensor-management';

describe('SensorManagement', () => {
  let component: SensorManagement;
  let fixture: ComponentFixture<SensorManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(SensorManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
