import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UserType } from '@enums/user-type';
import { UserService } from '@services/user.service';
import { AuthStore } from '../../core/auth/auth-store';
import { DashboardShell } from './dashboard-shell';
import { NavItem } from './nav-item';

@Component({ template: '' })
class Blank {}

@Component({
  imports: [DashboardShell],
  template: `
    <app-dashboard-shell panelTitle="Test Panel" [navItems]="navItems" loginPath="/partner/login">
      <p data-testid="projected">İçerik</p>
    </app-dashboard-shell>
  `,
})
class Host {
  navItems: NavItem[] = [
    { path: '/partner', label: 'Genel Bakış', exact: true },
    { path: '/partner/teknelerim', label: 'Teknelerim', exact: false },
  ];
}

describe('DashboardShell', () => {
  let userService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = { logout: vi.fn(() => of(true)) };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([{ path: '**', component: Blank }]),
        { provide: UserService, useValue: userService },
      ],
    }).compileComponents();
  });

  it('başlığı ve nav linklerini render eder', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('aside')?.textContent).toContain('Test Panel');

    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Genel Bakış', 'Teknelerim']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/partner', '/partner/teknelerim']);
  });

  it('içeriği projekte eder', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('main [data-testid="projected"]')?.textContent).toBe('İçerik');
  });

  it('oturum yokken kullanıcı menüsü tetikleyicisi "Hesap" yazar', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="popover-trigger"]');

    expect(trigger?.textContent?.trim()).toBe('Hesap');
  });

  it('oturum varken tetikleyici ad soyadı gösterir', async () => {
    TestBed.inject(AuthStore).setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="popover-trigger"]');

    expect(trigger?.textContent?.trim()).toBe('Deniz Kaptan');
  });

  it('çıkış: logout çağrılır, store temizlenir, loginPath\'e gidilir', async () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.query(By.directive(DashboardShell)).componentInstance;

    shell.signOut();
    await fixture.whenStable();

    expect(userService.logout).toHaveBeenCalledOnce();
    expect(authStore.user()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/partner/login');
  });

  it('çıkış isteği hata verse de store temizlenir ve yönlendirilir', async () => {
    userService.logout.mockReturnValue(throwError(() => new Error('ağ hatası')));
    const authStore = TestBed.inject(AuthStore);
    authStore.setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.query(By.directive(DashboardShell)).componentInstance;

    shell.signOut();
    await fixture.whenStable();

    expect(authStore.user()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/partner/login');
  });

  it('hamburger tetikleyicisi render edilir', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="sheet-trigger"]');

    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute('aria-label')).toBe('Menüyü aç');
  });

  it('hamburger tıklanınca drawer nav linklerini gösterir', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    (
      fixture.nativeElement.querySelector('[data-slot="sheet-trigger"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    const content = document.body.querySelector('[data-slot="sheet-content"]');
    expect(content).toBeTruthy();
    const links = Array.from(content!.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Genel Bakış', 'Teknelerim']);
  });

  it('drawer içindeki nav linkine tıklanınca drawer kapanır', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.query(By.directive(DashboardShell)).componentInstance;

    (
      fixture.nativeElement.querySelector('[data-slot="sheet-trigger"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(shell.mobileNavState()).toBe('open');

    const link = document.body.querySelector(
      '[data-slot="sheet-content"] nav a',
    ) as HTMLAnchorElement;
    link.click();
    await fixture.whenStable();

    expect(shell.mobileNavState()).toBe('closed');
  });
});
