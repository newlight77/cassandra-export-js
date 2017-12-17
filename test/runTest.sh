#!/usr/bin/env bash


#############################################
## Global variables
#############################################
red=`tput setaf 1` # error
green=`tput setaf 2` # nice
yellow=`tput setaf 3` # warning
teal=`tput setaf 4` # info
purple=`tput setaf 5` # command
teal=`tput setaf 6` # detail
white=`tput setaf 7` #
reset=`tput sgr0`

BASE_DIR="$(cd $(dirname $0)/.. && pwd -P)"


KEYSPACE=docker_src
IMPORT=
EXPORT=
NO_DESTROY=

START_TIME=$(date +%s);

#############################################
## Functions
#############################################

usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "${teal}Options:    ${reset}"
  echo "${teal}          -i, --import               test import${reset}"
  echo "${teal}          -e, --export               test export${reset}"
  echo "${teal}          -k, --keyspace =KEYSPACE   by default docker ${reset}"
  echo "${teal}          -n, --no-destroy           do not destroy containers ${reset}"
  echo "${teal}          -h,  --help                help ${reset}"
  echo "${teal}                                          ${reset}"
  echo "${teal}By default, this will clean stop all containers and destroy them, remove all untagged and stagging images and all stagging volumes ${reset}"
  exit 1
}

duration() {
  start=$1
  end=$(date +%s)
  toDuration $(($end-$start))
}

toDuration() {
  seconds=$1
  end=$(date +%s)

  if [ $(uname) == "Darwin" ] ; then
    echo $(date -r $(($seconds)) +"%M minutes %S seconds")
  else
    echo $(date -d @$(($seconds)) +"%M minutes %S seconds")
  fi
}

pidProgress() {
  pid=$1
  message=$2
  count=0
  printf "${teal}   $message.... $count seconds"
  while kill -0 $pid 2> /dev/null
  do
      printf "${teal} \r  $message.... $(toDuration $count)"
      sleep 1
      ((count+=1))
  done
  echo ${teal} "done"
}

progressBar() {
  local duration=${1}
  already_done() { for ((done=0; done<$elapsed; done++)); do printf "▇"; done }
  remaining() { for ((remain=$elapsed; remain<$duration; remain++)); do printf " "; done }
  percentage() { printf "| %s%% %s seconds" $(( (($elapsed)*100)/($duration)*100/100 )) $(( $elapsed )); }
  clean_line() { printf "\r"; }

  for (( elapsed=1; elapsed<=$duration; elapsed++ )); do
      already_done; remaining; percentage
      sleep 1
      clean_line
  done
  printf "\n";
}

waitForCassandra() {
  local container=$1
  local count=0
  local max=100
  local elapsed=1

  already_done() { for ((done=0; done<$elapsed; done++)); do printf "${purple}▇"; done }
  remaining() { for ((remain=$elapsed; remain<$max; remain++)); do printf " "; done }
  percentage() { printf "${reset}| %s%% %s seconds" $(( (($elapsed)*100)/($max)*100/100 )) $(( $elapsed )); }
  clean_line() { printf "\r"; }

  for (( elapsed=1; elapsed<=$max; elapsed++ )); do
      ${SUDO} docker exec ${container} cqlsh -e "SELECT * from system_schema.keyspaces ;" &>/dev/null
      if [ $? -ne 0 ]; then
        already_done; remaining; percentage
      else
        printf "\n";
        break;
      fi
      sleep 1
      clean_line
  done

  echo ${teal} "Cassandra fo container ${container} is ready!"
}

prepareCassandra() {
  cd ${BASE_DIR}/test

  echo "${teal} Tearing down all containers  ${reset}"
  if [ "$NO_DESTROY" != "true" ]; then
    docker-compose down
  fi
  echo "${teal} Launching all containers  ${reset}"
  if [ "$EXPORT" == "true" ]; then
    docker-compose up -d cassandra_src
    waitForCassandra test_cassandra_src_1

    echo "${teal} Creating database keyspace and tables in container test_cassandra_src_1 ${reset}"
    docker exec -it test_cassandra_src_1 cp /cassandra-export-js/cql/schema.cql /tmp/schema.cql
    docker exec -it test_cassandra_src_1 sed -i 's/docker/docker_src/g' /tmp/schema.cql
    docker exec -it test_cassandra_src_1 cqlsh -f /tmp/schema.cql
  fi
  if [ "$IMPORT" == "true" ]; then
    docker-compose up -d cassandra_dest
    waitForCassandra test_cassandra_dest_1

    echo "${teal} Creating database keyspace and tables in container test_cassandra_dest_1 ${reset}"
    docker exec -it test_cassandra_dest_1 cp /cassandra-export-js/cql/schema.cql /tmp/schema.cql
    docker exec -it test_cassandra_dest_1 sed -i 's/docker/docker_dest/g' /tmp/schema.cql
    docker exec -it test_cassandra_dest_1 cqlsh -f /tmp/schema.cql
  fi
}

before() {
  echo "${teal} Running npm install ${reset}"
  cd ${BASE_DIR}
  npm install
  prepareCassandra
}

after() {
  if [ "$NO_DESTROY" != "true" ]; then
    echo "${teal} Tearing down all containers  ${reset}"
    cd ${BASE_DIR}/test
    docker-compose down
  fi
}

#############################################
## Check arguments
#############################################
for i in "$@"
  do
    case $i in
      -i|--import)                 IMPORT="true"       ;;
      -e|--export)                 EXPORT="true"       ;;
      -k=*|--keyspace=*)           KEYSPACE="${i#*=}"  ;;
      -n|--no-destroy)             NO_DESTROY="true"   ;;
      -h|--help)                   usage               ;;
      *)                           usage               ;;
    esac
done


#############################################
## Run
#############################################

before


if [ "$EXPORT" == "true" ]; then
  echo "${teal} Running export test ${reset}"
  cd ${BASE_DIR}
  export PORT=9042
  export KEYSPACE=docker_src
  node export.js
  if [ $? -ne 0 ]; then
    echo ${red} "Export : failed!"
  fi
  echo ${green} "Export : it tooks $(duration $START_TIME)"
fi

if [ "$IMPORT" == "true" ]; then
  echo "${teal} Running import test ${reset}"
  cd ${BASE_DIR}
  export PORT=19042
  export KEYSPACE=docker_dest
  node import.js
  if [ $? -ne 0 ]; then
    echo ${red} "Import : failed!"
  fi
  echo ${green} "Import : it tooks $(duration $START_TIME)"
fi

after

echo ${green} "Overall : it tooks $(duration $START_TIME)"
