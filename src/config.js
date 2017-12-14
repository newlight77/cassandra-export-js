'use strict';

let config = require('../config.json');

if (process.env.KEYSPACE) {
  config.keyspace = process.env.KEYSPACE;
}
if (process.env.HOST) {
  config.host = process.env.HOST;
}

if (process.env.PORT) {
  config.host = process.env.PORT;
}

if (process.env.USER) {
  config.user = process.env.USER;
}

if (process.env.PASSWORD) {
  config.password = process.env.PASSWORD;
}

if (process.env.TABLES) {
  config.tables = process.env.TABLES;
}

if (process.env.DATA_DIR) {
  config.dataDir = process.env.DATA_DIR;
}

module.exports = config;
