import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateIdComponent } from './generate-id.component';

describe('GenerateIdComponent', () => {
  let component: GenerateIdComponent;
  let fixture: ComponentFixture<GenerateIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenerateIdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
