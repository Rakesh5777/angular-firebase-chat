import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { LandingPageComponent } from './components/landingpage/landingpage.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/createprofile/createprofile.component';
import { HomeComponent } from './components/home/home.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { AuthService } from './services/auth.service';
import { HotToastModule } from '@ngneat/hot-toast';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from './services/user.service';
import { StorageService } from './services/storage.service';
import { AllchatsComponent } from './components/allchats/allchats.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { ChatComponent } from './components/chat/chat.component';
import { MatTabsModule } from '@angular/material/tabs';

const MatModules = [
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatMenuModule,
  MatAutocompleteModule,
  MatListModule,
  MatTabsModule
]
@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    AllchatsComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ...MatModules,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
    provideFirestore(() => getFirestore()),
    HotToastModule.forRoot(),
  ],
  providers: [AuthService, UserService, StorageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
