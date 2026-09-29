import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { StatusMessageService } from './shared/status-message.service';
import { TagRepository } from './repositories/tag.repository';
import { TranslatorRepository } from './repositories/translator.repository';
import { SystemRepository } from './repositories/system.repository';
import { ServerCostRepository } from './repositories/server-cost.repository';
import { PatchCacheService } from './services/patch-cache.service';
import { PatchRepository } from './repositories/patch.repository';
import { SidebarLinkRepository } from './repositories/sidebar-link.repository';
import { ArticleRepository } from './repositories/article.repository';
import { Patch } from './models/patch.models';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  const mockPatches: Patch[] = [
    {
      id: 'p1',
      updateDate: new Date().toISOString(),
      haveUpdateFlag: false,
      patchVersion: '1.0',
      gameTitle: 'Chrono Trigger',
      system: 'SFC',
      translatorId: 'trans1',
      translatedBy: 'G-Translators',
      patchTool: '',
      tags: ['tag1'],
      coverUrl: '',
      patchFileUrl: '',
      patchedRomUrl: 'https://rom.zip',
      referenceText: '',
      referenceUrl: '',
      walkthroughUrl: 'https://guide.html'
    },
    {
      id: 'p2',
      updateDate: '2020-01-01T00:00:00.000Z',
      haveUpdateFlag: false,
      patchVersion: '1.0',
      gameTitle: 'Final Fantasy VI',
      system: 'SFC',
      translatorId: 'trans1',
      translatedBy: 'G-Translators',
      patchTool: '',
      tags: ['tag1'],
      coverUrl: '',
      patchFileUrl: '',
      patchedRomUrl: '',
      referenceText: '',
      referenceUrl: '',
      walkthroughUrl: ''
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: signal(null),
            isAdmin: signal(false),
            isVip: signal(false)
          }
        },
        {
          provide: StatusMessageService,
          useValue: {
            message: signal(null),
            show: jasmine.createSpy('show'),
            clear: jasmine.createSpy('clear')
          }
        },
        {
          provide: TagRepository,
          useValue: {
            watchAll: () => of([{ id: 'tag1', name: 'RPG', slug: 'rpg' }]),
            refreshAll: jasmine.createSpy('refreshAll')
          }
        },
        {
          provide: TranslatorRepository,
          useValue: {
            watchAll: () => of([{ id: 'trans1', shortName: 'G-Trans', name: 'G-Translators' }]),
            refreshAll: jasmine.createSpy('refreshAll')
          }
        },
        {
          provide: SystemRepository,
          useValue: {
            watchAll: () => of([{ id: 'sys1', shortName: 'SFC', name: 'Super Famicom' }]),
            refreshAll: jasmine.createSpy('refreshAll')
          }
        },
        {
          provide: SidebarLinkRepository,
          useValue: {
            watchAll: () => of([])
          }
        },
        {
          provide: ArticleRepository,
          useValue: {
            watchAll: () => of([{ id: 'art1', title: 'คู่มือการเล่น', slug: 'guide-1', status: 'published' }]),
            refreshAll: jasmine.createSpy('refreshAll')
          }
        },
        {
          provide: ServerCostRepository,
          useValue: {
            read: () => Promise.resolve(null),
            getCached: () => null
          }
        },
        {
          provide: PatchCacheService,
          useValue: {
            lastUpdated: () => null,
            refreshRequested: signal(0),
            requestForceRefresh: jasmine.createSpy('requestForceRefresh')
          }
        },
        {
          provide: PatchRepository,
          useValue: {
            watchAll: () => of(mockPatches)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should calculate patch counts accurately', () => {
    const counts = (app as unknown as { patchCounts: () => {
      total: number;
      today: number;
      week: number;
      rom: number;
      walkthrough: number;
      bySystem: Record<string, number>;
      byTranslator: Record<string, number>;
      byTag: Record<string, number>;
    } }).patchCounts();

    expect(counts.total).toBe(2);
    expect(counts.today).toBe(1);
    expect(counts.week).toBe(1);
    expect(counts.rom).toBe(1);
    expect(counts.walkthrough).toBe(1);
    expect(counts.bySystem['sfc']).toBe(2);
    expect(counts.byTranslator['trans1']).toBe(2);
    expect(counts.byTag['tag1']).toBe(2);
  });

  it('should render counts in sidebar links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('เกมทั้งหมด (2)');
    expect(text).toContain('รอมแปลไทย (1)');
    expect(text).toContain('บทสรุป (1)');
  });

  it('should render published articles in sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('คู่มือการเล่น');
  });
});
