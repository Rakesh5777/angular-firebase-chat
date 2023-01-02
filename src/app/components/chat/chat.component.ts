import { UserService } from './../../services/user.service';
import { Message } from './../../../models/chat';
import { combineLatest, Observable, filter, switchMap } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ChatService } from './../../services/chatservice.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  public selectedChat$ = this.chat.activeChat$;
  public messageControl = new FormControl('');
  public selectedChatId = '';
  public messages: Message[] = [];
  public currentUserId: string = '';
  @ViewChild('messageInput') messageInput!: ElementRef;

  constructor(private chat: ChatService, public user: UserService) { }

  ngOnInit(): void {
    this.selectedChat$
      .pipe(untilDestroyed(this))
      .subscribe(chat => {
        this.messages = [];
        this.selectedChatId = chat?.id ?? '';
        this.messageInput?.nativeElement?.focus();
      });

    this.selectedChat$
      .pipe(
        filter((chat) => !!chat?.id),
        switchMap((chat) => this.chat.getMessages(chat!.id))
      )
      .pipe(untilDestroyed(this))
      .subscribe((messages: Message[]) => {
        this.messages = messages;
      })

    this.user.currentUserProfile$
      .pipe(untilDestroyed(this))
      .subscribe((user) => {
        this.currentUserId = user!.uid;
      });
  }

  sendMessage(): void {
    const chatId = this.selectedChatId;
    const message = this.messageControl.value;
    if (chatId && message) {
      this.chat.sendMessage(chatId, message)
        .pipe(untilDestroyed(this))
        .subscribe();
      this.messageControl.setValue(``);
    }
  }

  isSender(senderId: any): boolean {
    return senderId === this.currentUserId;
  }
}
