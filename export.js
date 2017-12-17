const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const color = require('chalk');

const cassandraService = require('./src/cassandra-service');
const exportHandler = require('./src/export-handler');
const util = require('./src/util');

if (cluster.isMaster) {
  console.log(`Master ${color.blue(process.pid)} is running`);

  cassandraService.listTables()
  .then(function (tables){
      tables.forEach( table => {
        if (util.shouldProcessTable(table)) {
          cluster.fork().send(table);
        }
      });
  });

  cluster.on('message', (worker, message, handle) => {
    console.log(`message: worker=${worker.process.pid} message=${message} handle=${handle} args=${arguments.length}`);
    if (message === 'done') {
      console.log('received done message');
      worker.disconnect();

      let nbAlives = util.alives(cluster);
      console.log(`nbAlives : ${color.blue(nbAlives)}`);
      if (nbAlives == 0) {
        process.exit();
      }
    }
  });

  cluster.on('exit', (worker, code, signal) => {
    cassandraService.gracefulShutdown();
    console.log('Closing connection of systemClient');
    console.log(`worker ${worker.process.pid} died`);
  });

} else {
  console.log(`Worker ${process.pid} started`);

  process.on('message', (table) => {
    console.log(`Worker ${color.blue(process.pid)} received table : ${color.yellow(table)}`);
    exportHandler.handle(table);
  });
}
