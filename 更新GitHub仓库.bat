@echo off
chcp 65001 >nul
title 局部解剖学系统 - 更新 GitHub 仓库
cd /d "%~dp0"
python scripts\update_github.py
