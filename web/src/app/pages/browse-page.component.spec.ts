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

describe('BrowsePageComponent - Pagination URL Synchronization', () => {
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

  it('navigates with page number queryParam when setPage(2) is called', () => {
    (component as unknown as { setPage: (p: number) => void }).setPage(2);
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: { page: 2 },
      queryParamsHandling: 'merge'
    });
  });

  it('navigates with page: null when returning to page 1', () => {
    (component as unknown as { setPage: (p: number) => void }).setPage(2);
    router.navigate.calls.reset();
    (component as unknown as { setPage: (p: number) => void }).setPage(1);
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: { page: null },
      queryParamsHandling: 'merge'
    });
  });

  it('initializes currentPage from queryParamMap page parameter', () => {
    queryParamMapSubject.next(convertToParamMap({ page: '3' }));
    fixture.detectChanges();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(3);
  });

  it('resets currentPage to 1 when filters are changed', () => {
    queryParamMapSubject.next(convertToParamMap({ page: '2' }));
    fixture.detectChanges();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(2);

    (component as unknown as { setFilters: (f: unknown) => void }).setFilters({
      keyword: 'mario',
      tag: null,
      translatorId: null,
      system: null,
      sortBy: 'updateDate',
      sortDirection: 'desc'
    });
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(1);
  });

  it('clamps currentPage to totalPages if page in URL exceeds maximum pages', () => {
    queryParamMapSubject.next(convertToParamMap({ page: '999' }));
    fixture.detectChanges();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(3);
  });

  it('defaults to page 1 for invalid page numbers in URL', () => {
    queryParamMapSubject.next(convertToParamMap({ page: '-5' }));
    fixture.detectChanges();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(1);

    queryParamMapSubject.next(convertToParamMap({ page: 'not-a-number' }));
    fixture.detectChanges();
    expect((component as unknown as { currentPage: () => number }).currentPage()).toBe(1);
  });
});
