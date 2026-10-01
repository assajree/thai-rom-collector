import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameListControlsComponent } from './game-list-controls.component';
import { FormsModule } from '@angular/forms';

describe('GameListControlsComponent', () => {
  let component: GameListControlsComponent;
  let fixture: ComponentFixture<GameListControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameListControlsComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(GameListControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should not show clear button when keyword is empty', () => {
    component.draft.keyword = '';
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.search-clear-btn');
    expect(clearBtn).toBeNull();
  });

  it('should show clear button when keyword has text', () => {
    component.draft.keyword = 'Mario';
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.search-clear-btn');
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.getAttribute('aria-label')).toBe('ล้างข้อความค้นหา');
  });

  it('should clear keyword, emit event, and focus input when clear button is clicked', () => {
    spyOn(component.filtersChanged, 'emit');
    component.draft.keyword = 'Chrono Trigger';
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('#game-search') as HTMLInputElement;
    spyOn(searchInput, 'focus');

    const clearBtn = fixture.nativeElement.querySelector('.search-clear-btn') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(component.draft.keyword).toBe('');
    expect(component.filtersChanged.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      keyword: ''
    }));
    expect(searchInput.focus).toHaveBeenCalled();
  });

  it('renders "ความยาวเกม" option in sort select', () => {
    const select = fixture.nativeElement.querySelector('#sort-patches') as HTMLSelectElement;
    const playTimeOption = Array.from(select.options).find(opt => opt.value === 'playTime');
    expect(playTimeOption).toBeTruthy();
    expect(playTimeOption?.textContent?.trim()).toBe('ความยาวเกม');
  });

  it('displays direction toggle button text as "น้อย → มาก" for asc and "มาก → น้อย" for desc', () => {
    component.draft.sortDirection = 'asc';
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.sort-field--sort .button') as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('น้อย → มาก');

    component.draft.sortDirection = 'desc';
    fixture.detectChanges();
    expect(btn.textContent?.trim()).toBe('มาก → น้อย');
  });
});
