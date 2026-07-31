import {
  MAX_FILE_BYTES,
  rejectionMessage,
  resolveContentType,
  selectUploadableFiles,
} from './photo-upload-rules';

function file(name: string, type: string, size = 1024): File {
  const f = new File(['x'], name, { type });
  // File.size içerikten geliyor; 10MB'lık gerçek içerik üretmemek için sabitliyoruz.
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('photo-upload-rules', () => {
  it('geçerli dosyaları kabul eder', () => {
    const { accepted, rejected } = selectUploadableFiles(
      [file('a.jpg', 'image/jpeg'), file('b.png', 'image/png')],
      0,
    );

    expect(accepted.map((f) => f.name)).toEqual(['a.jpg', 'b.png']);
    expect(rejected).toEqual([]);
  });

  it('desteklenmeyen tipi eler', () => {
    const { accepted, rejected } = selectUploadableFiles([file('a.pdf', 'application/pdf')], 0);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([{ name: 'a.pdf', reason: 'type' }]);
  });

  it('10MB üstünü eler', () => {
    const big = file('big.jpg', 'image/jpeg', MAX_FILE_BYTES + 1);

    const { accepted, rejected } = selectUploadableFiles([big], 0);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([{ name: 'big.jpg', reason: 'size' }]);
  });

  it('boş dosyayı eler', () => {
    const { rejected } = selectUploadableFiles([file('empty.jpg', 'image/jpeg', 0)], 0);

    expect(rejected).toEqual([{ name: 'empty.jpg', reason: 'size' }]);
  });

  it('20 sınırını aşan seçimi kırpar', () => {
    const files = Array.from({ length: 5 }, (_, i) => file(`p${i}.jpg`, 'image/jpeg'));

    const { accepted, rejected } = selectUploadableFiles(files, 18);

    expect(accepted.map((f) => f.name)).toEqual(['p0.jpg', 'p1.jpg']);
    expect(rejected).toEqual([
      { name: 'p2.jpg', reason: 'limit' },
      { name: 'p3.jpg', reason: 'limit' },
      { name: 'p4.jpg', reason: 'limit' },
    ]);
  });

  it('tarayıcı tip vermediğinde uzantıdan çözer', () => {
    expect(resolveContentType(file('foto.heic', ''))).toBe('image/heic');
    expect(resolveContentType(file('foto.HEIC', 'application/octet-stream'))).toBe('image/heic');
    expect(resolveContentType(file('foto.jpg', 'image/jpeg'))).toBe('image/jpeg');
    expect(resolveContentType(file('belge.pdf', ''))).toBe('');
  });

  it('uzantıdan çözülen heic dosyasını kabul eder', () => {
    const { accepted } = selectUploadableFiles([file('foto.heic', '')], 0);

    expect(accepted.map((f) => f.name)).toEqual(['foto.heic']);
  });

  it('atlanan dosyaları sebebiyle birlikte özetler', () => {
    const message = rejectionMessage([
      { name: 'a.pdf', reason: 'type' },
      { name: 'b.gif', reason: 'type' },
      { name: 'c.jpg', reason: 'size' },
      { name: 'd.jpg', reason: 'limit' },
    ]);

    expect(message).toBe(
      '2 dosya desteklenmeyen türde, 1 dosya 10MB üzeri, 1 dosya 20 fotoğraf sınırını aştığı için atlandı.',
    );
  });

  it('atlanan yoksa mesaj boştur', () => {
    expect(rejectionMessage([])).toBe('');
  });
});
