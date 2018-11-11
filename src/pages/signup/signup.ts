import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import firebase from 'firebase';
import { FeedPage } from '../feed/feed';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})
export class SignupPage {
  name: string = "";
  email: string = "";
  password: string = "";

  constructor(public navCtrl: NavController, public navParams: NavParams, public toastCtrl: ToastController, public alertCtrl: AlertController) {
  }
  signup() {
    firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then((data) => {
console.log(data) // log when user signup completes
      let newUser: firebase.User = data.user; //update profile. extracting data from user object (in data.user) to newUser of type firebase.User
      newUser.updateProfile({
        displayName: this.name,
        photoURL: ""
      }).then(() => {
        console.log('Profile updated') // log when profile update completes

        this.alertCtrl.create({
          title: "Account Created",
          message: "Your account has been created successfully.",
          buttons: [ // array of buttons
            {
              text: "OK",
              handler: () => { //what is executed when user clicks on button
//Navigate to the feeds page
this.navCtrl.setRoot(FeedPage) // sets FeedPage as Root page & user cannot navigate back to login page.

              }
            }
          ]
        }).present(); //call present fxn to display alerts/toasts
        
      }).catch((err) => {
        console.log(err)

      })

     // console.log(user)
    }).catch((err) => {
      console.log(err)
      this.toastCtrl.create({
        message: err.message,
        duration: 3000
    }).present();
  })
  }
  goBack() {
    this.navCtrl.pop();
  }
}
