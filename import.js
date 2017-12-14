const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

const cassandraService = require('./src/cassandra-service');
const importService = require('./src/import-service');
const util = require('./src/util');
let config = require('./src/config');


function messageHandler(table, tableInfo) {
  importService.importSingleTable(table, tableInfo)
  .then(function resolve() {
    console.log('success importing table :', table);
    process.send('done');
  }, function error() {
    console.log('Error importing table :', table);
  });
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  setInterval(() => {
    let nbAlives = util.alives(cluster);
    console.log('nbAlives=', nbAlives);
    if (nbAlives == 0) {
      process.exit();
    }
  }, 3000);

  cassandraService.listTables()
  .then(function (tables) {
      tables.forEach( table => {
        if (util.shouldProcessTable(table)) {
          cassandraService.getTableInfo(table)
          .then( tableInfo => {
            if (tableInfo) {
                cluster.fork().send({table: table, tableInfo:tableInfo});
            }
          });
        }
      });
  });

  cluster.on('fork', () => {
    console.log('a worker has been forked');
  });

  cluster.on('setup', () => {
    console.log('cluster is setting up');
  });

  cluster.on('message', (worker, message, handle) => {
    console.log(`message: worker=${worker.process.pid} message=${message} handle=${handle} args=${arguments.length}`);
    if (message === 'done') {
      console.log('received done message');
      worker.disconnect();
    }
  });

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('death', function(worker) {
    console.log(`worker ${worker.process.pid} died`);
  });

  cluster.on('exit', (worker, code, signal) => {
    importService.gracefulShutdown();
    cassandraService.gracefulShutdown();
    console.log('Closing connection of systemClient');
    console.log(`worker ${worker.process.pid} died`);
  });

} else {
  console.log(`Worker ${process.pid} started`);
  process.on('message', (message) => {
    console.log(`Worker ${process.pid} received table :`, message.table);
    messageHandler(message.table, message.tableInfo);
  });

  process.on("disconnect", function() {
    console.log("worker shutdown");
  });
}
