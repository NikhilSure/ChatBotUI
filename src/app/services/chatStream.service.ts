import { Injectable } from '@angular/core';
import { API_CONST, APP_CONST } from '../constants/proj.const';

@Injectable({ providedIn: 'root' })
export class ChatStreamService {

  private abortController: AbortController | null = null;


  stop() {
    this.abortController?.abort();
  }

  async streamMessage(
    message: string,
    chatSessionId: any,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    try {
      let postdata = {
        message,
        userId: APP_CONST.USERID,
        chatSessionId
      }
      const response = await fetch(API_CONST.BASE_URL + 'StreamChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postdata),
        signal: (this.abortController = new AbortController()).signal
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      let temp = '+'
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');

        console.log('Received chunk:', parts);

         
        for (let i = 0; i < parts.length - 1; i++) {
          const raw = parts[i];

          if (!raw.startsWith('data:')) continue;

          let token = raw.slice(5); // remove 'data:'
          

          // preserve newline
          if (temp !== '' && token === '') {
            onToken('\n');
            temp = token;
            continue;
          }
          
          temp = token;


          if (token === '[DONE]') {
            onDone();
            return;
          }

          // DO NOT TRIM OR MODIFY TOKEN
          onToken(token);
        }

        buffer = parts[parts.length - 1];
      }

      onDone();

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream stopped by user');
        onDone();
      } else {
        onError(err);
      }
    }
  }
}
