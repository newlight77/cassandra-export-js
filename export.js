const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const color = require('chalk');

const cassandraService = require('./src/cassandra-service');
const exportService = require('./src/export-service');
const util = require('./src/util');
let config = require('./src/config');

function messageHandler(table) {
  exportService.exportSingleTable(table)
  .then(function resolve() {
    console.log(`Success exporting table : ${color.yellow(table)}`);
    process.send('done');
  }, function error() {
    console.log(`${color.yellow('Error exporting table : ')}${color.yellow(table)}`);
  });
}

if (cluster.isMaster) {
  console.log(`Master ${color.blue(process.pid)} is running`);

  setInterval(() => {
    let nbAlives = util.alives(cluster);
    console.log(`nbAlives : ${color.blue(nbAlives)}`);
    if (nbAlives == 0) {
      process.exit();
    }
  }, 3000);

  cassandraService.listTables()
  .then(function (tables){
      tables.forEach( table => {
        if (util.shouldProcessTable(table)) {
          cluster.fork().send(table);
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
    exportService.gracefulShutdown();
    cassandraService.gracefulShutdown();
    console.log('Closing connection of systemClient');
    console.log(`worker ${worker.process.pid} died`);
  });

} else {
  console.log(`Worker ${process.pid} started`);

  process.on('message', (table) => {
    console.log(`Worker ${color.blue(process.pid)} received table : ${color.yellow(table)}`);
    messageHandler(table);
  });

  process.on("disconnect", function() {
    console.log("worker shutdown");
  });
}
