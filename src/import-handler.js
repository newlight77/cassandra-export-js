
const color = require('chalk');
const importService = require('./import-service');

function handle(table, tableInfo) {
  console.log(`handling table : ${color.blue(table)}`);
  importService.importSingleTable(table, tableInfo)
  .then(function resolve() {
    console.log(`Success importing table : ${color.yellow(table)}`);
    process.send('done');
  }, function error() {
    console.log(`${color.yellow('Error importing table : ')}${color.yellow(table)}`);
    process.send('done');
  });
}

module.exports.handle = handle;
