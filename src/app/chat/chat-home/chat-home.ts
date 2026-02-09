import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Avatar, AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Card, CardModule } from 'primeng/card';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';
import { TextareaModule } from 'primeng/textarea';
import { Loader } from '../loader/loader';
import { ChatStreamService } from '../../services/chatStream.service';
interface Message {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
}
@Component({
  selector: 'app-chat-home',
  imports: [
    FormsModule,
    CommonModule,
    AvatarModule,
    ScrollPanelModule,
    CardModule,
    ButtonModule,
    TextareaModule,
    Loader
  ],
  templateUrl: './chat-home.html',
  styleUrl: './chat-home.css',
})
export class ChatHome {
  @ViewChild('scrollPanel') scrollPanel!: ScrollPanel;

  input = '';
  isTyping = false;
  private shouldScroll = false;

  messages: Message[] = [
    { text: 'Hello 👋 How can I help you today?', sender: 'bot', time: new Date() }
  ];

  constructor(private stream: ChatStreamService,
     private cdr: ChangeDetectorRef) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    const el = this.scrollPanel?.contentViewChild?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // send() {
  //   if (!this.input.trim()) return;

  //   const userText = this.input;

  //   this.messages.push({
  //     text: userText,
  //     sender: 'user',
  //     time: new Date()
  //   });

  //   this.input = '';
  //   this.shouldScroll = true;
  //   this.isTyping = true;
  //   let current = '';

  //   const botMsg: Message = { text: '', sender: 'bot', time: new Date() };
  //   this.messages.push(botMsg);
  // }

  send() {
  if (!this.input.trim()) return;

  const userText = this.input;

  this.messages.push({
    text: userText,
    sender: 'user',
    time: new Date()
  });

  this.input = '';
  this.shouldScroll = true;
  this.isTyping = true;

  const botMsg: Message = { text: '', sender: 'bot', time: new Date() };
  this.messages.push(botMsg);

   this.cdr.detectChanges();

  this.stream.streamMessage(
    userText,

    (token) => {
      this.isTyping = false;
       this.cdr.detectChanges();
      botMsg.text += " " + token;
      this.cdr.detectChanges();
      this.shouldScroll = true;
    },
    () => {
      this.isTyping = false;
    },
    (err) => {
      botMsg.text = '⚠️ Error receiving response';
      this.isTyping = false;
      console.error(err);
    }
  );
}
}

