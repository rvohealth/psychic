#!/bin/sh

set -e

if [[ `git status --porcelain` ]]; then
	printf 'These files changed when running the command:\n\n'
  echo $(git status --porcelain)
	exit 1
fi
