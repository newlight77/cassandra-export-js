# db-exportjs
Data export from cassandra to json files and import from json files to cassandra.


## Usage

First :
```
npm install
```

### Configuration

There is a config.json where you can specify tables to export or import, with maxSize and exclusion.

Sample:
```
{
  "host" : "localhost",
  "port" : 9042,
  "keyspace" : "docker",
  "user" : "",
  "password" : "",
  "tables" : [
    {
      "name" : "temp",
      "maxSize" : "1000"
    },
    {
      "name" : "lock"
    },
    {
      "name" : "cron",
      "maxSize" : "1000",
      "exclude" : true
    }
  ],
  "dataDir" : "./data"
}
```

* tables: _if empty, all tables of keyspace is processed_
* exclude: _table excluded if true_
* maxSize: _set a limit number of rows to process_
* dataDir: _write josn files to or read from_

To override some parameters at command line :

```
export HOST=localhost
export PORT=19042
export KEYSPACE=docker
```

**Note that a worker (thread) is forked per table to process the import/export.**

### Export tables data

Run the following command to export data using the config.json.
```
node export.js
```
This will dump data into the filesystem at dataDir, by default ./data :

```
ls ./data
temp.json	lock.json
```

### Import tables data

Run the following command to import data using the config.json.
```
node import.js
```

This will import from json files under dataDir;

## Licence

[Apache License 2.0](https://github.com/newlight77/cassandra-export-js/blob/master/LICENSE)
