
'use strict';

const fs = require('fs');
const jsonStream = require('JSONStream');
const cassandra = require('cassandra-driver');
const color = require('chalk');

let config = require('./config.js');
let util = require('./util');

let authProvider;

if (config.user && config.password) {
    authProvider = new cassandra.auth.PlainTextAuthProvider(config.user, config.password);
}

if (!fs.existsSync(config.dataDir)){
    fs.mkdirSync(config.dataDir);
}

let client = new cassandra.Client({
  contactPoints: [config.host],
  keyspace: config.keyspace,
  authProvider: authProvider,
  protocolOptions: {port: [config.port]}
});

function createJsonFile (table) {
  let jsonFile = fs.createWriteStream(config.dataDir + '/' + table + '.json');
  jsonFile.on('error', function (err) {
      console.log('err ' + err);
      reject(err);
  });
  return jsonFile;
}

let exportSingleTable = function (table) {
      return new Promise(function(resolve, reject) {
          console.log('exportSingleTable : ', table);

          let processed = 0;
          let startTime = Date.now();
          let maxSize = util.getMaxSize(table);

          let writeStream = jsonStream.stringify('[', ',', ']');
          writeStream.pipe(createJsonFile(table));

          client.stream('SELECT * FROM "' + table + '"', [], { prepare : true , fetchSize : 1000 })
          .on('readable', function () {
            let row;
            let self = this;
            while (row = this.read()) {
              if (processed < maxSize) {
                let rowObject = {};
                row.forEach(function(value, key){
                    rowObject[key] = value;
                });
                writeStream.write(rowObject);
                if (processed%100 == 0) {
                  util.metrics(table, startTime, processed);
                }
                processed++;
              } else {
                util.metrics(table, startTime, processed);
                throw `${color.red("reached max")}`;
              }
            }
          })
          .on('end', function () {
            console.log('Ending writes to : ' + table + '.json');
            util.metrics(table, startTime, processed);
            writeStream.end();
            resolve();
          })
          .on('error', function (err) {
            reject(err);
          });
      });
}

const gracefulShutdown = function() {
  client.shutdown()
      .then(function (){
          process.exit();
      })
      .catch(function (err){
          console.log(err);
          process.exit(1);
      });
}

module.exports.exportSingleTable = exportSingleTable;
module.exports.gracefulShutdown = gracefulShutdown;
