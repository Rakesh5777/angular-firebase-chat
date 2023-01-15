import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  })

  constructor(private auth: AuthService, private router: Router, private toast: HotToastService) { }

  ngOnInit() {
  }

  onSubmit(): void {
    const { email, password } = this.loginForm.value;
    this.auth.login(email!, password!)
      .pipe(this.toast.observe({
        loading: 'Logging in...',
        success: 'Logged in successfully!',
        error: 'Login failed!'
      }))
      .subscribe(() => {
        this.router.navigate(['/home']);
      });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  logInWithGoogle(): void {
    this.auth.signInWithGoogle()
      .pipe(this.toast.observe({
        loading: 'Logging in...',
        success: 'Logged in successfully!',
        error: 'Login failed!'
      }))
      .subscribe(() => {
        this.router.navigate(['/home']);
      });
  }

}
