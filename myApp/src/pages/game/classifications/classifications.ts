
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from './../../../providers/database/database';

@Component({
  selector: 'page-classifications',
  templateUrl: 'classifications.html'
})
export class ClassificationsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider) {

  }
}
