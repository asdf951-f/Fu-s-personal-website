#!/bin/bash
# 一键部署脚本：把当前目录的所有文件推送到 GitHub
# 使用方法：1. 解压 fuwanru-website-deploy.zip  2. 进入解压目录  3. 运行 bash deploy.sh

echo "=== 初始化 git 仓库 ==="
rm -rf .git
git init
git config user.email "asdf951-f@github.com"
git config user.name "asdf951-f"

echo "=== 暂存所有文件 ==="
git add .
git commit -m "v47: clean deploy with all fixes"

echo "=== 绑定远程仓库 ==="
git remote add origin https://github.com/asdf951-fu-s-personal-website.git

echo "=== 强制推送 (覆盖旧文件) ==="
git push -f origin main

echo "=== 完成！==="
echo "访问 https://asdf951-f.github.io/Fu-s-personal-website/ 查看网站"
