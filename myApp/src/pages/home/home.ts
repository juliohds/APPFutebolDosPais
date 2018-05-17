import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ListPage as GameListPage } from '../game/list/list';
import { TabelaArtilhariaPage as ScorersListPage } from '../game/tabelaArtilharia/tabelaArtilharia';
import { DetailsPage as GameDetails } from '../game/details/details';
import { DatabaseProvider } from './../../providers/database/database';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  ultimoJogo: Object;
  artilheiros: Array<Object>;

  constructor(public navCtrl: NavController, private databaseProvider: DatabaseProvider) {
    this.databaseProvider.getDatabaseState().subscribe(ready => {
      if (ready) {
        Promise.all([ this.loadLastGame(), this.loadScorers() ])
        .then(res => {
          this.ultimoJogo = res[0]
          this.artilheiros = res[1]
        })
        .catch(err => console.log(err))
      }
    })
  }
  toGamesList(event, league) {
    this.navCtrl.push(GameListPage);
  }
  toScorersList(event, league) {
    this.navCtrl.push(ScorersListPage);
  }
  toGameDetails(event, game) {
    console.log(game)
    this.navCtrl.push(GameDetails, { game: game });
  }
  loadLastGame():Promise<Object> {
    return this.databaseProvider.getAll('jogos')
    .then(res => {
        let ultimoJogo = <any> { dateTime: 0 };
        res.map(o => {
          let game = <any> o;
          game.dateTime = this.parseDateTime(game.horario, game.data);
          ultimoJogo = game.dateTime > ultimoJogo.dateTime ? game : ultimoJogo;
        })
        ultimoJogo.equipe1Logo = this.databaseProvider.getBadge(ultimoJogo.equipe1);
        ultimoJogo.equipe2Logo = this.databaseProvider.getBadge(ultimoJogo.equipe2);
        return ultimoJogo;
    })
    .catch(err => console.log(err))
  }
  loadScorers(): Promise<any> {
    return this.databaseProvider.getAll("artilheiros").then(res => {
      const scorers = res.slice(0, 3); //OS TOP
      let scorer = <any> {};
      scorers.map(o => {
        scorer = o;
        scorer.nome = scorer.nome.split(" ")[0];
        scorer.equipeLogo = this.databaseProvider.getBadge(scorer.equipe);
      })
      return scorers;
    }).catch(err => console.log(err))
  }
  parseDateTime(hour:String, date:String): number {
    const dateArray = date.split("/")
    return parseInt(dateArray[2] + dateArray[1] + dateArray[0] + hour.replace(':', ''))
  }


  // testeDb():Promise<any> {
  //   const promises = [];
  //   this.databaseProvider.tables.map(table => {
  //                                             //NOME DA TABELA
  //     promises.push(this.databaseProvider.getAll(table));
  //                                             //NOME DA TABELA, ID
  //     promises.push(this.databaseProvider.getById(table, 1));
  //                                             //QUERY, PARAMETROS, COLUNAS  exp: ('SELECT id,nome FROM artilheiros WHERE id = ?', [1], ['id', 'nome'])
  //     promises.push(this.databaseProvider.getCustomize(`SELECT campos FROM ${table}`, [], ['campos']));
  //   })
  //   return Promise.all(promises).then(res => res).catch(err => err)
  // }

}
