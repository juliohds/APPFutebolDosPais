
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from './../../../providers/database/database';

@Component({
  selector: 'page-cards',
  templateUrl: 'cards.html'
})
export class CardsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider) {

  }
}
