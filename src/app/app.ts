import { afterNextRender, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { HlmToaster } from '@ui/sonner';
import { ProgressBar } from './shared/progress-bar/progress-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressBar, HlmToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // Windows'ta bayrak emojileri harf çifti olarak görünüyor (Segoe UI
    // Emoji'de bayrak glifi yok). Polyfill yalnız bayrakları içeren küçük
    // bir fontu, yalnız bayrak çizemeyen platformlarda enjekte eder; font
    // angular.json üzerinden paketin kendisinden self-host edilir.
    afterNextRender(() => {
      polyfillCountryFlagEmojis('Twemoji Country Flags', '/fonts/TwemojiCountryFlags.woff2');
    });
  }
}
