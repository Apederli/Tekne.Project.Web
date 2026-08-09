/**
 * Test ortamı yamaları — jsdom'un uygulamadığı tarayıcı API'leri.
 *
 * `ResizeObserver`: spartan'ın select/combobox trigger'ı genişliğini bir
 * `afterRender` kancasında ölçüyor. jsdom'da global tanımsız olduğu için kanca
 * her render turunda patlıyor, Angular turu yeniden deniyor ve uygulama hiç
 * "stable" olmuyor — `fixture.whenStable()` dönmeden testler zaman aşımına
 * uğruyordu. Ölçüm testlerde anlamsız; gözlemci sessiz bir kabuk.
 */
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}
