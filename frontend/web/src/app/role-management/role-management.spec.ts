import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleManagement } from './role-management';

describe('RoleManagement', () => {
  let component: RoleManagement;
  let fixture: ComponentFixture<RoleManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
