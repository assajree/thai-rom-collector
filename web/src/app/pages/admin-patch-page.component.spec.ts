import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AdminPatchPageComponent } from './admin-patch-page.component';
import { TranslatorRepository } from '../repositories/translator.repository';
import { TagRepository } from '../repositories/tag.repository';
import { SystemRepository } from '../repositories/system.repository';
import { PatchRepository } from '../repositories/patch.repository';
import { CoverStorageService } from '../services/cover-storage.service';
import { StatusMessageService } from '../shared/status-message.service';
import { ParamMap, convertToParamMap } from '@angular/router';

/**
 * Bug Condition Exploration Test - Property 1
 *
 * Validates: Requirements 1.1, 1.2
 *
 * EXPECTED: This test FAILS on unfixed code.
 * Failure confirms the bug exists: save() in edit mode does not call
 * router.navigate(['/add-patch'], { replaceUrl: true }) and does not clear editId.
 *
 * Bug condition (isBugCondition):
 *   editId IS NOT NULL AND saveJustCompleted = true
 */
describe('AdminPatchPageComponent - Bug Condition Exploration', () => {
  let component: AdminPatchPageComponent;
  let routerNavigateSpy: jasmine.Spy;
  let paramMapSubject: Subject<ParamMap>;

  // Minimal stub for PatchRepository - update() resolves successfully to simulate a successful save
  const patchRepositoryStub = {
    watchAll: () => of([]),
    getById: jasmine.createSpy('getById').and.returnValue(Promise.resolve(undefined)),
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve('new-id')),
    update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
  };

  const translatorRepositoryStub = {
    watchAll: () => of([]),
  };

  const tagRepositoryStub = {
    watchAll: () => of([]),
  };

  const systemRepositoryStub = {
    watchAll: () => of([]),
  };

  const coverStorageStub = {
    upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve('http://cover-url')),
    remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve()),
  };

  const statusMessageStub = {
    show: jasmine.createSpy('show'),
  };

  beforeEach(async () => {
    // Reset spies between tests
    patchRepositoryStub.update.calls.reset();
    patchRepositoryStub.create.calls.reset();
    statusMessageStub.show.calls.reset();

    paramMapSubject = new Subject<ParamMap>();

    await TestBed.configureTestingModule({
      imports: [AdminPatchPageComponent, ReactiveFormsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
            navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
          },
        },
        { provide: TranslatorRepository, useValue: translatorRepositoryStub },
        { provide: TagRepository, useValue: tagRepositoryStub },
        { provide: SystemRepository, useValue: systemRepositoryStub },
        { provide: PatchRepository, useValue: patchRepositoryStub },
        { provide: CoverStorageService, useValue: coverStorageStub },
        { provide: StatusMessageService, useValue: statusMessageStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminPatchPageComponent);
    component = fixture.componentInstance;

    // Grab the router spy after TestBed is created
    routerNavigateSpy = TestBed.inject(Router).navigate as jasmine.Spy;

    // Emit an initial null paramMap so constructor subscription doesn't hang
    paramMapSubject.next(convertToParamMap({}));
    fixture.detectChanges();
  });

  /**
   * Property 1: Bug Condition - URL Not Reset After Save in Edit Mode
   *
   * Validates: Requirements 1.1, 1.2
   *
   * For any non-null patch ID (editId != null) when save() completes successfully,
   * the component SHALL call router.navigate(['/add-patch'], { replaceUrl: true })
   * and editId SHALL be null after save completes.
   *
   * EXPECTED TO FAIL on unfixed code - this failure IS the success criterion for Task 1.
   * Counterexamples: router.navigate not called; editId still 'patch-abc123' after save.
   */
  it('Property 1 (Bug Condition): save() in edit mode should navigate to /add-patch and clear editId', async () => {
    // Use type cast to access protected members from outside the class in tests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comp = component as any;

    // Arrange: simulate edit mode by setting editId to a non-null patch ID
    comp.editId = 'patch-abc123';

    // Fill the form with valid values required to pass the form.invalid guard
    comp.form.controls.updateDate.setValue('2024-01-15T10:00');
    comp.form.controls.gameTitle.setValue('Test Game');
    comp.form.controls.system.setValue('SNES');
    comp.form.controls.translatorId.setValue('translator-001');

    // Act: call save() - it should succeed because patchRepository.update resolves
    await comp.save();

    // Assert 1: router.navigate(['/add-patch'], { replaceUrl: true }) must have been called
    // ON UNFIXED CODE: this will FAIL because save() never calls router.navigate
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/add-patch'], { replaceUrl: true });

    // Assert 2: editId must be null after save completes
    // ON UNFIXED CODE: this will FAIL because save() never clears editId
    expect(comp.editId).toBeNull();
  });
});

/**
 * Preservation Property Tests - Property 2
 *
 * Validates: Requirements 2.3, 3.1, 3.2, 3.3
 *
 * These tests MUST PASS on unfixed code — they establish baseline behavior for all
 * non-buggy inputs (cases where isBugCondition returns false).
 *
 * Covered preservation requirements:
 *  2.3 - save() in add-new mode (editId = null) does NOT navigate — URL stays at /add-patch
 *  3.1 - save() in add-new mode resets form, clears cover, scrolls to top, shows success toast
 *  3.2 - confirmDelete() navigates to '/' via router.navigateByUrl('/', { replaceUrl: true })
 *  3.3 - loadEditRecord(id) with preserveFormOnNextLoad=false populates the form from Firestore
 */
describe('AdminPatchPageComponent - Preservation Properties', () => {
  // -------------------------------------------------------------------------
  // Shared test infrastructure (mirrors the Bug Condition describe block above)
  // -------------------------------------------------------------------------

  let component: AdminPatchPageComponent;
  let routerNavigateSpy: jasmine.Spy;
  let routerNavigateByUrlSpy: jasmine.Spy;
  let paramMapSubject: Subject<ParamMap>;

  const patchRepositoryStub = {
    watchAll: () => of([]),
    getById: jasmine.createSpy('getById').and.returnValue(Promise.resolve(undefined)),
    create: jasmine.createSpy('create').and.returnValue(Promise.resolve('new-id')),
    update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
  };

  const translatorRepositoryStub = { watchAll: () => of([]) };
  const tagRepositoryStub = { watchAll: () => of([]) };
  const systemRepositoryStub = { watchAll: () => of([]) };

  const coverInputSpy = { clear: jasmine.createSpy('clear') };

  const coverStorageStub = {
    upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve('http://cover-url')),
    remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve()),
  };

  const statusMessageStub = { show: jasmine.createSpy('show') };

  /** Helper: create a fresh TestBed and return the component instance. */
  async function buildComponent(): Promise<AdminPatchPageComponent> {
    patchRepositoryStub.update.calls.reset();
    patchRepositoryStub.create.calls.reset();
    patchRepositoryStub.delete.calls.reset();
    patchRepositoryStub.getById.calls.reset();
    statusMessageStub.show.calls.reset();
    coverInputSpy.clear.calls.reset();

    paramMapSubject = new Subject<ParamMap>();

    await TestBed.configureTestingModule({
      imports: [AdminPatchPageComponent, ReactiveFormsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
            navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
          },
        },
        { provide: TranslatorRepository, useValue: translatorRepositoryStub },
        { provide: TagRepository, useValue: tagRepositoryStub },
        { provide: SystemRepository, useValue: systemRepositoryStub },
        { provide: PatchRepository, useValue: patchRepositoryStub },
        { provide: CoverStorageService, useValue: coverStorageStub },
        { provide: StatusMessageService, useValue: statusMessageStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminPatchPageComponent);
    const comp = fixture.componentInstance;

    routerNavigateSpy = TestBed.inject(Router).navigate as jasmine.Spy;
    routerNavigateByUrlSpy = TestBed.inject(Router).navigateByUrl as jasmine.Spy;

    // Inject the CoverInput spy so clear() calls are trackable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (comp as any).coverInput = coverInputSpy;

    // Emit an initial null paramMap so the constructor subscription doesn't hang
    paramMapSubject.next(convertToParamMap({}));
    fixture.detectChanges();

    return comp;
  }

  /** Generator: produce diverse but valid patch IDs (alphanumeric, hyphens, length 1-36). */
  function generatePatchIds(count: number): string[] {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789-';
    const ids: string[] = [];
    // Deterministic seed so tests are repeatable
    let seed = 0xdeadbeef;
    const rand = () => { seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5; return (seed >>> 0) / 0xffffffff; };
    for (let i = 0; i < count; i++) {
      const len = 4 + Math.floor(rand() * 33); // 4..36
      let id = '';
      for (let j = 0; j < len; j++) id += chars[Math.floor(rand() * chars.length)];
      // Ensure it does not start/end with a hyphen (realistic constraint)
      ids.push(id.replace(/^-+|-+$/g, 'x') || 'patch-id-' + i);
    }
    return ids;
  }

  // -------------------------------------------------------------------------
  // Requirement 2.3 + 3.1 — save() in ADD-NEW mode (editId = null)
  // -------------------------------------------------------------------------

  /**
   * Property 2a (Preservation 2.3): For all valid patch IDs used as form content,
   * save() in add-new mode (editId = null) NEVER calls router.navigate.
   *
   * Validates: Requirement 2.3
   */
  it('Property 2a: save() in add-new mode never calls router.navigate for any form input', async () => {
    // Property-based approach: run the assertion over many distinct form states.
    // The component is fresh each iteration via TestBed.resetTestingModule().
    const sampleGameTitles = [
      'Final Fantasy VI', 'Dragon Quest III', 'Chrono Trigger', 'Zelda', 'Metroid',
      'Super Mario RPG', 'Contra III', 'Mega Man X', 'Street Fighter II', 'Kirby',
    ];

    for (const gameTitle of sampleGameTitles) {
      TestBed.resetTestingModule();
      const comp = await buildComponent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = comp as any;

      // Add-new mode: editId is null (default)
      expect(c.editId).toBeNull();

      c.form.controls.updateDate.setValue('2024-01-15T10:00');
      c.form.controls.gameTitle.setValue(gameTitle);
      c.form.controls.system.setValue('SNES');
      c.form.controls.translatorId.setValue('translator-001');

      await c.save();

      expect(routerNavigateSpy).not.toHaveBeenCalled();
    }
  });

  /**
   * Property 2b (Preservation 3.1): save() in add-new mode resets the form,
   * clears cover, scrolls to top, and shows success toast.
   *
   * Validates: Requirement 3.1
   */
  it('Property 2b: save() in add-new mode resets form, clears cover, scrolls to top, shows success toast', async () => {
    const comp = await buildComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = comp as any;

    // Arrange
    c.form.controls.updateDate.setValue('2024-01-15T10:00');
    c.form.controls.gameTitle.setValue('Test Game');
    c.form.controls.system.setValue('SNES');
    c.form.controls.translatorId.setValue('translator-001');

    // Spy on window.scrollTo to verify scroll call
    let scrollCalled = false;
    let scrollOptions: ScrollToOptions | undefined;
    spyOn(window, 'scrollTo').and.callFake((optionsOrX?: ScrollToOptions | number) => {
      scrollCalled = true;
      if (typeof optionsOrX === 'object') scrollOptions = optionsOrX;
    });

    await c.save();

    // Form should be reset: gameTitle cleared
    expect(c.form.controls.gameTitle.value).toBe('');

    // Cover input should be cleared
    expect(coverInputSpy.clear).toHaveBeenCalled();

    // scroll to top called
    expect(scrollCalled).toBeTrue();
    expect(scrollOptions).toEqual({ top: 0, behavior: 'smooth' });

    // Success toast shown
    expect(statusMessageStub.show).toHaveBeenCalledWith('บันทึกแพตช์สำเร็จ', 'success');
  });

  // -------------------------------------------------------------------------
  // Requirement 3.2 — confirmDelete() navigates to '/'
  // -------------------------------------------------------------------------

  /**
   * Property 2c (Preservation 3.2): For all valid patch IDs,
   * confirmDelete() always navigates to '/' via router.navigateByUrl('/', { replaceUrl: true }).
   *
   * Validates: Requirement 3.2
   */
  it('Property 2c: confirmDelete() always navigates to "/" for any non-null editId', async () => {
    const patchIds = generatePatchIds(20);

    for (const patchId of patchIds) {
      TestBed.resetTestingModule();
      const comp = await buildComponent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = comp as any;

      // Arrange: edit mode with this patch ID
      c.editId = patchId;
      c.deleteConfirmOpen = true; // pre-open the confirm dialog

      await c.confirmDelete();

      expect(routerNavigateByUrlSpy).toHaveBeenCalledWith('/', { replaceUrl: true });
    }
  });

  // -------------------------------------------------------------------------
  // Requirement 3.3 — loadEditRecord populates form when preserveFormOnNextLoad is false
  // -------------------------------------------------------------------------

  /**
   * Property 2d (Preservation 3.3): loadEditRecord(id) with preserveFormOnNextLoad=false
   * and a valid ID fetches the patch from Firestore and populates the form correctly.
   *
   * Validates: Requirement 3.3
   */
  it('Property 2d: loadEditRecord with a valid ID and preserveFormOnNextLoad=false populates the form', async () => {
    const testPatchId = 'patch-edit-001';
    const mockPatch = {
      gameTitle: 'Chrono Trigger TH',
      system: 'SNES',
      translatorId: 'trans-001',
      patchTool: 'Lunar IPS',
      updateDate: '2023-06-15T00:00:00.000Z',
      haveUpdateFlag: false,
      patchVersion: 'v1.0',
      patchFileUrl: 'https://example.com/patch.ips',
      patchedRomUrl: '',
      referenceText: '',
      referenceUrl: '',
      walkthroughUrl: '',
      coverUrl: '',
      tags: [],
    };

    patchRepositoryStub.getById.and.returnValue(Promise.resolve(mockPatch));

    const comp = await buildComponent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = comp as any;

    // Confirm preserveFormOnNextLoad is false (either field exists and is false,
    // or field doesn't exist yet on unfixed code — both mean "don't skip load")
    expect(c.preserveFormOnNextLoad ?? false).toBeFalsy();

    // Trigger loadEditRecord via paramMap emission (simulating /add-patch/:id navigation)
    paramMapSubject.next(convertToParamMap({ id: testPatchId }));
    // Wait for the async loadEditRecord to complete
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    // Form should be populated with patch data
    expect(c.form.controls.gameTitle.value).toBe('Chrono Trigger TH');
    expect(c.form.controls.system.value).toBe('SNES');
    expect(c.form.controls.translatorId.value).toBe('trans-001');
    expect(c.editId).toBe(testPatchId);
  });
});
