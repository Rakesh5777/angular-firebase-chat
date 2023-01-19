import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, UserCredential, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { DeviceUtils } from './device.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public currentuser$ = authState(this.auth);

  constructor(private auth: Auth, private deviceUtil: DeviceUtils) { }

  login(userName: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, userName, password));
  }

  signUp(userName: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, userName, password));
  }

  signOut(): Observable<void> {
    return from(this.auth.signOut());
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    return from(signInWithPopup(this.auth, provider));
  }

}
