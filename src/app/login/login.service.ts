import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {Router} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import {switchMap} from 'rxjs/operators';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/of';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase/app';

@Injectable()
export class LoginService {
  authState: Observable<{} | null>;

  user: Observable<{} | null>;
  userUid: string;
  constructor(private afAuth: AngularFireAuth,private router: Router,private db: AngularFireDatabase
  ) {

    this.user = this.afAuth.authState.pipe( switchMap((user) => {
      if (user) {
        this.userUid = user.uid;
        console.log(user);
        return this.db.object(`users/${user.uid}`).update({email: user.email}).then( () => {
          return this.db.object(`users/${user.uid}`).valueChanges();
        }).catch( (error) => {
          console.log(error);
        });
      } else {
        return Observable.of(null);
      }
    }));
  }

  loginWithEmail(email: string, password: string) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then((auth) => {
        console.log(auth.user.uid);
        const createdTime = firebase.database.ServerValue.TIMESTAMP;
        console.log(createdTime);
        const sessionKey = this.db.database
                        .ref(`sessions`)
                        .push({
                          userUid: auth.user.uid
                        }).key;

        const sessionPayload: any = {
          createdTime: createdTime,
          userUid: auth.user.uid,
          currentSessionKey: sessionKey,
        };

        const sessionPayloads: any = {};
        sessionPayloads[`currentSession/${auth.user.uid}`] = sessionPayload;
        sessionPayloads[`users/${auth.user.uid}/sessions/${sessionKey}`] = {'createdAt': createdTime};
        return this.db.database.ref().update(sessionPayloads);
      })
      .catch(error => {
        console.log(error);
        throw error;
      });
  }

  signOut() {
    this.afAuth.auth.signOut();
    this.router.navigate(['/']);
  }
}