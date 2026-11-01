@echo off
chcp 65001 >nul
title 局部解剖学 - 移动端与 APK 打包助手
cd /d "%~dp0"
python scripts\apk_helper_gui.py
