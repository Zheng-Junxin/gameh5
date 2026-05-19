#!/bin/bash
set -e

# ============================================
#  H5 游戏大厅 一键部署脚本
#  用法: sudo bash deploy.sh
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/home/ubuntu/gameh5"
APP_PORT=80

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   H5 游戏大厅 - 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. Check Node.js
echo -e "${YELLOW}[1/5] 检查 Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo "请先安装 Node.js 20+："
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi
echo "  Node.js $(node -v) ✓"

# 2. Install PM2
echo -e "${YELLOW}[2/5] 安装 PM2 进程管理器...${NC}"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
echo "  PM2 $(pm2 -v) ✓"

# 3. Install dependencies
echo -e "${YELLOW}[3/5] 安装项目依赖...${NC}"
cd "$APP_DIR"
npm install --production
echo "  依赖安装完成 ✓"

# 4. Create log dir
mkdir -p "$APP_DIR/logs"

# 5. Stop old instance & start
echo -e "${YELLOW}[4/5] 启动服务...${NC}"
pm2 stop gameh5 2>/dev/null || true
pm2 delete gameh5 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.config.js"
pm2 save

# 6. Setup auto-start on boot
echo -e "${YELLOW}[5/5] 设置开机自启...${NC}"
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址: http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo ""
echo "常用命令:"
echo "  pm2 status          # 查看状态"
echo "  pm2 logs gameh5     # 查看日志"
echo "  pm2 restart gameh5  # 重启服务"
echo "  pm2 stop gameh5     # 停止服务"
