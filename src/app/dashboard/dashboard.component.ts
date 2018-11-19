import { Component, OnInit, Input } from '@angular/core';
import { DashboardService } from './dashboard.service';
import {HttpClient} from '@angular/common/http';
import { vision } from 'src/environments/environment';
import {WebcamImage} from 'ngx-webcam';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  holderArray: any[];
  foundImage: any;
  pictureTaken:boolean;
  webcamImage: WebcamImage = null;
  webcamURL: any;
  showWebcam: boolean;
  searches: any[];
  wordsArray: any[];
  currentCards: any[];
  searchMatch: boolean;
  notFound:boolean;
  searchResultCard: any;
  constructor(private dashboardService: DashboardService, private http:HttpClient) {
    this.holderArray = [];
    this.pictureTaken = false;
    this.showWebcam = false;
    this.searchMatch = false;
    this.notFound = false;
    this.searches = [];
    this.wordsArray = [];
    this.currentCards = [];

    dashboardService.getCards().subscribe((reference:any) => {
      Object.keys(reference).forEach( (element:any) => {
        let obj = reference[element];
        this.currentCards.push(obj);
      });
    });
  }


  textDetection(){
    this.searchMatch = false;
    this.notFound = false;
    console.log(this.webcamImage.imageAsBase64.toString)
    const request: any = {
      'requests': [
        {
          'image': {
            "content": this.webcamImage.imageAsBase64
          },
          'features': [
            {
              'type': 'TEXT_DETECTION',
              'maxResults': 1,
            }
          ]
        }
      ]
    };
    
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${vision.visionKey}`;
    this.http.post(url,request).subscribe( (results: any) => {
      console.log('Google Vision Results:');
      console.log(results);
      var responses = results['responses'];
      var text = responses[0];
      var textAnnotations = text['textAnnotations'];
      console.log("text annotations: ");
      console.log(textAnnotations);
      this.wordsArray = textAnnotations;
      var parsedList = [];
      parsedList["card"] = this.webcamImage.imageAsBase64;

      var parsedEmailPhone = this.parseEmailPhone(this.wordsArray);

      this.wordsArray = parsedEmailPhone.wordsArray;
      this.holderArray = this.wordsArray;
      console.log("this.wordsArray: " + this.wordsArray);
      parsedList["email"] = parsedEmailPhone.email;
      parsedList["phone"] = parsedEmailPhone.phone;
      parsedList["extra"] = this.wordsArray[0].description;
      var fullName = this.parseNames(parsedEmailPhone.email, this.wordsArray);
      parsedList["fname"] = fullName.fname;
      parsedList["lname"] = fullName.lname;
      console.log("parsedList:");
      console.log(parsedList);
      // this.dashboardService.addCard(parsedList);
      // this.dashboardService.addHistory("business card for " + fullName.fname + " " + fullName.lname + " added");
    });
    
  }

  parseNames(email: string, wordsArray: any[]){
    var fname;
    var lname;
    var parsedEmail = email.split('@')[0];
    var nameSplitByDash;
    var potentialLastName;

    //case if email ex: stephanie.kim@gmail.com
    if (parsedEmail.indexOf(".") > -1) {
      nameSplitByDash = email.split('.');
      fname = nameSplitByDash[0];
      lname = nameSplitByDash[1];
    }
    //case if email ex: skim@gmail.com
    else {
      potentialLastName = parsedEmail.substr(1);
      var i = 1;
      for(i; i<wordsArray.length; i++) {
        let wordItem = wordsArray[i].description;
        var element = wordItem.replace(/[^\w\s]/gi, '');
        if (element.toLowerCase() == potentialLastName) {
          lname = element;
          fname = wordsArray[i-1].description;
          break;
        }
      }
    }

      var fullName = { "fname": fname, "lname": lname};
      return fullName;
  }

  parseEmailPhone(wordsArray: any[]){
    var email;
    var phone;
    var phoneRegex = new RegExp("\\+?\\(?\\d*\\)? ?\\(?\\d+\\)?\\d*([\\s./-]?\\d{2,})+", "g");
    var i;
    for (i = 1; i < wordsArray.length; i++) {
      if (wordsArray[i].description.indexOf('@') > -1) {
        email = wordsArray[i].description;
        wordsArray.splice( wordsArray.indexOf(wordsArray[i]), 1 );
      }
      if (phoneRegex.exec(wordsArray[i].description) != null){
        phone = wordsArray[i].description;
        wordsArray.splice( wordsArray.indexOf(wordsArray[i]), 1 );
      }
    }
    if(email == null){
      email = "Not Found";
     }
    console.log(email);
    return {"email": email, "phone": phone, "wordsArray": wordsArray};
  }

  getCards(input: HTMLInputElement){
    var found = false;
    var searchVal = input.value.toLowerCase();
    for (var currentCard in this.currentCards){
      let x = this.currentCards[currentCard];
      if(x.email.toLowerCase() === searchVal || x.fname.toLowerCase() === searchVal || x.lname.toLowerCase() === searchVal || x.phone.toLowerCase() === searchVal){
        console.log("Search matched card");
        found = true;
        this.searchResultCard = this.currentCards[currentCard];
        console.log(this.searchResultCard);
        this.searchMatch = true;
        var image = new Image();
        image.src = this.searchResultCard.card;
        this.foundImage = image;
        break;
      }
    }
    if(!found){
      this.searchMatch = false;
      this.notFound = true;
    }

  }

  private trigger: Subject<void> = new Subject<void>();
  public handleImage(webcamImage: WebcamImage): void {
    console.log('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
    this.webcamURL = webcamImage.imageAsBase64;
    this.pictureTaken = true;
  }
  public triggerSnapShot(): void {
    this.trigger.next();
  }
  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  toggleWebcam(){
    this.showWebcam = !this.showWebcam;
  }

  ngOnInit() {

  }

}
