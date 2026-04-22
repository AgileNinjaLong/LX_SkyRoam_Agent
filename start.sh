#!/usr/bin/env bash
set -e

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
  echo "未检测到 Docker，请先安装 Docker Desktop。"
  exit 1
fi

# 检查 docker compose 是否可用（现代语法）
if ! docker compose version &> /dev/null; then
  echo "未检测到 docker compose，请使用最新版 Docker Desktop。"
  exit 1
fi

# 创建必要目录
mkdir -p logs
mkdir -p backend/logs backend/uploads

# 环境文件提示（优先使用 .env.docker）
if [ ! -f ".env.docker" ]; then
  echo "提示：未找到 .env.docker，将使用默认环境变量。"
fi

# 启动服务，构建镜像并后台运行
echo "启动容器服务（含构建）..."
docker compose up -d --build

# 等待服务启动
sleep 5

echo "容器状态："
docker compose ps

# 输出访问信息（前端与两个独立API对外暴露）
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:13000"}
AMAP_MCP_URL=${AMAP_MCP_URL:-"http://localhost:13002"}
XHS_API_URL=${XHS_API_URL:-"http://localhost:18002"}

cat <<EOF

服务已启动：
- 前端（Web）：$FRONTEND_URL
- 高德 MCP HTTP：$AMAP_MCP_URL
- 小红书 API：$XHS_API_URL

说明：
- 后端主 API、Postgres、Redis、Celery/Flower 默认仅在容器网络内可访问。
- 容器内互通使用服务名：backend:8001，amap-mcp-api:3002，xhs-api:8002。

常用操作：
- 查看前端日志：docker compose logs -f frontend
- 查看后端日志：docker compose logs -f backend
- 查看 Amap MCP 日志：docker compose logs -f amap-mcp-api
- 查看 XHS API 日志：docker compose logs -f xhs-api
- 停止所有服务：docker compose down
EOF
