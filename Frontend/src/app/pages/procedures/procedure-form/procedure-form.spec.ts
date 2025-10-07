import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcedureForm } from './procedure-form';

describe('ProcedureForm', () => {
  let component: ProcedureForm;
  let fixture: ComponentFixture<ProcedureForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcedureForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcedureForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
