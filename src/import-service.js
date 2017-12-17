
'use strict';

const fs = require('fs');
const jsonStream = require('JSONStream');
const cassandra = require('cassandra-driver');
const color = require('chalk');

const util = require('./util');
let config = require('./config');

let authProvider;

if (config.user && config.password) {
    authProvider = new cassandra.auth.PlainTextAuthProvider(config.user, config.password);
}

let client = new cassandra.Client({
  contactPoints: [config.host],
  keyspace: config.keyspace,
  authProvider: authProvider,
  protocolOptions: {port: [config.port]}
});


function buildQuery (tableInfo, keys) {
  let values = ',?'.repeat(keys.length-1);
  return 'INSERT INTO "' + tableInfo.name + '" ("' + keys.join('","') + '") VALUES (?' + values + ')';
}

function bufferFrom(value) {
  if (value.type === 'Buffer') {
      return Buffer.from(value);
  }
  else {
      return values.forEach(columns => {
        console.log(`columns[key].type ${color.yellow(columns[key].type)}`);
        if (util.isPlainObject(column[key]) && columns[key].type === 'Buffer') {
            columns[key] = Buffer.from(columns[key]);
        }
      });
  }
}

function buildTableQueryForDataRow(tableInfo, row) {
    var queries = [];

    row = Object.entries(row).filter(column => column !== null);
    let keys = row.map(entry => entry[0]);
    let values = row.map(entry => entry[1]);
    let query = buildQuery(tableInfo, keys);
    let params = values.map(value => {
      if (util.isPlainObject(value)) {
          return bufferFrom(value);
      }
      return value;
    });

    return {
        query: query,
        params: params,
    };
}

let importSingleTable = function (table, tableInfo) {
      return new Promise(function(resolve, reject) {
          console.log(`importSingleTable ${color.yellow(table)}`);

          var processed = 0;
          var startTime = Date.now();
          let maxSize = util.getMaxSize(table);

          let jsonfile = fs.createReadStream(config.dataDir + '/' + table + '.json', {encoding: 'utf8'})
          .on('error', function (err) {
              reject(err);
          })
          .on('end', function () {
            util.metrics(table, startTime, processed);
            resolve();
          });

          let readStream = jsonfile.pipe(jsonStream.parse('*'));

          readStream.on('data', function(row) {
              var query = buildTableQueryForDataRow(tableInfo, row);
              if (processed < maxSize) {
                client.execute(query.query, query.params, { prepare: true});
                if (processed%100 == 0) {
                  util.metrics(table, startTime, processed);
                }
                processed++;
              } else {
                jsonfile.pause();
                util.metrics(table, startTime, processed);
                resolve();
                throw `${color.red("MaxSize reached! please set a higher maxSize in ")} ${color.yellow("config.json")}`;
              }
          });

      });
}

let gracefulShutdown = function() {
  client.shutdown()
      .then(function (){
          process.exit();
      })
      .catch(function (err){
          console.log(`error : ${color.red(err)}`);
          process.exit(1);
      });
}

module.exports.importSingleTable = importSingleTable;
module.exports.gracefulShutdown = gracefulShutdown;
