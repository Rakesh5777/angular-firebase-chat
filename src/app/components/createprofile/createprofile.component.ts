import { UserProfile } from './../../../models/userProfile';
import { HotToastService } from '@ngneat/hot-toast';
import { StorageService } from '../../services/storage.service';
import { AuthService } from './../../services/auth.service';
import { UserService } from './../../services/user.service';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of, switchMap, Observable, filter, concatMap, throwError } from 'rxjs';

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value ? { 'passwordMismatch': true } : null;
  }
}

@Component({
  selector: 'app-signup',
  templateUrl: './createprofile.component.html',
  styleUrls: ['./createprofile.component.css']
})
export class SignupComponent implements OnInit {

  public profilePic: File | null = null;
  public updatedProfilePicUrl: string | null = null;

  public signUpForm = new FormGroup({
    uid: new FormControl(''),
    photoURL: new FormControl(''),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    displayName: new FormControl('', [Validators.required]),
    phone: new FormControl(''),
    address: new FormControl(''),
    ...this.isSignUpRoute
      ? {
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)])
      } : {}
  }, { validators: passwordMatchValidator() });

  constructor(
    private router: Router,
    public user: UserService,
    private auth: AuthService,
    private storage: StorageService,
    private toast: HotToastService
  ) { }

  ngOnInit(): void {
    this.user.currentUserProfile$.subscribe((user: UserProfile | null) => {
      if (!user) return;
      this.signUpForm.patchValue({ ...user });
      this.updatedProfilePicUrl = user?.photoURL || null;
    });
  }

  setFile(event: any) {
    if (!event.target.value && !event.target.files[0]) return;
    this.profilePic = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event: any) => this.updatedProfilePicUrl = event.target.result;
    reader.readAsDataURL(event.target.files[0]);
  }

  onSubmit(): void {
    if (!this.signUpForm.valid) return;
    this.isSignUpRoute ? this.signUp() : this.updateProfile();
  }

  signUp(): void {
    const { email, password } = this.signUpForm.value;
    if (!email || !password) return;
    const toast = this.toast.loading('Signing up...');
    this.auth.signUp(email, password)
      .pipe(this.toast.observe({
        error: 'Something went wrong! Please try again.'
      }))
      .pipe(concatMap(async (user) => {
        const { uid } = user.user;
        const { firstName, lastName, displayName, phone, address } = this.signUpForm.value;
        const photoURL = this.profilePic ? await this.storage.uploadProfilePic(this.profilePic, `images/profile/${uid}`) : null;
        return { firstName, lastName, displayName, phone, address, uid, photoURL } as UserProfile;
      }), switchMap((user: UserProfile) => this.user.addUser(user)))
      .subscribe(() => {
        toast.updateMessage('Signed up successfully!');
        toast.updateToast({ type: 'success' });
        toast.close();
        setTimeout(() => {
          this.router.navigateByUrl('/home');
        })
      });
  }

  async updateProfile(): Promise<void> {
    const { uid, firstName, lastName, displayName, phone, address, photoURL } = this.signUpForm.value;
    if (!uid) return;
    const toast = this.toast.loading('Updating profile...');
    const localPhotoUrl = this.profilePic ? await this.storage.uploadProfilePic(this.profilePic, `images/profile/${uid}`) : photoURL;
    this.user.updateUser({ uid, firstName, lastName, displayName, phone, address, photoURL: localPhotoUrl })
      .pipe(this.toast.observe({
        error: 'Something went wrong! Please try again.',
      }))
      .subscribe(() => {
      });
  }

  get firstName() {
    return this.signUpForm.get('firstName');
  }

  get lastName() {
    return this.signUpForm.get('lastName');
  }

  get displayName() {
    return this.signUpForm.get('displayName');
  }

  get email() {
    return this.signUpForm.get('email');
  }

  get password() {
    return this.signUpForm.get('password');
  }

  get confirmPassword() {
    return this.signUpForm.get('confirmPassword');
  }

  get isSignUpRoute() {
    return this.router.url === '/signup';
  }

}