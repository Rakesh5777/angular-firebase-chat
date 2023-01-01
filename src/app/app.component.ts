import { UserService } from './services/user.service';
import { HotToastService } from '@ngneat/hot-toast';
import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'angular-firebase-chat-app';

  constructor(public auth: AuthService, private router: Router, private toast: HotToastService, public user: UserService) { }

  signOut(): void {
    this.auth.signOut()
      .pipe(this.toast.observe({
        loading: 'Signing out...',
        success: 'Signed out successfully!',
        error: 'Sign out failed!'
      }))
      .subscribe(() => {
        this.router.navigate(['login']);
      });
  }

}
