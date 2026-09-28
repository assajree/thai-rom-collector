import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { BrowsePageComponent } from './browse-page.component';
import { PatchRepository } from '../repositories/patch.repository';
import { TranslatorRepository } from '../repositories/translator.repository';
import { TagRepository } from '../repositories/tag.repository';
import { SystemRepository } from '../repositories/system.repository';
import { PatchCacheService } from '../services/patch-cache.service';
import { AuthService } from '../services/auth.service';
import { BrowseFilterStateService } from '../shared/browse-filter-state.service';
import { Patch } from '../models/patch.models';

describe('BrowsePageComponent - Load More Functionality', () => {
  let component: BrowsePageComponent;
  let fixture: ComponentFixture<BrowsePageComponent>;
  let router: jasmine.SpyObj<Router>;
  let queryParamMapSubject: BehaviorSubject<ParamMap>;

  const mockPatches: Patch[] = Array.from({ length: 25 }, (_, i) => ({
    id: `patch-${i + 1}`,
    gameTitle: `Game ${i + 1}`,
    system: 'SNES',
    patchVersion: '1.0',
    translatedBy: 'Team A',
    translatorId: 'translator-1',
    haveUpdateFlag: false,
    patchTool: '',
    referenceText: '',
    referenceUrl: '',
    patchFileUrl: '',
    patchedRomUrl: '',
    walkthroughUrl: '',
    coverUrl: '',
    tags: [],
    updateDate: '2026-01-01T00:00:00Z'
  }));

  beforeEach(async () => {
    queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [BrowsePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PatchRepository,
          useValue: { watchAll: () => of(mockPatches) }
        },
        {
          provide: TranslatorRepository,
          useValue: { watchAll: () => of([]) }
        },
        {
          provide: TagRepository,
          useValue: { watchAll: () => of([]) }
        },
        {
          provide: SystemRepository,
          useValue: { watchAll: () => of([]) }
        },
        {
          provide: PatchCacheService,
          useValue: { refreshRequested: () => 0 }
        },
        {
          provide: AuthService,
          useValue: { isAdmin: () => false }
        },
        BrowseFilterStateService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            paramMap: of(convertToParamMap({})),
            queryParamMap: queryParamMapSubject.asObservable(),
            snapshot: {
              data: {},
              queryParamMap: convertToParamMap({})
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture = TestBed.createComponent(BrowsePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with 10 patches displayed', () => {
    expect((component as unknown as { paginatedPatches: () => Patch[] }).paginatedPatches().length).toBe(10);
  });

  it('increments displayed patches by 10 when loadMore() is called without adding page queryParam', () => {
    (component as unknown as { loadMore: () => void }).loadMore();
    expect((component as unknown as { paginatedPatches: () => Patch[] }).paginatedPatches().length).toBe(20);
    expect(router.navigate).not.toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ page: jasmine.anything() })
    }));
  });

  it('hasMore becomes false when all patches are loaded', () => {
    expect((component as unknown as { hasMore: () => boolean }).hasMore()).toBeTrue();
    (component as unknown as { loadMore: () => void }).loadMore(); // 20
    (component as unknown as { loadMore: () => void }).loadMore(); // 25 (all)
    expect((component as unknown as { paginatedPatches: () => Patch[] }).paginatedPatches().length).toBe(25);
    expect((component as unknown as { hasMore: () => boolean }).hasMore()).toBeFalse();
  });

  it('resets currentPage to 1 when filters are changed', () => {
    (component as unknown as { loadMore: () => void }).loadMore();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(2);

    (component as unknown as { setFilters: (f: unknown) => void }).setFilters({
      keyword: 'Game 1',
      tag: null,
      translatorId: null,
      system: null,
      sortBy: 'updateDate',
      sortDirection: 'desc'
    });
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(1);
  });

  it('does not read page parameter from URL query params', () => {
    queryParamMapSubject.next(convertToParamMap({ page: '3' }));
    fixture.detectChanges();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(1);
  });

  it('hides floating add game button when app-topbar is visible in viewport', () => {
    const topbar = document.createElement('div');
    topbar.className = 'app-topbar';
    document.body.appendChild(topbar);
    spyOn(topbar, 'getBoundingClientRect').and.returnValue({
      bottom: 50,
      top: 0,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    (component as unknown as { updateFloatingAddGameVisibility: () => void }).updateFloatingAddGameVisibility();
    expect((component as unknown as { showFloatingAddGame: () => boolean }).showFloatingAddGame()).toBeFalse();

    document.body.removeChild(topbar);
  });

  it('shows floating add game button when app-topbar is scrolled past viewport', () => {
    const topbar = document.createElement('div');
    topbar.className = 'app-topbar';
    document.body.appendChild(topbar);
    spyOn(topbar, 'getBoundingClientRect').and.returnValue({
      bottom: -10,
      top: -60,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: -60,
      toJSON: () => {}
    });

    (component as unknown as { updateFloatingAddGameVisibility: () => void }).updateFloatingAddGameVisibility();
    expect((component as unknown as { showFloatingAddGame: () => boolean }).showFloatingAddGame()).toBeTrue();

    document.body.removeChild(topbar);
  });
});
