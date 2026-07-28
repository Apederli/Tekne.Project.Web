import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserService } from '@services/user.service';
import { DashboardShell } from './dashboard-shell';
import { NavItem } from './nav-item';

@Component({
  imports: [DashboardShell],
  template: `
    <app-dashboard-shell title="Test Panel" [navItems]="navItems" loginPath="/partner/login">
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
      providers: [provideRouter([]), { provide: UserService, useValue: userService }],
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
});
