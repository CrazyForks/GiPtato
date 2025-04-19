#!/bin/bash

# 加载根目录的环境变量（如果存在）
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

# 根据环境变量选择启动模式
if [ "$NODE_ENV" = "production" ]; then
  echo "以生产模式启动服务器..."
  npm run start
elif [ "$STABLE_MODE" = "true" ]; then
  echo "以稳定开发模式启动服务器..."
  npm run dev:stable
else
  echo "以开发模式启动服务器..."
  npm run dev
fi 