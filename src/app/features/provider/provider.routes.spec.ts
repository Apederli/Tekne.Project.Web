import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { UserType } from '@enums/user-type';
import { AuthStore } from '../../core/auth/auth-store';
import { ROUTE_PARTNER } from '../../core/routes.const';
import { providerRoutes } from './provider.routes';

describe('providerRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([{ path: ROUTE_PARTNER.main, children: providerRoutes }]),
      ],
    });
  });

  it('provider rolündeki kullanıcıyı /partner → /partner/dashboard yönlendirir', async () => {
    TestBed.inject(AuthStore).setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });

    await RouterTestingHarness.create();
    await TestBed.inject(Router).navigateByUrl('/partner');

    expect(TestBed.inject(Router).url).toBe('/partner/dashboard');
  });

  it('oturumsuz kullanıcıyı /partner/dashboard → /partner/login yönlendirir', async () => {
    await RouterTestingHarness.create();
    await TestBed.inject(Router).navigateByUrl('/partner/dashboard');

    expect(TestBed.inject(Router).url).toBe('/partner/login');
  });
});
