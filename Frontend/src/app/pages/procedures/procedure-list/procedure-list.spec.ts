import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcedureList } from './procedure-list';

describe('ProcedureList', () => {
  let component: ProcedureList;
  let fixture: ComponentFixture<ProcedureList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcedureList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcedureList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
