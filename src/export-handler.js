
const color = require('chalk');
const exportService = require('./export-service');

function handle(table) {
  console.log(`handling table : ${color.blue(table)}`);
  exportService.exportSingleTable(table)
  .then(function resolve() {
    console.log(`Success exporting table : ${color.yellow(table)}`);
    process.send('done');
  }, function error() {
    console.log(`${color.yellow('Error exporting table : ')}${color.yellow(table)}`);
    process.send('done');
  });
}

module.exports.handle = handle;
