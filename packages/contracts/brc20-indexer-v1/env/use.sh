#!/usr/bin/env bash
set -eo pipefail

BASE="$( cd "$( dirname "$0" )" >/dev/null 2>&1 && pwd )"
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd )"

pushd "$BASE"/../

main() {
    local ENV="$1"

    if [ "$ENV" = "base" -o ! -d "$ROOT/env/$ENV" ]; then
      echo unkown env "$ENV"
      exit 1
    fi

    echo preparing env $ENV
    export ENV
    processEnvFolder "$ROOT/env/base"
    processEnvFolder "$ROOT/env/$ENV"
    echo "$ENV" > "$BASE"/.current_project
    echo switched to env $ENV
}

processEnvFolder() {
    if [ -d "$1" ]
    then
      pushd "$1"
      FILES=$(find . -type f)
      popd
      for f in $FILES
      do
        writeTemplateFile "$1" "$f"
      done
    fi
}

writeTemplateFile() {
  SOURCE_PATH=$1
  FILE_PATH=$2
  FILE_DIR=$(dirname "${FILE_PATH}")
  mkdir -p "$FILE_DIR"
  rm -f "$ROOT"/"$FILE_PATH"
  "$BASE"/mo "$SOURCE_PATH"/"$FILE_PATH" > "$ROOT"/"$FILE_PATH"
  chmod 400 "$ROOT"/"$FILE_PATH"
}

if [ -n "${1-}" ]
then
  main "$1"
else
  printf './use.sh ENV \nexample: ./use.sh dev'
fi
