import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import firebase from 'firebase';
import moment from 'moment';
/**
 * Generated class for the CommentsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-comments',
  templateUrl: 'comments.html',
})
export class CommentsPage {

  post: any = {};
  comments: any[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewCtrl: ViewController) {

    this.post = this.navParams.get("post"); //"post" from  modalCtrl on feed.ts line ~283
    console.log(this.post)


    firebase.firestore().collection("comments")
      .where("post", "==", this.post.id)
      .orderBy("created", "asc") //order comments in ascending order (most recent @ bottom)
      .get()
      .then((data) => {
        this.comments = data.docs;
      }).catch((err) => {
        console.log(err)
      })
  }

  close() {
    this.viewCtrl.dismiss(); //closes modal for comments
  }

  ago(time) {
    let difference = moment(time).diff(moment()); //time difference: passes time to moment object; diff function calculates difference between time posted and current time.
    return moment.duration(difference).humanize(); // duration/humanize: convert difference to human readable form.
  }

}
