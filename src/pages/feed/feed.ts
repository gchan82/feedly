import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController } from 'ionic-angular';
import firebase from 'firebase';
import moment from 'moment';
import { LoginPage } from '../login/login';
/**
 * Generated class for the FeedPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-feed',
  templateUrl: 'feed.html',
})
export class FeedPage {

  text: string = "";
  posts: any[] = []; //any can store anything
  pageSize: number = 10; // for pagination
  cursor: any; // cursor holds value of 10th post; when cursor reaches 10th post, firebase loads next 10 posts.
  infiniteEvent: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private loadingCtrl: LoadingController, private toastCtrl: ToastController) {

    this.getPosts();


  }

  getPosts() { // initial load of 10 posts.

    this.posts = []; //initialize post as blank array

    let loading = this.loadingCtrl.create({ //UX: notify user "Loading Feed"
      content: "Loading Feed..." //modal pop-up
    });

    loading.present(); //calls fxn above

    let query = firebase.firestore().collection("posts").orderBy("created", "desc").limit(this.pageSize); //orderBy: places posts in descending order based on created date; limit(this.pageSize): for pagination - load 10 posts at a time.

    //query.onSnapshot((snapshot) => { //onSnapshat (for realtime updates) is called everytime there is a change to firestore data
      //   let changedDocs = snapshot.docChanges();

      //   changedDocs.forEach((change) => {
      //     if (change.type == "added") {
      //       //TODO
      //     }
      //     if (change.type == "modified") {
      //       //TODO
      //       console.log("Document with id " + change.doc.id + " has been modified.");
      //     }
      //     if (change.type == "removed") {
      //       //TODO
      //     }
      //   })
      // })

      query.get()
        .then((docs) => { //docs is a QuerySnapshot (many docs) - need to loop over to access all the objects

          docs.forEach((doc) => {
            this.posts.push(doc); //push each doc object onto posts array
          })

          loading.dismiss(); //once posts load, dismiss loading notification.

          this.cursor = this.posts[this.posts.length - 1];

          console.log(this.posts)

        }).catch((err) => {
          console.log(err)
        })
    }

  loadMorePosts(event) { // pagination: load 10 more posts.

        firebase.firestore().collection("posts").orderBy("created", "desc").startAfter(this.cursor).limit(this.pageSize).get() //orderBy: places posts in descending order based on created date; limit(this.pageSize): for pagination - load 10 posts at a time. startAfter: initiates page load when cursor reaches limit.
          .then((docs) => { //docs is a QuerySnapshot (many docs) - need to loop over to access all the objects

            docs.forEach((doc) => {
              this.posts.push(doc); //push each doc object onto posts array
            })

            console.log(this.posts)

            if (docs.size < this.pageSize) { //monitor when loading 10 posts complete.
              event.enable(false);
              this.infiniteEvent = event; // will be used to re-enable infinite-scroll in refresh fxn
            } else {
              event.complete(); //turns off pagination
              this.cursor = this.posts[this.posts.length - 1]; // move cursor to the next 10th post.
            }

          }).catch((err) => {
            console.log(err)
          })

      }

  refresh(event) { //page refresh when user scrolls to top; get latest 10 posts; re-enable infinite scroll in case user reached bottom of list.

        this.posts = []; //re-initialize posts array, so it doesn't keep adding 10 posts, 20 posts, 30 posts,etc. Rather load updated 10 posts and hold in array, then display on-screen for user.

        this.getPosts();

        if(this.infiniteEvent) {
          this.infiniteEvent.enable(true); //re-enable infinite-scroll; was turned off when user reached bottom of posts list(line 66/86 - event.complete()).
        }

    event.complete(); //turn off refresh function.
      }

  post() {
        firebase.firestore().collection("posts").add({ //collections are containers for similar documents (of data)
          text: this.text,
          created: firebase.firestore.FieldValue.serverTimestamp(), //serverTimestamp gives us time post was created on server
          owner: firebase.auth().currentUser.uid,
          owner_name: firebase.auth().currentUser.displayName
        }).then((doc) => {
          console.log(doc)

          this.text = ""; //clear text input after message posted to database

          let toast = this.toastCtrl.create({ //notify user that msg posted
            message: "Your post has been created successfully.",
            duration: 3000
          }).present();

          this.getPosts(); //update posts onto user page after adding post to firestore collection

        }).catch((err) => {
          console.log(err)
        })
      }

  ago(time) {
        let difference = moment(time).diff(moment()) //time difference: passes time to moment object; diff function calculates difference between time posted and current time.
    return moment.duration(difference).humanize(); // duration/humanize: convert difference to human readable form.
      }

  logout() {

        firebase.auth().signOut().then(() => {

          let toast = this.toastCtrl.create({
            message: "You have been logged out successfully.",
            duration: 3000
          }).present();

          this.navCtrl.setRoot(LoginPage);
        });

      }

}
