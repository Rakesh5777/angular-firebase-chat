import { Chat, Message, ChatUserData } from './../../models/chat';
import { UserProfile } from './../../models/userProfile';
import { Observable, concatMap, take, map, filter, BehaviorSubject, switchMap, of, combineLatest, from, firstValueFrom, delay } from 'rxjs';
import { UserService } from './user.service';
import { Firestore, doc, collection, addDoc, query, where, collectionData, Timestamp, updateDoc, docData } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { orderBy } from '@firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  public activeChat$ = new BehaviorSubject<Chat | null>(null);

  constructor(private fireStore: Firestore, private user: UserService) { }

  selectChat(otherUserId: string): Observable<string> {
    return combineLatest([this.user.getUserByUid(otherUserId), this.myChats$]).pipe(
      take(1),
      switchMap(([otherUser, chats]) => {
        const chat = chats.find(chat => chat.userIds.includes(otherUser.uid));
        if (!!chat?.id) {
          return of(chat.id);
        }
        return this.createChatDoc(otherUser);
      })
    )
  }

  createChatDoc(otherUser: UserProfile): Observable<string> {
    const ref = collection(this.fireStore, 'chats');
    return this.user.currentUserProfile$
      .pipe(
        take(1),
        concatMap(user => from(addDoc(ref,
          {
            userIds: [user?.uid, otherUser?.uid],
            userData: [{ displayName: user?.displayName, photoUrl: user?.photoURL }, { displayName: otherUser?.displayName, photoUrl: otherUser?.photoURL }],
            lastMessageDate: Timestamp.now(),
          }
        ))),
        map((ref: any) => ref.id as string)
      )
  }

  get myChats$(): Observable<Chat[]> {
    const ref = collection(this.fireStore, 'chats');
    return this.user.currentUserProfile$
      .pipe(
        filter(user => !!user),
        concatMap(user => {
          const chatsQuery = query(ref, where('userIds', 'array-contains', user?.uid), orderBy('lastMessageDate', 'desc'));
          return collectionData(chatsQuery, { idField: 'id' }).pipe(map((chats) => this.updateChatsObject(user!, chats as Chat[]))) as Observable<Chat[]>
        }),
      )
  }

  updateChatsObject(user: UserProfile, chats: Chat[]): Chat[] {
    return chats?.map((chat) => this.updateChatObjectFields(user, chat));
  }

  updateChatObjectFields(user: UserProfile, chat: Chat): Chat {
    const otherUserIndex = user?.uid === chat.userIds[0] ? 1 : 0;
    const currentUserIndex = user?.uid === chat.userIds[0] ? 0 : 1;
    const otherUser = chat.userData[otherUserIndex];
    const unSeenMessageCount = chat.userData[currentUserIndex].unSeenMessageCount;
    return { ...chat, lastMessageDate: (chat.lastMessageDate as any)?.toDate(), chatName: otherUser.displayName, chatPhotoUrl: otherUser.photoUrl, unSeenMessageCount };
  }

  getChatWithId(chatId: string): Observable<Chat | null> {
    return this.user.currentUserProfile$.pipe(
      take(1),
      filter(user => !!user),
      switchMap(user => {
        const ref = doc(this.fireStore, 'chats', chatId);
        return from(docData(ref, { idField: 'id' }) as Observable<Chat>).pipe(map(chat => this.updateChatObjectFields(user!, chat)));
      }))
  }

  getAndSetActiveChat(chatId: string): void {
    this.getChatWithId(chatId)
      .pipe(
        take(1),
        filter(chat => !!chat?.id)
      )
      .subscribe((chat) => {
        this.setActiveChat(chat!);
      });
  }

  handleSetActiveChat(chat: Chat): void {
    this.setActiveChat(chat);
  }

  setActiveChat(chat: Chat): void {
    const oldChatId = this.activeChat$.value?.id;
    if (!!oldChatId && oldChatId !== chat.id) {
      this.handleUpdateOfflineStatus(oldChatId);
    }
    this.activeChat$.next(chat);
  }

  handleUpdateOfflineStatus(chatId: string): void {
    this.getChatWithId(chatId)
      .pipe(
        filter(chat => !!chat?.id),
        take(1)
      )
      .subscribe((chat) => {
        this.setChatOnlineStatus(chat!, false);
      });
  }

  setChatOnlineStatus(chat: Chat, isOnline = true): void {
    if (!chat?.id) return;
    const chatRef = doc(this.fireStore, 'chats', chat.id);
    this.user.currentUserProfile$.pipe(
      filter(user => !!user),
      take(1),
      switchMap((user) => {
        return from(updateDoc(chatRef, {
          userData: this.updateChatOnlineStatus(user!, chat, isOnline)
        }))
      })
    ).subscribe();
  }

  getActiveChat(): Observable<Chat | null> {
    return this.activeChat$;
  }

  sendMessage(chatId: string, message: string): Observable<any> {
    const chatRef = collection(this.fireStore, 'chats', chatId, 'messages');
    const chatDocRef = doc(this.fireStore, 'chats', chatId);
    const fireBaseTimeStampForToday = Timestamp.fromDate(new Date());
    return this.user.currentUserProfile$
      .pipe(
        filter(user => !!user),
        take(1),
        concatMap((user) => {
          return from(addDoc(chatRef, {
            message,
            sender: user?.uid,
            sentDate: fireBaseTimeStampForToday
          })).pipe(switchMap(() => of(user)))
        }),
        concatMap(async (user) => {
          return from(updateDoc(chatDocRef, {
            lastMessage: message,
            lastMessageDate: fireBaseTimeStampForToday,
            userData: await this.getUpdatedChatUserDataWithUnSeenCount(user!)
          }))
        })
      );
  }

  updateChatOnlineStatus(user: UserProfile, chat: Chat, isOnline = true): ChatUserData[] {
    const currentUserIndex = user?.uid === chat.userIds[0] ? 0 : 1;
    chat.userData[currentUserIndex].isOnline = isOnline;
    chat.userData[currentUserIndex].unSeenMessageCount = 0;
    return chat.userData;
  }

  async getUpdatedChatUserDataWithUnSeenCount(user: UserProfile): Promise<ChatUserData[]> {
    const activeChatData = await firstValueFrom(this.getChatWithId(this.activeChat$.value!.id));
    const otherUserIndex = user?.uid === activeChatData?.userIds[0] ? 1 : 0;
    const otherUserData = activeChatData!.userData[otherUserIndex];
    if (otherUserData?.isOnline) return activeChatData!.userData;
    otherUserData.unSeenMessageCount = !!otherUserData.unSeenMessageCount ? otherUserData.unSeenMessageCount + 1 : 1;
    return activeChatData!.userData;
  }

  getMessages(chatId: string): Observable<Message[]> {
    const ref = collection(this.fireStore, 'chats', chatId, 'messages');
    const messagesQuery = query(ref, orderBy('sentDate', 'desc'));
    return from(collectionData(messagesQuery, { idField: 'id' }).pipe(map(chats => {
      chats.forEach((chat: any) => {
        chat!.sentDate = (chat.sentDate as any)?.toDate();
      })
      return chats as Message[]
    })))
  }

}
