# -*- coding: utf-8 -*-
"""
同步系统资源至 Android WebView assets 目录
"""
import os
import shutil

def sync_assets():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(root_dir, "android", "app", "src", "main", "assets")
    
    if os.path.exists(assets_dir):
        shutil.rmtree(assets_dir)
    os.makedirs(assets_dir, exist_ok=True)

    # Folders to copy
    for folder in ["css", "js", "data", "icons"]:
        src = os.path.join(root_dir, folder)
        dst = os.path.join(assets_dir, folder)
        if os.path.exists(src):
            shutil.copytree(src, dst)

    # Files to copy
    for file in ["index.html", "manifest.json", "sw.js"]:
        src = os.path.join(root_dir, file)
        dst = os.path.join(assets_dir, file)
        if os.path.exists(src):
            shutil.copy2(src, dst)

    print(f"✅ 资源已成功完整同步至 Android Assets 目录: {assets_dir}")

if __name__ == "__main__":
    sync_assets()
