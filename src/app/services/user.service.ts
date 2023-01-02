import { Observable, from, of, switchMap } from 'rxjs';
import { UserProfile } from './../../models/userProfile';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, query, setDoc, updateDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public currentUserProfile$: Observable<UserProfile | null> = this.getCurrentUserProfile();

  constructor(private fireStore: Firestore, private auth: AuthService) { }

  private getCurrentUserProfile(): Observable<UserProfile | null> {
    return this.auth.currentuser$.pipe(switchMap((user: User | null) => {
      if (!user?.uid) {
        console.log('No user logged in');
        return of(null);
      }

      const userDoc = doc(this.fireStore, 'users', user.uid);
      return from(docData(userDoc) as Observable<UserProfile>);
    }))
  }

  addUser(user: UserProfile): Observable<any> {
    const userDoc = doc(this.fireStore, 'users', user?.uid);
    return from(setDoc(userDoc, user));
  }

  updateUser(user: UserProfile): Observable<any> {
    const userDoc = doc(this.fireStore, 'users', user?.uid);
    return from(updateDoc(userDoc, { ...user }));
  }

  get allUsers$(): Observable<UserProfile[]> {
    const ref = collection(this.fireStore, 'users');
    const queryAll = query(ref)
    return collectionData(queryAll) as Observable<UserProfile[]>;
  }

  getUserByUid(uid: string): Observable<UserProfile> {
    const userDoc = doc(this.fireStore, 'users', uid);
    return from(docData(userDoc) as Observable<UserProfile>);
  }

}
