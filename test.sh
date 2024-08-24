#!/usr/bin/bash

busted -m './dist/?.lua;./node_modules/?.lua' -p .test dist
