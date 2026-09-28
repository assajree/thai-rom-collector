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
});
