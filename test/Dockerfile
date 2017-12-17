FROM cassandra:latest

RUN mkdir -p /cassandra-export-js/cql

# Copy SQL files
COPY ./cql/schema.cql /cassandra-export-js/cql/schema.cql

RUN mkdir -p /home/cassandra && chown cassandra:cassandra /home/cassandra

USER cassandra

# Apply SQL on database
RUN cassandra && sleep 15 \
  && cqlsh -e "CREATE KEYSPACE docker WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };" \
  && cqlsh -f /cassandra-export-js/cql/schema.cql \
  && nodetool flush \
  && nodetool drain

EXPOSE 9042 9160

CMD [ "cassandra", "-f" ]
