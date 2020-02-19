import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import Rebase from 're-base'

const fb = {

  // Must be bound to component
  initialize: function(callback) {
    var config = {
      apiKey: "AIzaSyA2qBQFBKatLl9z8wFwR4RnuDX2_QnG2Sk",
      authDomain: "paracord-engine.firebaseapp.com",
      databaseURL: "https://paracord-engine.firebaseio.com",
      projectId: "paracord-engine",
      storageBucket: "paracord-engine.appspot.com",
      messagingSenderId: "512623900874"
    };
    this.app = firebase.initializeApp(config);

    fb.db = firebase.firestore(this.app);
    fb.auth = firebase.auth();
    fb.base = Rebase.createClass(fb.db);

    fb.auth.onAuthStateChanged(function(user) {
      if (user) {
        callback(user);
      } else {
        callback(null);
      }
    });
  },


  showAuthPopup: function() {

    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider).then(function(result) {
      this.user = result.user;
      console.log(this.user);
    }).catch(function(error) {
      // An error occurred
    });
  }




}
export default fb;
