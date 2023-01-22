import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AnimationOptions } from 'ngx-lottie';
import { filter, switchMap } from 'rxjs';
import { Message } from './../../../models/chat';
import { ChatService } from './../../services/chatservice.service';
import { UserService } from './../../services/user.service';

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
  public currentUserId = '';
  @ViewChild('messageInput') messageInput!: ElementRef;
  options: AnimationOptions = {
    path: '/assets/eyes.json',
  };

  constructor(private chat: ChatService, public user: UserService) { }

  ngOnInit(): void {
    this.selectedChat$
      .pipe(untilDestroyed(this))
      .subscribe(chat => {
        this.messages = [];
        this.selectedChatId = chat?.id ?? '';
        this.messageInput?.nativeElement?.focus();
        this.chat.setChatOnlineStatus(this.selectedChat$.value!);
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

  isMessageRead(): boolean {
    return true; //TODO implement this
    const otherChatIndex = this.selectedChat$?.value?.userIds.findIndex((id) => id !== this.currentUserId);
    return this.selectedChat$?.value?.userData[otherChatIndex!].unSeenMessageCount === 0;
  }
}
