
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from './../../../providers/database/database';

@Component({
  selector: 'page-suspensions',
  templateUrl: 'suspensions.html'
})
export class SuspensionsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider) {

  }
}
