import { Injectable } from '@angular/core';
import { LoginService } from '../login/login.service';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable()
export class DashboardService {
  searchHistoryRef: any;
  searchHistory: any[];
  constructor(private loginService: LoginService, private db: AngularFireDatabase) {
    this.searchHistoryRef = this.db.list(`currentSession/${this.loginService.userUid}/searches`);
    this.searchHistory = [];
  }

  addCard(businessObj: any){
    this.db.list(`businessCards/`).push(businessObj);
  }

  getCards() {
    return this.db.object(`businessCards/`).valueChanges();
  }

  getAdmin(){
    return this.db.object(`admins/`).valueChanges();
  }

  addHistory(history: string){
    console.log(this.loginService.userUid);
    this.db.list(`history/${this.loginService.userUid}`).push(history);
  }

  getHistory(){
    return this.db.object(`history/${this.loginService.userUid}`).valueChanges();
  }
}
