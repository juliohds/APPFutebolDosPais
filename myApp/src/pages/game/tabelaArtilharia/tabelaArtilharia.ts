
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from './../../../providers/database/database';

@Component({
  selector: 'page-tabelaArtilharia',
  templateUrl: 'tabelaArtilharia.html'
})
export class TabelaArtilhariaPage {

  artilheiros: Array<Object>

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider) {
    this.databaseProvider.getDatabaseState().subscribe(ready => {
      if (ready) {
        this.loadScorers()
          .then(res => {
            this.artilheiros = res;
          })
          .catch(err => {

          })
      }
    });
  }
  loadScorers(): Promise<any> {
    return this.databaseProvider.getAll("artilheiros").then(res => {
      let scorer = <any>{};
      res.map(o => {
        scorer = o;
        scorer.nome = scorer.nome.split(" ")[0];
        scorer.equipeLogo = this.databaseProvider.getBadge(scorer.equipe);
      })
      return res;
    }).catch(err => console.log(err))
  }

}
