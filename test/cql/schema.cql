
CREATE KEYSPACE docker WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };

use docker;

CREATE TABLE table1 (
    id uuid PRIMARY KEY,
    data text,
    last_update timestamp
);

CREATE TABLE table2 (
    id uuid PRIMARY KEY,
    data text,
    last_update timestamp
);

CREATE TABLE table3 (
    id uuid PRIMARY KEY,
    data text,
    last_update timestamp
);


INSERT INTO table1 (id, data, last_update) VALUES(e7d877d6-04e0-4158-b4fb-000000000000, 'data1', '2017-12-16 10:21:49');
INSERT INTO table1 (id, data, last_update) VALUES(e7d877d6-04e0-4158-b4fb-111111111111, 'data2', '2017-12-16 10:21:49');

INSERT INTO table2 (id, data, last_update) VALUES(e7d877d6-04e0-4158-b4fb-000000000000, 'data1', '2017-12-16 10:21:49');
INSERT INTO table2 (id, data, last_update) VALUES(e7d877d6-04e0-4158-b4fb-111111111111, 'data2', '2017-12-16 10:21:49');

INSERT INTO table3 (id, data, last_update) VALUES(e7d877d6-04e0-4158-b4fb-000000000000, 'data1', '2017-12-16 10:21:49');
INSERT INTO table3 (id, data, last_update) VALUES(e7d877d6-04e0-4158-b4fb-111111111111, 'data2', '2017-12-16 10:21:49');
