
'use strict';

const cassandra = require('cassandra-driver');

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

let systemClient = new cassandra.Client({
    contactPoints: [config.host],
    authProvider: authProvider,
    protocolOptions: {port: [config.port]}
});

let listTables = function () {
  return systemClient.connect()
      .then(function (){
          let systemQuery = "SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?";
          console.log('Finding tables in keyspace: ' + config.keyspace);
          return systemClient.execute(systemQuery, [config.keyspace]);
      })
      .then(function (result){
          console.log('Completed exporting all tables from keyspace: ' + config.keyspace);
          return new Promise(resolve => {
              let tables = [];
              for(let i = 0; i < result.rows.length; i++) {
                  tables.push(result.rows[i].table_name);
              }
              console.log('resolve tables : ', tables.join(', '));
              console.log('Retrieved tables from keyspace : ' + config.keyspace);
              resolve(tables);
          });
      })
      .catch(function (err){
          console.log(err);
      });
};

let getTableInfo = function (table) {
  console.log("getTableInfo : ", table);
  return systemClient.metadata.getTable(config.keyspace, table);
};

let gracefulShutdown = function() {
  systemClient.shutdown()
      .then(function (){
          process.exit();
      })
      .catch(function (err){
          console.log(err);
          process.exit(1);
      });

  client.shutdown()
      .then(function (){
          process.exit();
      })
      .catch(function (err){
          console.log(`error : ${color.red(err)}`);
          process.exit(1);
      });
};

module.exports.listTables = listTables;
module.exports.getTableInfo = getTableInfo;
module.exports.gracefulShutdown = gracefulShutdown;
module.exports.client = client;;
module.exports.systemClient = systemClient;
