#!/bin/bash
cd firebase/functions
echo $PWD
npm i && \
npm run serve:ci
