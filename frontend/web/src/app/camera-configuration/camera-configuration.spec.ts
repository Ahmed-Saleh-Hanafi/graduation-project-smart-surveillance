import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraConfiguration } from './camera-configuration';

describe('CameraConfiguration', () => {
  let component: CameraConfiguration;
  let fixture: ComponentFixture<CameraConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraConfiguration],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraConfiguration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
