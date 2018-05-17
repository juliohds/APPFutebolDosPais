import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-details',
  templateUrl: 'details.html'
})
export class DetailsPage {
  jogo: object;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.jogo = navParams.get('game');
    console.log(this.jogo)
  }
}
