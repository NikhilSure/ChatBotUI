import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ViewChild,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ElementRef,
  NgZone
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ScrollPanel, ScrollPanelModule } from 'primeng/scrollpanel';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { Loader } from '../loader/loader';
import { MarkdownPipe } from '../pipes/markdown.pipe';
import { ChatStreamService } from '../../services/chatStream.service';

import { HttpClient } from '@angular/common/http';
import { API_CONST, APP_CONST } from '../../constants/proj.const';

import { Subject, takeUntil } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { MenuModule } from 'primeng/menu';

interface Message {
  text: string;
  sender: 'USER' | 'BOT';
  time: Date;
  stream: boolean;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
}

@Component({
  selector: 'app-chat-home',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    AvatarModule,
    ScrollPanelModule,
    CardModule,
    ButtonModule,
    TextareaModule,
    Loader,
    MarkdownPipe,
    InputTextModule,
    SelectModule,
    MenuModule
  ],
  templateUrl: './chat-home.html',
  styleUrls: ['./chat-home.css']
})
export class ChatHome implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollPanel') scrollPanel!: ElementRef

  input = '';
  spin = false;
  showStopBtn = false;
  sidebarOpen = true;

  models = APP_CONST.MODELS;
  selectedModel: string | null = 'Phi-3 Mini';

  messages: Message[] = [];
  conversations: Conversation[] = [];

  selected: Conversation | null = null;
  search = '';

  private destroy$ = new Subject<void>();
  private shouldScroll = false;

  constructor(
    private stream: ChatStreamService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private zone: NgZone
  ) { }

  // ================= INIT =================

  ngOnInit(): void {
    this.initMessage();
    this.loadConvHis();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    // if (this.shouldScroll) {
    //   this.scrollToBottom();
    //   this.shouldScroll = false;
    // }
  }

  // ================= UI =================

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  initMessage(): void {
    this.messages = [
      {
        text: 'Hello 👋 How can I help you today?',
        sender: 'BOT',
        time: new Date(),
        stream: false
      }
    ];
  }

private scrollToBottom(): void {
  setTimeout(() => {
    const el = this.scrollPanel?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, 10);
}

  // ================= CONVERSATIONS =================

  loadConvHis(): void {
    this.http
      .get<any[]>(`${API_CONST.BASE_URL}${API_CONST.CONVHIS}/${APP_CONST.USERID}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.conversations = data.map(conv => ({
            id: conv.conservationId,
            title: conv.title,
            lastMessage: conv.recentMessage,
            updatedAt: new Date(conv.lastUpdatedTs)
          }));
          this.cdr.detectChanges();
        },
        error: () => console.error('Unable to load conversations')
      });
  }

  selectConversation(convo: Conversation): void {
    if (convo.id == this.selected?.id) return;
    
    stop();
    this.cdr.detectChanges();
    this.selected = convo;
    this.input = '';
    this.initMessage();
    this.getMessages();
  }

  getMessages(): void {
    if (!this.selected) return;

    const postData = {
      userId: APP_CONST.USERID,
      chatSessionId: this.selected.id
    };

    this.http
      .post<any[]>(`${API_CONST.BASE_URL}${API_CONST.GETMESSAGES}`, postData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          data.forEach(msg => {
            this.messages.push({
              text: msg.content,
              sender: msg.role,
              time: new Date(msg.ts),
              stream: false
            });
          });

          this.cdr.detectChanges();
          this.scrollToBottom();

          
        },
        error: () => console.error('Unable to fetch messages')
      });
  }

  createNewConv(): void {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'New Conversation',
      lastMessage: '',
      updatedAt: new Date()
    };

    this.conversations.unshift(newConv);
    this.selected = newConv;
    this.initMessage();
  }

  startConv(): void {
    this.selected = null;
    this.initMessage();
    this.scrollToBottom();
  }

  // ================= SEND MESSAGE =================

  send(): void {
    if (!this.input.trim()) return;

    const userText = this.input;

    if (!this.selected) {
      this.createNewConv();
    }

    // Add user message
    this.messages.push({
      text: userText,
      sender: 'USER',
      time: new Date(),
      stream: false
    });

    this.input = '';
    this.shouldScroll = true;

    // Add streaming bot message
    const botMsg: Message = {
      text: '',
      sender: 'BOT',
      time: new Date(),
      stream: true
    };

    this.messages.push(botMsg);

    this.spin = true;
    this.showStopBtn = true;
    this.scrollToBottom()

    this.stream.streamMessage(
      userText,
      this.selected!.id,
      (token: string) => {
        console.log(token)
        this.zone.run(() => {
          this.spin = false;
          botMsg.text += token;
          this.cdr.detectChanges();
          this.scrollToBottom();
        })
      },
      () => {
        this.spin = false;
        this.showStopBtn = false;
        botMsg.stream = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      () => {
        botMsg.text = '⚠️ Error receiving response';
        this.spin = false;
        this.showStopBtn = false;
        botMsg.stream = false;
      }
    );
  }

  stop(): void {
    this.stream.stop();
    this.spin = false;
    this.showStopBtn = false;
  }

  get filteredConversations(): Conversation[] {
  if (!this.search.trim()) return this.conversations;

  const term = this.search.toLowerCase();

  return this.conversations.filter(c =>
    c.title.toLowerCase().includes(term) ||
    c.lastMessage?.toLowerCase().includes(term)
  );
}

deleteConversation(convo: Conversation, event?: Event): void {

  // Prevent click from triggering selectConversation
  event?.stopPropagation();

  if (!confirm('Delete this conversation?')) return;

   const postData = {
      userId: APP_CONST.USERID,
      chatSessionId: this.selected!.id
    };

  this.http.post(
    `${API_CONST.BASE_URL}${API_CONST.DELETE_CONV}`, 
    postData
  ).subscribe({
    next: () => {

      // Remove from UI immediately
      this.conversations = this.conversations.filter(
        c => c.id !== convo.id
      );

      // If deleted convo was selected → reset chat
      if (this.selected?.id === convo.id) {
        this.selected = null;
        this.initMessage();
      }

      this.cdr.detectChanges();
    },
    error: () => {
      console.error('Failed to delete conversation');
    }
  });
}

menuItems:any = []
openMenu(event: Event, menu: any, convo: Conversation): void {
  event.stopPropagation();
  this.selected = convo;

  this.menuItems = [
    {
      label: 'Open',
      icon: 'pi pi-folder-open',
      command: () => {
        this.selectConversation(convo);
      }
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        this.deleteConversation(convo);
      }
    }
  ];

  menu.toggle(event);
}
}