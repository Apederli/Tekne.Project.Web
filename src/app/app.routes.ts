import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/role.guard';
import { ROUTE_ADMIN, ROUTE_MARKET, ROUTE_PARTNER } from './core/routes.const';

/**
 * Üç erişim alanı ayrı lazy chunk'lar hâlinde yükleniyor.
 * `admin` ve `partner`, market'in kök ('') route'undan ÖNCE tanımlı olmalı —
 * aksi hâlde '' prefix eşleşmesi onları yutar.
 *
 * Partner alanının rol kontrolü burada değil, `provider.routes.ts` içinde:
 * giriş sayfası da `/partner` altında olduğu için guard'ın onu kapsamaması gerekiyor.
 */
export const routes: Routes = [
  {
    path: ROUTE_ADMIN.main,
    canMatch: [roleGuard('admin')],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: ROUTE_PARTNER.main,
    loadChildren: () => import('./features/provider/provider.routes').then((m) => m.providerRoutes),
  },
  {
    path: ROUTE_MARKET.main,
    loadChildren: () => import('./features/market/market.routes').then((m) => m.marketRoutes),
  },
];
