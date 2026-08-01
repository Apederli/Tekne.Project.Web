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
  icon: string;
}
