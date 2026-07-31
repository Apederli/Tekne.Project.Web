import { makeBoatSlug, parseBoatIdFromSlug } from './boat-slug';

describe('makeBoatSlug', () => {
  it("adı küçük harfe çevirip tireler, id'yi sona ekler", () => {
    expect(makeBoatSlug('Mavi Rüzgar', 5)).toBe('mavi-ruzgar-5');
  });

  it('tüm Türkçe karakterleri sadeleştirir', () => {
    expect(makeBoatSlug('Çılgın Şövalye Öykü ĞÜİI', 12)).toBe('cilgin-sovalye-oyku-guii-12');
  });

  it('harf/rakam dışını tireye çevirir, ardışık tireleri tekler, uçları kırpar', () => {
    expect(makeBoatSlug('  Deniz  Yıldızı!! ', 3)).toBe('deniz-yildizi-3');
  });

  it('addan geriye bir şey kalmazsa yalnızca id döner', () => {
    expect(makeBoatSlug('***', 9)).toBe('9');
  });

  it("negatif id'ye karşı patlar", () => {
    expect(() => makeBoatSlug('Test', -5)).toThrow();
  });

  it("tam sayı olmayan id'ye karşı patlar", () => {
    expect(() => makeBoatSlug('Test', 3.5)).toThrow();
  });
});

describe('parseBoatIdFromSlug', () => {
  it('sondaki sayıyı çözer', () => {
    expect(parseBoatIdFromSlug('mavi-ruzgar-5')).toBe(5);
  });

  it('ad içindeki sayıya aldanmaz, en sondakini alır', () => {
    expect(parseBoatIdFromSlug('poyraz-2-7')).toBe(7);
  });

  it('üretilen slug ile gidiş-dönüş tutarlıdır', () => {
    expect(parseBoatIdFromSlug(makeBoatSlug('Ada Rüyası', 41))).toBe(41);
  });

  it('sayı yoksa null döner', () => {
    expect(parseBoatIdFromSlug('tekne')).toBeNull();
    expect(parseBoatIdFromSlug('')).toBeNull();
  });

  it('sıfır ve negatif id geçersizdir', () => {
    expect(parseBoatIdFromSlug('abc-0')).toBeNull();
  });

  it('sondası harf içeriyorsa null döner', () => {
    expect(parseBoatIdFromSlug('tekne-5x')).toBeNull();
  });
});
