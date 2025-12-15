import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessesComponent } from './processes.component';

describe('Processes', () => {
  let component: ProcessesComponent;
  let fixture: ComponentFixture<ProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
