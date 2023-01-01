import { Chat, Message } from './../../models/chat';
import { UserProfile } from './../../models/userProfile';
import { Observable, concatMap, take, map, filter, BehaviorSubject, switchMap, from, of } from 'rxjs';
import { UserService } from './user.service';
import { Firestore, doc, collection, addDoc, query, where, collectionData, Timestamp, updateDoc } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { orderBy } from '@firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  public activeChat$ = new BehaviorSubject<Chat | null>(null);

  constructor(private fireStore: Firestore, private user: UserService) { }

  selectChat(otherUser: UserProfile): Observable<Chat> {
    return this.myChats$.pipe(
      take(1),
      switchMap((chats) => {
        const chat = chats.find(chat => chat.userIds.includes(otherUser.uid));
        if (!!chat?.id) {
          return of(chat);
        }
        return this.createChatDoc(otherUser);
      })
    )
  }

  createChatDoc(otherUser: UserProfile): Observable<Chat> {
    const ref = collection(this.fireStore, 'chats');
    return this.user.currentUserProfile$
      .pipe(
        take(1),
        concatMap(user => from(addDoc(ref,
          {
            userIds: [user?.uid, otherUser?.uid],
            userData: [{ displayName: user?.displayName, photoUrl: user?.photoURL }, { displayName: otherUser?.displayName, photoUrl: otherUser?.photoURL }]
          }
        ))),
        map((ref: any) => ref as Chat)
      )
  }

  get myChats$(): Observable<Chat[]> {
    const ref = collection(this.fireStore, 'chats');
    return this.user.currentUserProfile$
      .pipe(
        filter(user => !!user),
        concatMap(user => {
          const chatsQuery = query(ref, where('userIds', 'array-contains', user?.uid))
          return collectionData(chatsQuery, { idField: 'id' }).pipe(map((chats) => this.updateChatsObject(user!, chats as Chat[]))) as Observable<Chat[]>
        }),
      )
  }

  updateChatsObject(user: UserProfile, chats: Chat[]): Chat[] {
    return chats?.map((chat) => {
      const otherUserIndex = user?.uid === chat.userIds[0] ? 1 : 0;
      const otherUser = chat.userData[otherUserIndex];
      return { ...chat, lastMessageDate: (chat.lastMessageDate as any)?.toDate(), chatName: otherUser.displayName, chatPhotoUrl: otherUser.photoUrl }
    })
  }

  setActiveChat(chat: Chat): void {
    this.activeChat$.next(chat);
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
    }))) as Observable<Message[]>
  }

}
