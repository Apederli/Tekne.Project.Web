import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@ui/sonner';
import { ProgressBar } from './shared/progress-bar/progress-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProgressBar, HlmToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
