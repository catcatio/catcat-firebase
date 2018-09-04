#!/bin/bash
ssh root@catcat.io "cd ~/catcat-firebase/ && docker-compose down && docker-compose up --build -d"