#!/bin/bash
# 企业微信 Dashboard 推送脚本（独立部署/测试用）
# Docker 部署时不需要此脚本，后端内置了定时推送服务
# 用法: bash push-dashboard.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_BASE="${API_BASE_URL:-http://localhost:8080}"
WECOM_KEY="${WECOM_WEBHOOK_KEY:-}"

if [ -z "$WECOM_KEY" ]; then
  echo "ERROR: WECOM_WEBHOOK_KEY not set"
  exit 1
fi

WECOM_URL="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${WECOM_KEY}"
TOKEN="${API_TOKEN:-}"

# 如果没有 token，先登录
if [ -z "$TOKEN" ]; then
  LOGIN_RESP=$(curl -s -X POST "${API_BASE}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')
  TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
  if [ -z "$TOKEN" ]; then
    echo "Login failed: $LOGIN_RESP"
    exit 1
  fi
fi

AUTH="Authorization: Bearer ${TOKEN}"
KIT="X-Kit-Id: ${KIT_ID:-1}"

# 获取数据
DASHBOARD=$(curl -s "${API_BASE}/api/v1/statistics/dashboard" -H "$AUTH" -H "$KIT")
AGING=$(curl -s "${API_BASE}/api/v1/statistics/aging-analysis" -H "$AUTH" -H "$KIT")
REMINDERS=$(curl -s "${API_BASE}/api/v1/reminders" -H "$AUTH" -H "$KIT")

export DASHBOARD AGING REMINDERS
export TODAY=$(date +%Y-%m-%d)
export KIT_ID="${KIT_ID:-1}"

# 生成 Markdown
MARKDOWN=$(python3 "${SCRIPT_DIR}/generate-markdown.py")

# 推送
RESPONSE=$(curl -s -X POST "$WECOM_URL" \
  -H "Content-Type: application/json" \
  -d "{
  \"msgtype\": \"markdown_v2\",
  \"markdown_v2\": {
    \"content\": $(echo "$MARKDOWN" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read(), ensure_ascii=False))")
  }
}")

ERRCODE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('errcode', -1))" 2>/dev/null)

if [ "$ERRCODE" = "0" ]; then
  echo "[$(date)] WeCom push succeeded"
else
  echo "[$(date)] WeCom push failed: $RESPONSE"
  exit 1
fi
