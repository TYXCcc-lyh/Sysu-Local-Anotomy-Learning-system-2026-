@echo off
chcp 65001 >nul
title 局部解剖学移动端局域网同步服务
cd /d "%~dp0"
echo 正在启动局域网同步服务...
python scripts\serve_mobile.py
pause
