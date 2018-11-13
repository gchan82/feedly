import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import {HttpClientModule} from '@angular/common/http';

import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { FeedPage } from '../pages/feed/feed';

import {Camera} from '@ionic-native/camera';

import firebase from 'firebase';

var config = {
  apiKey: "AIzaSyAJ5kG14p-9qaEAnJey1pHEtlXkMOU1GQQ",
  authDomain: "feedme-c73c0.firebaseapp.com",
  databaseURL: "https://feedme-c73c0.firebaseio.com",
  projectId: "feedme-c73c0",
  storageBucket: "feedme-c73c0.appspot.com",
  messagingSenderId: "911994958906"
};
firebase.initializeApp(config);
firebase.firestore().settings({
  timestampsInSnapshots: true
})

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    SignupPage,
    FeedPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    SignupPage,
    FeedPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Camera,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
