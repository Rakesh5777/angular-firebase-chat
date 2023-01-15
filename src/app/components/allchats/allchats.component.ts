import { AppUtils } from './../../utils/apputils';
import { DeviceUtils } from './../../services/device.service';
import { Chat } from './../../../models/chat';
import { ChatService as ChatService } from './../../services/chatservice.service';
import { UserProfile } from './../../../models/userProfile';
import { UserService } from './../../services/user.service';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, map, startWith, Observable, filter, take, switchMap } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'all-chats',
  templateUrl: './allchats.component.html',
  styleUrls: ['./allchats.component.css']
})
export class AllchatsComponent implements OnInit {

  public searchControl = new FormControl('');
  public chatSelectionControl = new FormControl('');
  public getActualUsers = combineLatest([this.user.allUsers$, this.user.currentUserProfile$, this.searchControl.valueChanges.pipe(startWith(''))])
    .pipe(map(([allUsers, currentUser, searchValue]) => allUsers.filter(user => currentUser?.uid != user.uid && user.displayName?.toLowerCase().includes(searchValue?.toLowerCase() ?? ''))));
  public allChats: Chat[] = [];

  constructor(public user: UserService, public chat: ChatService, public deviceUtils: DeviceUtils) { }

  ngOnInit(): void {
    this.chat.myChats$
      .pipe(
        untilDestroyed(this),
        filter((data) => !!data.length),
      )
      .subscribe(data => {
        this.allChats = data;
      });

    this.chat.myChats$
      .pipe(
        filter((data) => !!data.length),
        take(1))
      .subscribe(data => !this.deviceUtils.isMobile && this.chatSelected(data[0]));

    this.chatSelectionControl.valueChanges.pipe(startWith(''))
      .pipe(
        untilDestroyed(this),
        filter((selectedChat) => !!selectedChat?.[0]),
        switchMap((selectedChat) => this.chat.getChatWithId(selectedChat![0]).pipe(take(1))))
      .subscribe((data) => this.chatSelected(data as Chat));
  }

  selectedUser(userUid: string): void {
    this.chat.selectChat(userUid)
      .pipe(
        filter(chatId => !!chatId)
      )
      .subscribe((chatId) => {
        this.chat.getAndSetActiveChat(chatId);
    });
  }

  get myChats$(): Observable<Chat[]> {
    return this.chat.myChats$;
  }

  chatSelected(chat: Chat): void {
    if (this.deviceUtils.isMobile) {
      this.deviceUtils.showAllChats = false;
    }
    this.chat.handleSetActiveChat(chat);
  }

  getChatSelected(chatId: string): boolean {
    return this.chat.activeChat$?.value?.id === chatId;
  }

  usersSearchDisplayFn(user: UserProfile): string {
    return user?.displayName || '';
  }

  getLastMessage(chat: Chat): string {
    if (!chat?.lastMessageDate) return '';
    const lastMessage = AppUtils.getFortyCharacters(chat.lastMessage);
    return lastMessage;
  }
}
