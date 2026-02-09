import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loader',
  imports: [
    ProgressSpinnerModule,
    CommonModule
  ],
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader {
  isLoading = false;
  thinkingOptions: string[] = [
    'Thinking...',
    'Processing your request...',
    'Hold on a second...',
    'Just a moment...',
    'We are almost there...'
  ];

  currentThinkingOption = this.thinkingOptions[0];

  ngOnInit() {
    this.currentThinkingOption = this.thinkingOptions[0];
    this.simulateLoading();
  }

  simulateLoading() {
    this.isLoading = true;
    let index = 0;
    setInterval(() => {
      index = (index + 1) % this.thinkingOptions.length;
      this.currentThinkingOption = this.thinkingOptions[index];
    }, 0.5 * 1000); // Change text every 0.5 seconds
  }
}
