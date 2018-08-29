#!/bin/bash
cd firebase/functions
echo $PWD
npm i && \
nodemon --exec "npm run serve:ci"
