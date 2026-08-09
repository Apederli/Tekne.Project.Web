import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGripVertical, lucideImagePlus, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { BoatPhotoOutputModel, sortBoatPhotos } from '@models';
import { BoatPhotoService } from '@services';
import { ConfirmService } from '../../../../shared/confirm-dialog/confirm.service';
import { MAX_PHOTOS, rejectionMessage, selectUploadableFiles } from './photo-upload-rules';

/**
 * Tekne fotoğrafı yükleme ve silme.
 *
 * Veri çekmiyor, kalıcı liste tutmaz: gösterdiği şey `photos()` girdisidir ve
 * her başarılı işlemden sonra tam listeyi `photosChanged` ile bildirir —
 * listeyi tazelemek host'un işidir. Böylece gerçek listenin sahibi tektir.
 */
@Component({
  selector: 'app-photo-uploader',
  imports: [CdkDrag, CdkDragHandle, CdkDropList, NgIcon, HlmButton],
  providers: [provideIcons({ lucideGripVertical, lucideImagePlus, lucideTrash2 })],
  templateUrl: './photo-uploader.html',
})
export class PhotoUploader {
  photoService = inject(BoatPhotoService);
  confirmService = inject(ConfirmService);

  boatId = input.required<number>();
  photos = input.required<BoatPhotoOutputModel[]>();

  /** Her başarılı yükleme/silme sonrası fotoğrafların tam listesi. */
  photosChanged = output<BoatPhotoOutputModel[]>();

  /** Uçmakta olan yüklemenin dosya sayısı — iskelet kutucuklar bundan çizilir. */
  uploadingCount = signal(0);
  deletingId = signal<number | null>(null);
  skippedMessage = signal('');
  /** Sürükle-bırak vurgusu — masaüstünde ek yetenek, mobilde hiç tetiklenmez. */
  dragging = signal(false);
  /** Sıralama isteği uçuyor — karşılıklı dışlamanın üçüncü ortağı. */
  reordering = signal(false);

  /** Yükleme/silme/sıralamadan biri uçarken diğer ikisi başlayamaz. */
  busy = computed(
    () => this.uploadingCount() > 0 || this.deletingId() !== null || this.reordering(),
  );

  /** Sıra `PhotoGallery` ile ortak (`sortBoatPhotos`) — iki ekran aynı fotoğrafı kapak saysın. */
  visible = computed(() => sortBoatPhotos(this.photos()));

  full = computed(() => this.photos().length + this.uploadingCount() >= MAX_PHOTOS);

  /** İskelet kutucukları `@for` ile çizebilmek için sayıyı diziye açar. */
  skeletons = computed(() => Array.from({ length: this.uploadingCount() }, (_, i) => i));

  /** Fotoğrafın konum bilgisini içeren alt metni — ekran okuyucu birbirinden ayırabilsin. */
  photoAlt(index: number): string {
    return `fotoğraf ${index + 1} / ${this.visible().length}`;
  }

  /**
   * Dosya seçilir seçilmez yükler; ayrı bir "Yükle" düğmesi yok. Girdi
   * sıfırlanıyor ki aynı dosya art arda seçildiğinde `change` yine tetiklensin.
   */
  onFileInput(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.upload(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    // `upload()` zaten silme sürerken engelliyor; burada da bakılıyor ki
    // dosyalar diziye çevrilip boşuna işlenmesin.
    if (this.full() || this.busy()) return;
    this.upload(Array.from(event.dataTransfer?.files ?? []));
  }

  upload(files: File[]): void {
    if (files.length === 0) return;
    // Aynı anda tek fotoğraf işlemi: her emit `photos()` girdisinden hesaplanır,
    // ikinci bir yükleme veya silme uçarken başlarsa ikisi de aynı bayat
    // anlık görüntüden okur ve biri diğerinin sonucunu ezer/geri getirir
    // (silme sürerken yüklenirse silinen fotoğraf geri döner; yükleme sürerken
    // silinirse yeni fotoğraf kaybolur). Bu yüzden ikisi de karşılıklı dışlar.
    if (this.busy()) return;

    const pending = this.photos().length + this.uploadingCount();
    const { accepted, rejected } = selectUploadableFiles(files, pending);
    this.skippedMessage.set(rejectionMessage(rejected));
    if (accepted.length === 0) return;

    this.uploadingCount.update((n) => n + accepted.length);
    this.photoService.upload(this.boatId(), accepted).subscribe({
      next: (created) => {
        this.uploadingCount.update((n) => n - accepted.length);
        this.photosChanged.emit([...this.photos(), ...created]);
      },
      // Hata mesajını errorInterceptor gösteriyor; buradaki tek iş iskeletleri
      // kaldırmak, aksi hâlde ızgarada takılı kalırlar.
      error: () => this.uploadingCount.update((n) => n - accepted.length),
    });
  }

  /**
   * Çöp butonunun yolu: önce onay, sonra ham silme. `remove()` ayrı kalır —
   * silme mekaniği (karşılıklı dışlama, emit) onaydan bağımsız.
   */
  async confirmRemove(photo: BoatPhotoOutputModel, index: number): Promise<void> {
    if (this.busy()) return;

    const confirmed = await this.confirmService.confirm({
      title: `${index + 1}. fotoğraf silinsin mi?`,
      message: 'Bu işlem geri alınamaz.',
      confirmText: 'Sil',
      destructive: true,
    });
    // Diyalog açıkken başka bir işlem başlamış olabilir — kapı yeniden kontrol edilir.
    if (!confirmed || this.busy()) return;

    this.remove(photo);
  }

  /**
   * Tek seferde tek silme: art arda dokunuşta ikinci istek açılmaz, aksi
   * hâlde iki yanıt birbirinin listesini ezerdi (`photos()` ikisi için de eski).
   * Yükleme sürerken de silme başlatılmaz — aynı gerekçe `upload()`'da anlatılıyor.
   */
  remove(photo: BoatPhotoOutputModel): void {
    if (this.busy()) return;

    this.deletingId.set(photo.id);
    this.photoService.delete(this.boatId(), photo.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.skippedMessage.set('');
        this.photosChanged.emit(this.photos().filter((p) => p.id !== photo.id));
      },
      error: () => this.deletingId.set(null),
    });
  }

  /**
   * Sıra değişikliği: yeni sıra anında yayınlanır (optimistic), tek PUT atılır.
   * Backend sözleşmesi: kapak, sıralamanın en düşük `sortOrder`'lı (ilk)
   * elemanıdır — `sortOrder` alanı yeni sıraya göre yeniden yazılır ki
   * `sortBoatPhotos` görsel sırayla aynı sonucu üretsin ve "Kapak" rozeti
   * doğru karoya geçsin.
   */
  onPhotoDrop(event: CdkDragDrop<BoatPhotoOutputModel[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    if (this.busy()) return;

    const previous = this.photos();
    const next = [...this.visible()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    const renumbered = next.map((p, i) => ({ ...p, sortOrder: i }));

    this.reordering.set(true);
    this.photosChanged.emit(renumbered);
    this.photoService
      .reorder(
        this.boatId(),
        renumbered.map((p) => p.id),
      )
      .subscribe({
        next: () => this.reordering.set(false),
        // Mesajı errorInterceptor gösterdi; buradaki iş sırayı geri almak.
        error: () => {
          this.reordering.set(false);
          this.photosChanged.emit(previous);
        },
      });
  }
}
