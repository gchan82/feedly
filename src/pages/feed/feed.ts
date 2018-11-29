import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, ToastController, ActionSheetController, AlertController, ModalController } from 'ionic-angular';
import firebase from 'firebase';
import moment from 'moment';
import { LoginPage } from '../login/login';
import { Camera, CameraOptions } from '@ionic-native/camera'; //Camera class allows for camera use/access, CameraOptions: configure camera
import { HttpClient } from '@angular/common/http';
import { CommentsPage } from '../comments/comments';
import { Firebase } from '@ionic-native/firebase';

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
  image: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, private loadingCtrl: LoadingController, private toastCtrl: ToastController, private camera: Camera, private http: HttpClient, private actionSheetCtrl: ActionSheetController, private alertCtrl: AlertController, private modalCtrl: ModalController, private firebaseCordova: Firebase) { //firebaseCordova for cloud messaging

    this.getPosts();

    this.firebaseCordova.getToken().then((token) => {
      console.log(token)

      this.updateToken(token, firebase.auth().currentUser.uid);
      
    }).catch((err) => {
      console.log(err)
    })

  }

  updateToken(token: string, uid: string) {

    firebase.firestore().collection("users").doc(uid).set({
      token: token,
      tokenUpdate: firebase.firestore.FieldValue.serverTimestamp()
    }, {
        merge: true
      }).then(() => {
        console.log("token saved to cloud firestore");
      }).catch(err => {
        console.log(err);
      })

  }

  getPosts() { // initial load of 10 posts.

    this.posts = []; //initialize post as blank array

    let loading = this.loadingCtrl.create({ //UX: notify user "Loading Feed"
      content: "Loading Feed..." //modal pop-up
    });

    loading.present(); //calls fxn above

    let query = firebase.firestore().collection("posts").orderBy("created", "desc").limit(this.pageSize); //orderBy: places posts in descending order based on created date; limit(this.pageSize): for pagination - load 10 posts at a time.

    query.onSnapshot((snapshot) => { //onSnapshat (for realtime updates) is called everytime there is a change to firestore data
      let changedDocs = snapshot.docChanges();

      changedDocs.forEach((change) => {
        if (change.type == "added") {
          //TODO
        }
        if (change.type == "modified") { //use for +1/-1 likes
          for (let i = 0; i < this.posts.length; i++) { //go through all posts
            if (this.posts[i].id == change.doc.id) { // find post that matches changed document.
              this.posts[i] = change.doc; //replace post with changed document (the doc with +1/-1 likes)
              console.log("Document with id " + change.doc.id + " has been modified.");
            }
          }
        }
        if (change.type == "removed") {
          //TODO
        }
      })
    })

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

    if (this.infiniteEvent) {
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
    }).then(async (doc) => { // promise: await image upload
      console.log(doc)

      if (this.image) { //if user uploaded image
        await this.upload(doc.id) //upload image; doc.id is name of image file in firebase storage
      }

      this.text = ""; //clear text input after message posted to database
      this.image = undefined; //clear-remove image after image posted to database

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
    let difference = moment(time).diff(moment()); //time difference: passes time to moment object; diff function calculates difference between time posted and current time.
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
  addPhoto() {

    this.launchCamera();

  }

  launchCamera() {
    let options: CameraOptions = {
      quality: 100,
      sourceType: this.camera.PictureSourceType.CAMERA,
      destinationType: this.camera.DestinationType.DATA_URL, //DATA_URL bases base64 string
      encodingType: this.camera.EncodingType.PNG, //PNG high-quality
      mediaType: this.camera.MediaType.PICTURE, //PICTURE OR VIDEO
      correctOrientation: true, //re-orient picture
      targetHeight: 512, //512 pixels
      targetWidth: 512,
      allowEdit: true
    }

    this.camera.getPicture(options).then((base64Image) => { //getPicture returns picture user takes with camera
      console.log(base64Image);

      this.image = "data:image/png;base64," + base64Image; //base64Image data for picture; append data:image/png;base64 so image can be interpreted.

    }).catch((err) => {
      console.log(err)
    })
  }
  upload(name: string) { //upload image to firebase storage
    return new Promise((resolve, reject) => {

      let loading = this.loadingCtrl.create({
        content: "Uploading Image..." // will be present until promise resolves or rejects
      })

      loading.present();

      let ref = firebase.storage().ref("postImages/" + name); // ref: reference to path in firebase storage.
      let uploadTask = ref.putString(this.image.split(',')[1], "base64"); //1st param: base64 image data we are splitting into 2 pieces returning piece at index 1; store image data with "uploadTask", 2nd param: string base64 - must type "base64" exactly. Note: you can also pause(), resume(), and cancel() uploads with uploadTask.
      uploadTask.on("state_changed", (taskSnapshot: any) => { //state_changed event fires when upload starts, progresses, or completes.
        console.log(taskSnapshot)
        let percentage = taskSnapshot.bytesTransferred / taskSnapshot.totalBytes * 100;
        loading.setContent("Uploaded " + percentage + "% ...") //display % uploaded

      }, (error) => {
        console.log(error)
      }, () => {
        console.log("The upload is complete!");

        uploadTask.snapshot.ref.getDownloadURL().then((url) => { //retrieve image url
          console.log(url);

          firebase.firestore().collection("posts").doc(name).update({
            image: url // update image property in firestore
          }).then(() => {
            loading.dismiss() //dismiss the loading.present()
            resolve() //gives control back from Promise to calling function
          }).catch((err) => {
            loading.dismiss() //dismiss the loading.present()
            reject()
          })
        }).catch((err) => {
          loading.dismiss() //dismiss the loading.present()
          reject()
        })
      })
    })
  }
  like(post) {

    let body = {
      postId: post.id,
      userId: firebase.auth().currentUser.uid,
      action: post.data().likes && post.data().likes[firebase.auth().currentUser.uid] == true ? "unlike" : "like" // if likes exists, pass currentUser.uid as an index to likes. If currentUser.uid is authorized (true) assign "unlike", otherwise assign "like".
      /*The LIKE button works as a toggle. If the post is already liked by user X, then user X can only unlike the post. They cannot like a post twice. To prevent that, we have a field called action that defines whether the user is liking the post or unliking it. If they have already liked it, the action will be set to unlike and vice versa.*/
    }

    let toast = this.toastCtrl.create({
      message: "Updating like... Please wait."
    });

    toast.present(); //place toast "Updating Like... Please wait" onto screen for user to see.

    this.http.post("https://us-central1-feedme-c73c0.cloudfunctions.net/updateLikesCount", JSON.stringify(body), {
      responseType: "text"
    }).subscribe((data) => {
      console.log(data)

      toast.setMessage("Like updated!");
      setTimeout(() => {
        toast.dismiss();
      }, 3000)

    }, (error) => {
      toast.setMessage("An error has occurred. Please try again later.")
      setTimeout(() => {
        toast.dismiss();
      }, 3000)
      console.log(error)
    })
  }


  comment(post) {

    this.actionSheetCtrl.create({
      buttons: [
        {
          text: "View All Comments",
          handler: () => {
            this.modalCtrl.create(CommentsPage, {
              "post": post // "post" goes to comments.ts line 21
            }).present();
          }
        },
        {
          text: "New Comment",
          handler: () => {

            this.alertCtrl.create({
              title: "New Comment",
              message: "Type your comment",
              inputs: [
                {
                  name: "comment",
                  type: "text"
                }
              ],
              buttons: [
                {
                  text: "Cancel"
                },
                {
                  text: "Post",
                  handler: (data) => {

                    if (data.comment) {

                      firebase.firestore().collection("comments").add({
                        text: data.comment,
                        post: post.id,
                        owner: firebase.auth().currentUser.uid,
                        owner_name: firebase.auth().currentUser.displayName,
                        created: firebase.firestore.FieldValue.serverTimestamp()
                      }).then((doc) => {
                        this.toastCtrl.create({
                          message: "Comment posted successfully.",
                          duration: 3000
                        }).present();
                      }).catch((err) => {
                        this.toastCtrl.create({
                          message: err.message,
                          duration: 3000
                        }).present();
                      })

                    }

                  }
                }
              ]
            }).present();

          }
        }

      ]
    }).present()
  }
}