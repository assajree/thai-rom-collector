import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StatusMessageService } from '../shared/status-message.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const status = inject(StatusMessageService);

  status.show('กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...');
  await authService.waitForAdminCheck();

  if (authService.user() && authService.isAdmin()) {
    status.clear();
    return true;
  }

  if (!authService.user()) {
    status.show('กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบก่อน', 'error');
    return router.parseUrl('/login');
  }
  status.show('บัญชีนี้ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ', 'error');
  return router.parseUrl('/');
};
