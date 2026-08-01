/** `ConfirmService.confirm` seçenekleri. */
export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Varsayılan: "Onayla" */
  confirmText?: string;
  /** Varsayılan: "Vazgeç" */
  cancelText?: string;
  /** true ise onay butonu destructive görünür. */
  destructive?: boolean;
}
