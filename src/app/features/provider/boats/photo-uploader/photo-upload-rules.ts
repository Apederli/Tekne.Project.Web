/**
 * Yükleme öncesi dosya elemesi.
 *
 * Backend doğrulaması toplu çalışıyor: tek geçersiz dosya isteğin tamamını
 * 400'e düşürüyor (`UploadBoatPhotosCommandValidator`). Bu yüzden eleme
 * gönderimden önce burada yapılır — sınırlar backend'dekilerle birebir.
 */

export const MAX_PHOTOS = 20;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

/** Uzantı → tip. Backend `ImageContentTypes.ByExtension` ile aynı liste. */
const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};

export interface RejectedFile {
  name: string;
  reason: 'type' | 'size' | 'limit';
}

export interface FileSelection {
  accepted: File[];
  rejected: RejectedFile[];
}

/**
 * Dosyanın gerçek tipi. Tarayıcı HEIC/HEIF için boş veya genel bir tip
 * gönderebiliyor; o durumda uzantıdan çözülür. Çözülemezse boş string.
 */
export function resolveContentType(file: File): string {
  const type = file.type.toLowerCase();
  if (type && type !== 'application/octet-stream') return type;

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[extension] ?? '';
}

/**
 * Gönderilecek dosyaları ayıklar. `existingCount` mevcut fotoğraf sayısı
 * (uçmakta olan yüklemeler dahil) — kalan kontenjan buradan hesaplanır.
 * Sıra korunur: kontenjan dolduğunda geri kalanlar `limit` ile elenir.
 */
export function selectUploadableFiles(files: File[], existingCount: number): FileSelection {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  let remaining = Math.max(0, MAX_PHOTOS - existingCount);

  for (const file of files) {
    if (!ALLOWED_TYPES.has(resolveContentType(file))) {
      rejected.push({ name: file.name, reason: 'type' });
      continue;
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'size' });
      continue;
    }
    if (remaining === 0) {
      rejected.push({ name: file.name, reason: 'limit' });
      continue;
    }
    accepted.push(file);
    remaining--;
  }

  return { accepted, rejected };
}

/** Kullanıcıya gösterilen özet; atlanan yoksa boş string. */
export function rejectionMessage(rejected: RejectedFile[]): string {
  if (rejected.length === 0) return '';

  const parts: string[] = [];
  const count = (reason: RejectedFile['reason']) =>
    rejected.filter((r) => r.reason === reason).length;

  if (count('type')) parts.push(`${count('type')} dosya desteklenmeyen türde`);
  if (count('size')) parts.push(`${count('size')} dosya 10MB üzeri`);
  if (count('limit')) parts.push(`${count('limit')} dosya ${MAX_PHOTOS} fotoğraf sınırını aştığı`);

  return `${parts.join(', ')} için atlandı.`;
}
