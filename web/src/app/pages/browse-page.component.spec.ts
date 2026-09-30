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

  it('does not render floating add game button when user is not admin', () => {
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'isAdmin').and.returnValue(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.floating-add-game')).toBeNull();
  });

  it('renders floating add game button when user is admin regardless of scroll position', () => {
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'isAdmin').and.returnValue(true);
    fixture.detectChanges();
    const floatingBtn = fixture.nativeElement.querySelector('.floating-add-game');
    expect(floatingBtn).toBeTruthy();
    expect(floatingBtn.getAttribute('routerLink')).toBe('/add-patch');
  });

  it('renders back to top button below floating add game inside browse-floating-actions', () => {
    const authService = TestBed.inject(AuthService);
    spyOn(authService, 'isAdmin').and.returnValue(true);
    (component as unknown as { showBackToTop: { set: (v: boolean) => void } }).showBackToTop.set(true);
    fixture.detectChanges();

    const actionsContainer = fixture.nativeElement.querySelector('.browse-floating-actions');
    expect(actionsContainer).toBeTruthy();
    const children = actionsContainer.children;
    expect(children.length).toBe(2);
    expect(children[0].classList.contains('floating-add-game')).toBeTrue();
    expect(children[1].classList.contains('back-to-top')).toBeTrue();
  });

  it('calculates total play time stats correctly and renders HUD stat bar with formatted duration', () => {
    const patchesSignal = (component as unknown as { patches: { set: (v: Patch[]) => void } }).patches;
    patchesSignal.set([
      { ...mockPatches[0], id: 'p1', playTime: 12.5 },
      { ...mockPatches[1], id: 'p2', playTime: 20 },
      { ...mockPatches[2], id: 'p3', playTime: null }
    ]);
    fixture.detectChanges();

    const stats = (component as unknown as { playTimeStats: () => { formattedDuration: string; count: number; hasData: boolean } }).playTimeStats();
    expect(stats.hasData).toBeTrue();
    expect(stats.formattedDuration).toBe('1 วัน 8.5 ชั่วโมง');
    expect(stats.count).toBe(2);

    const statBar = fixture.nativeElement.querySelector('.browse-stat-bar');
    expect(statBar).toBeTruthy();
    expect(statBar.textContent).toContain('1 วัน 8.5 ชั่วโมง');
    expect(statBar.textContent).toContain('(จาก 2 เกม)');
  });

  it('formats large duration into years, months, days, and hours correctly', () => {
    const patchesSignal = (component as unknown as { patches: { set: (v: Patch[]) => void } }).patches;
    // 8760 (1 year) + 720 (1 month) + 48 (2 days) + 3 hours = 9531 hours
    patchesSignal.set([
      { ...mockPatches[0], id: 'p1', playTime: 9531 }
    ]);
    fixture.detectChanges();

    const stats = (component as unknown as { playTimeStats: () => { formattedDuration: string } }).playTimeStats();
    expect(stats.formattedDuration).toBe('1 ปี 1 เดือน 2 วัน 3 ชั่วโมง');
  });

  it('does not render HUD stat bar when no games have play time', () => {
    const patchesSignal = (component as unknown as { patches: { set: (v: Patch[]) => void } }).patches;
    patchesSignal.set([
      { ...mockPatches[0], id: 'p1', playTime: null },
      { ...mockPatches[1], id: 'p2', playTime: 0 }
    ]);
    fixture.detectChanges();

    const stats = (component as unknown as { playTimeStats: () => { hasData: boolean } }).playTimeStats();
    expect(stats.hasData).toBeFalse();

    const statBar = fixture.nativeElement.querySelector('.browse-stat-bar');
    expect(statBar).toBeNull();
  });
});
