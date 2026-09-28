import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSamplePageComponent } from './admin-sample-page.component';
import { StatusMessageService } from '../shared/status-message.service';

describe('AdminSamplePageComponent', () => {
  let component: AdminSamplePageComponent;
  let fixture: ComponentFixture<AdminSamplePageComponent>;
  let statusMessageService: StatusMessageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSamplePageComponent],
      providers: [StatusMessageService]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSamplePageComponent);
    component = fixture.componentInstance;
    statusMessageService = TestBed.inject(StatusMessageService);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should show toast without auto-dismissing when showToast is called', () => {
    spyOn(statusMessageService, 'show');
    (component as unknown as { showToast: (tone: 'success' | 'info' | 'error') => void }).showToast('success');
    expect(statusMessageService.show).toHaveBeenCalledWith('ตัวอย่าง success message', 'success', false);
  });
});
