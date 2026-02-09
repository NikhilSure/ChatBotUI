import { Injectable } from '@angular/core';
import { API_CONST } from '../constants/proj.const';

@Injectable({ providedIn: 'root' })
export class ChatStreamService {

  async streamMessage(
    message: string,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    try {
      const response = await fetch(API_CONST.BASE_URL + 'StreamChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        console.log('Stream read:', { value, done });
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');

        for (let i = 0; i < parts.length - 1; i++) {
          const line = parts[i].trim();

          if (!line.startsWith('data:')) continue;

          const token = line.replace('data:', '').trim();

          if (token === '[DONE]') {
            onDone();
            return;
          }

          onToken(token);
        }

        buffer = parts[parts.length - 1];
      }

      onDone();

    } catch (err) {
      onError(err);
    }
  }
}
