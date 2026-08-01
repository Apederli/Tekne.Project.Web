/**
 * Shell'in `provideIcons` bloğunda kayıtlı ikon adları.
 *
 * `string` yerine union: daraltılmış modda ikon tek görünen şey —
 * yazım hatası sessizce boş satır üretirdi, derleyici yakalasın.
 */
export type NavIcon =
  | 'lucideLayoutDashboard'
  | 'lucideShip'
  | 'lucideCalendarDays'
  | 'lucideClipboardList'
  | 'lucideUsers'
  | 'lucideUserCog';

/** Panel shell'lerinin (provider, admin) sidebar linki. */
export interface NavItem {
  path: string;
  label: string;
  exact: boolean;
  /**
   * ng-icon adı — ikonlar `DashboardShell`'in `provideIcons` bloğunda
   * kayıtlı. Zorunlu: sidebar daraltıldığında (`collapsible="icon"`)
   * görünen tek şey ikondur.
   */
  icon: NavIcon;
  /** Alt sekme çubuğundaki kısa etiket; yoksa `label` kullanılır. */
  shortLabel?: string;
}
