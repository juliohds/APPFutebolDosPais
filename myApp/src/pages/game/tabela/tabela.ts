
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from './../../../providers/database/database';

@Component({
  selector: 'page-tabela',
  templateUrl: 'tabela.html'
})
export class TabelaPage {
  jogos: Object
  turnos:  Object;
  rodadas: Object;
  ligas: Array<String> [];
  ligaSelecionada: String;

  constructor(public navCtrl: NavController, public navParams: NavParams, private databaseProvider: DatabaseProvider) {
    this.ligas = [];
    this.turnos = {};
    this.rodadas = {};
    this.ligaSelecionada = "Master";
    this.databaseProvider.getDatabaseState().subscribe(ready => {
      if (ready) {
        this.loadGames()
        .then(res => {
          this.jogos = res
          console.log(this.jogos)
        })
        .catch(err => console.log(err));
      }
    });
  }
  loadGames():any {
    return this.databaseProvider.getAll('tabela').then(res => {
      let games = <any> {}
      let game = <any>{}
      res.map(o => {
        game = o;
        if(!games[game.categoria]) {
          games[game.categoria] = {}
          this.ligas.push(game.categoria);
        }
        if(!games[game.categoria][game.turno]) {
          games[game.categoria][game.turno] = {}
          if(!this.turnos[game.categoria]) this.turnos[game.categoria] = [];
          this.turnos[game.categoria].push(game.turno);
        }
        if(!games[game.categoria][game.turno][game.rodada]) {
          games[game.categoria][game.turno][game.rodada] = []
          if(!this.rodadas[game.categoria]) this.rodadas[game.categoria] = {}
          if(!this.rodadas[game.categoria][game.turno]) this.rodadas[game.categoria][game.turno] = []
          this.rodadas[game.categoria][game.turno].push(game.rodada);
        }
        game.equipe1Logo = this.databaseProvider.getBadge(game.equipe1);
        game.equipe2Logo = this.databaseProvider.getBadge(game.equipe2);

        games[game.categoria][game.turno][game.rodada].push(game);
      })
      return games;
    }).catch(err => console.log(err));
  }
}
