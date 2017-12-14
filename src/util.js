'use strict';

const color = require('chalk');

let config = require('./config');

function isPlainObject(o) {
  return !!o
  	&& typeof o === 'object'
  	&& Object.prototype.toString.call(o) === '[object Object]';
}

function getMaxSize (table) {
  let max = Number.MAX_VALUE;
  let tables = Object.values(config.tables)
  .filter(entry => entry.name == table);
  if (tables.length > 0) {
    max = tables.pop().maxSize;
    if (!max) {
      max = Number.MAX_VALUE;
    }
  }
  return max;
}

function metrics(table, startTime, processed) {
  var elapsedTime = (Date.now() - startTime) / 1000;
  var rate = elapsedTime ? processed / elapsedTime : 0.00;
  console.log(`imported into table : ${color.blue(table)} , processed : ${color.blue(processed)} , timeElapsed : ${color.blue(elapsedTime.toFixed(2))} sec , rate : ${color.blue(rate.toFixed(2))} rows/s`);
}

function alives (cluster) {
  let count = 0;
  for (const id in cluster.workers) {
    if (!cluster.workers[id].isDead()) {
      console.log('woprker is alive', id);
      count++;
    }
  }
  return count;
}

function shouldProcessTable (table) {
  if (!config.tables || config.tables == 0) {
    return true;
  }
  let tables = Object.values(config.tables)
  .filter(entry => (!entry.exclude == true) && entry.name == table);
  return tables.length > 0;
}

module.exports.isPlainObject = isPlainObject;
module.exports.getMaxSize = getMaxSize;
module.exports.metrics = metrics;
module.exports.alives = alives;
module.exports.shouldProcessTable = shouldProcessTable;
