import { Chat, Message } from './../../models/chat';
import { UserProfile } from './../../models/userProfile';
import { Observable, concatMap, take, map, filter, BehaviorSubject, switchMap, of, combineLatest, from } from 'rxjs';
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
    const otherUser = chat.userData[otherUserIndex];
    return { ...chat, lastMessageDate: (chat.lastMessageDate as any)?.toDate(), chatName: otherUser.displayName, chatPhotoUrl: otherUser.photoUrl }
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
      .pipe(take(1))
      .subscribe((chat) => {
        this.activeChat$.next(chat)
      });
  }

  setActiveChat(chat: Chat): void {
    this.activeChat$.next(chat)
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
          }))
        }),
        concatMap(() => {
          return from(updateDoc(chatDocRef, {
            lastMessage: message,
            lastMessageDate: fireBaseTimeStampForToday
          }))
        })
      );
  }

  getActiveChat(): Observable<Chat | null> {
    return this.activeChat$;
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
