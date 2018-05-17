import 'rxjs/add/operator/map';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Storage } from '@ionic/storage';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { Platform } from 'ionic-angular';
import { download } from 'image-downloader';
import { fs } from 'await-fs';


@Injectable()
export class DatabaseProvider {

  private jsonUrls: any;
  private databaseConfig: any;
  private badgeDirectory: String;
  private database: SQLiteObject;
  private databaseReady: BehaviorSubject<boolean>;
  public tables: Array<any>;

  constructor(public http: Http, private sqlitePorter: SQLitePorter, private storage: Storage, private sqlite: SQLite, private platform: Platform) {
    this.databaseReady = new BehaviorSubject(false);
    this.badgeDirectory = this.getBadgeDirectory();
    this.databaseConfig = this.getDatabaseConfig();
    this.jsonUrls = this.getJsonUrls();
    this.tables = this.getTables();

    this.platform.ready().then(() => {
      this.sqlite.create(this.databaseConfig).then((db: SQLiteObject) => {
        this.database = db;
        this.hasToUpdate().then(yes => {
          if (yes) {
            this.updateDatabase().then(res => {
              this.databaseReady.next(true);
            }).catch(err => console.log(err));
          } else {
            this.databaseReady.next(true);
          }
        }).catch(err => {
          console.log(err)
          //CHECK DATABASE HEAR
          this.databaseReady.next(true);
        });

      }).catch(err => console.log(err));
    }).catch(err => console.log(err));
  }

  private getDatabaseConfig(): Object {
    return {
      name: 'fdp.db',
      location: 'default'
    };
  }

  private getBadgeDirectory(): String {
    return "../../badges";
  }

  private getTables(): Array<any> {
    return [
      "config",
      "artilheiros",
      "cartoes_amarelos",
      "cartoes_vermelhos",
      "jogos",
      "tabela",
      "suspensos",
      "classificacao_4as_finais",
      "classificacao_geral"
    ];
  }

  private getJsonUrls(): Object {
    return {
      'config': 'http://www.futeboldospais.com.br/config/config.txt',
      'artilheiros': 'http://www.futeboldospais.com.br/campeonato2018/json/artilheiros.txt',
      'cartoes_amarelos': 'http://www.futeboldospais.com.br/campeonato2018/json/cartoes-amarelos.txt',
      'cartoes_vermelhos': 'http://www.futeboldospais.com.br/campeonato2018/json/cartoes-vermelhos.txt',
      'jogos': 'http://www.futeboldospais.com.br/campeonato2018/json/jogos.txt',
      'tabela': 'http://www.futeboldospais.com.br/campeonato2018/json/tabela.txt',
      'suspensos': 'http://www.futeboldospais.com.br/campeonato2018/json/suspensos.txt',
      'classificacao_4as_finais': 'http://www.futeboldospais.com.br/campeonato2018/json/classificacao-4as-finais.txt',
      'classificacao_geral': 'http://www.futeboldospais.com.br/campeonato2018/json/classificacao-geral.txt',
      'distintivos': 'http://www.futeboldospais.com.br/campeonato2018/distintivos/' //NOME DO TIME
    }
  }

  public getDatabaseState(): any {
    return this.databaseReady.asObservable();
  }

  private ajaxGet(url:string): any {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (!xhr) resolve(null);
      xhr.open("GET", url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          resolve(xhr.responseText);
        }
      }
      xhr.send(null);
    })
  }
  private createDatabase(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get('assets/db.sql').map(res => res.text()).subscribe(sql => {
        this.sqlitePorter.importSqlToDb(this.database, sql).then(res => {
          this.databaseReady.next(true);
          resolve(true);
        }).catch(err => reject(err))
      })
    })
  }

  private getDataConfig(): any {
    return this.database.executeSql("SELECT * FROM config", []).then(res => {
      const config = {
        year: null,
        version: null
      };
      if (res.rows.length > 0) {
        config.year = res.rows.item(0).campeonatoAno;
        config.version = res.rows.item(0).versaoAtualizacao;
        return config;
      } else {
        return null;
      }
    }, err => {
      console.log(err);
      return null;
    })
  }

  private hasToUpdate(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ajaxGet(this.jsonUrls.config).then(json => {
        let jsonToObject = <any>{};
        jsonToObject = json;
        const siteConfig = JSON.parse(jsonToObject);
        this.getDataConfig().then(dbConfig => {
          if (!dbConfig) resolve(true);
          if (siteConfig.campeonatoAno != dbConfig.year) resolve(true);
          if (siteConfig.versaoAtualizacao != dbConfig.version) resolve(true);
          resolve(false);
        }).catch(err => reject(err));
      }).catch(err => reject(err));;
    });
  }

  private clearDatabase(): Promise<any> {
    return new Promise((resolve, reject) => {
      const drops = [];
      this.tables.map(table => {
        drops.push(this.database.executeSql(`DROP TABLE IF EXISTS ${table}`, []))
      })
      Promise.all(drops).then(res => resolve(res)).catch(err => err);
    })
  }

  private updateDatabase(): Promise<any> {
    return new Promise((resolve, reject) => {
      const gets = this.tables.map(name => this.ajaxGet(this.jsonUrls[name]));
      Promise.all(gets).then(gets => {
        const inserts = []
        // const creates = [];
        gets.map((json, index) => {
          const operations = this.formatJsonAndDbOperations(json, this.tables[index]);
          // creates.push(operations.create);
          inserts.push(operations.insert);
        })
        // Promise.all(creates).then(createRes => {
          this.createDatabase().then(res => {
            Promise.all(inserts).then(insertRes => resolve(insertRes))
              .catch(err => {
                reject(err);
              });
          }).catch(err => {
            reject(err);
          })
        // }).catch(err => {
        //   reject(err);
        // })
      }).catch(err => {
        reject(err);
      });
    });
  }

  private formatJsonAndDbOperations(json, table): any {
    let jsonToObject = <any>{};
    jsonToObject = json;
    const formatedJson = JSON.parse(jsonToObject);
    const operations = {
      create: null,
      insert: null
    }
    if (formatedJson.length > 0) {
      //REGRA ESPECIFICA DA classificacao-4as-finais.txt
      if (formatedJson[0].listaClassificacao) {
        const listaClassificacao = formatedJson[0].listaClassificacao[0];
        const fields = Object.keys(listaClassificacao);
        fields.push("categoria", "grupo");
        // operations.create = this.createTable(table, fields);
        formatedJson.map(o => {
          o.listaClassificacao.map(d => {
            const data = Object.keys(listaClassificacao).map(key => d[key]);
            data.push(o.categoria, o.grupo);
            operations.insert = this.insert(table, fields, data);
          })
        })
      } else {
        const fields = Object.keys(formatedJson[0]);
        // operations.create = this.createTable(table, fields);
        formatedJson.map(o => {
          const data = fields.map(key => o[key]);
          operations.insert = this.insert(table, fields, data);
        })
      }
    } else {
      const fields = Object.keys(formatedJson);
      const data = fields.map(key => formatedJson[key]);
      operations.insert = this.insert(table, fields, data);
      // operations.create = this.createTable(table, fields);
    }
    return operations;
  }

  // private createTable(name: String, fields: Array<String>): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     const formatFields = fields.map(field => field + " TEXT")
  //     const query = `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT, campos TEXT, ${formatFields.join(",")})`;
  //     resolve(query);
  //     // VERSÃO ANTIGA, NÃO FUNCIONA, TMB NÃO SEI PQ
  //     // console.log(name)
  //     // console.log(fields)
  //     // console.log(query)
  //     // this.database.executeSql(query, {}).then(res => resolve(res))
  //     // .catch(err => {
  //     //   reject(err)
  //     // })
  //   })
  // }
  private insert(table: String, fields: Array<String>, data: Array<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const values = fields.map(o => "?");
      const stringFields = fields.join(",");
      data.push(stringFields);
      const query = `INSERT INTO ${table} (${stringFields}, campos) VALUES (${values.join(",")}, ?)`;
      this.database.executeSql(query, data)
        .then(res => resolve(res))
        .catch(err => {
          reject(err)
        })
    })
  }

  public getAll(table:String): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${table}`
      this.database.executeSql(query, [])
        .then(res => {
          if (res.rows.length > 0) {
            const result = [];
            const fields = (res.rows.item(0).campos).split(",");
            fields.push("id");
            for (let i = 0; i < res.rows.length; i++) {
              const row = <any>{};
              fields.map(field => {
                row[field] = res.rows.item(i)[field];
              })
              result.push(row);
            }
            resolve(result);
          }
          resolve(null);
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  public getById(table:String, id:number): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${table} WHERE id = ?`
      this.database.executeSql(query, [id])
        .then(res => {
          if (res.rows.length > 0) {
            const result = [];
            const fields = (res.rows.item(0).campos).split(",");
            fields.push("id");
            const row = <any>{};
            fields.map(field => {
              row[field] = res.rows.item(0)[field];
            })
            resolve(row);
          }
          resolve(null);
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  //SO FUNCIONA COM SELECTS
  public getCustomize(query:string, params:Array<any>, colums:Array<String> = null): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {
      this.database.executeSql(query, params)
        .then(res => {
          if (res.rows.length > 0) {
            const result = [];
            const fields = colums ? colums : (res.rows.item(0).campos).split(",");
            for (let i = 0; i < res.rows.length; i++) {
              const row = <any>{};
              fields.map(field => {
                row[field] = res.rows.item(i)[field];
              })
              result.push(row);
            }
            resolve(result);
          }
          resolve(null);
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  public getBadge(team:String): String {
    return this.jsonUrls.distintivos + team + ".png";
  }

  //EM PROGRESSO, POR HORA USAR   url de distintivo/nome do time nos <img src=""> da vida
  // private saveBadges(): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     ajaxGet()
  //     const options = {
  //       url: this.jsonUrls.distintivos + team,
  //       dest: this.badgeDirectory
  //     };
  //     download.image(options).then(({ filename, image }) => {
  //       resolve(filename);
  //     }).catch(err => reject(err))
  //
  //   });
  // }
}
