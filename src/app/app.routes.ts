import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/role.guard';

/**
 * Üç erişim alanı ayrı lazy chunk'lar hâlinde yükleniyor.
 * `admin` ve `provider`, market'in kök ('') route'undan ÖNCE tanımlı olmalı —
 * aksi hâlde '' prefix eşleşmesi onları yutar.
 */
export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [roleGuard('admin')],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'provider',
    canMatch: [roleGuard('provider')],
    loadChildren: () => import('./features/provider/provider.routes').then((m) => m.providerRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./features/market/market.routes').then((m) => m.marketRoutes),
  },
];
