import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
const corsHandler = cors({origin: true}); //cors fix



admin.initializeApp(functions.config().firebase);

export const exampleFunction= functions.https.onRequest(async (request, response) => { //cors fix
  corsHandler(request, response, () => {}); //cors fix

const sendNotification = (owner_uid, type) => {
  return new Promise((resolve, reject) => {
    return admin.firestore().collection("users").doc(owner_uid).get().then((doc) => {
      if (doc.exists && doc.data().token) {

        if (type === "new_comment") {
          admin.messaging().sendToDevice(doc.data().token, {
            data: {
              title: "A new comment has been made on your post.",
              sound: "default",
              body: "Tap to Check"
              
            }
          }).then((sent) => {
            resolve(sent)
          }).catch((err) => {
            reject(err)
          })
        } else if (type == "new_like") {
          admin.messaging().sendToDevice(doc.data().token, {
            data: {
              title: "Someone liked your post on Feedly.",
              sound: "default",
              body: "Tap to Check"
            }
          }).then((sent) => {
            resolve(sent)
          }).catch((err) => {
            reject(err)
          });
        }

      }
    })

  })
}
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
export const updateLikesCount = functions.https.onRequest((request, response) => {
  console.log(request.body);

  const postId = JSON.parse(request.body).postId;
  const userId = JSON.parse(request.body).userId;
  const action = JSON.parse(request.body).action; //'like' or 'unlike'

  admin.firestore().collection("posts").doc(postId).get().then((data) => {
    let likesCount = data.data().likesCount || 0; //if likesCount is undefines, then it will be assigned to 0.
    let likes = data.data().likes || [];

    let updateData = {};

    if (action == "like") {
      updateData["likesCount"] = ++likesCount;
      updateData[`likes.${userId}`] = true; //likes object of that post will be created. Is this userId who likes post or userId of owner of post?
    } else {
      updateData["likesCount"] = --likesCount;
      updateData[`likes.${userId}`] = false;
    }
    admin.firestore().collection("posts").doc(postId).update(updateData).then(async () => {

      if (action == "like") {
        await sendNotification(data.data().owner, "new_like");
      }

      response.status(200).send("Done")
    }).catch((err) => {
      response.status(err.code).send(err.message);
    })
  }).catch((err) => {
    response.status(err.code).send(err.message);
  })
})

export const updateCommentsCount = functions.firestore.document('comments/{commentId}').onCreate(async (event) => {
  let data = event.data();

  let postId = data.post;

  let doc = await admin.firestore().collection("posts").doc(postId).get();

  if (doc.exists) {
    let commentsCount = doc.data().commentsCount || 0;
    commentsCount++;

    await admin.firestore().collection("posts").doc(postId).update({
      "commentsCount": commentsCount
    })

    return sendNotification(doc.data().owner, "new_comment");

  } else {
    return false;
  }
})

});