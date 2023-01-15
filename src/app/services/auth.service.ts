import { DeviceUtils } from './device.service';
import { Injectable } from '@angular/core';
import { Auth, UserCredential, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

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
    const googleSignUpFunction = this.deviceUtil.isMobile ? signInWithRedirect : signInWithPopup;
    return from(googleSignUpFunction(this.auth, provider));
  }

}
