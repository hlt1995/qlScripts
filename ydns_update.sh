#!/bin/sh
## name: ydns IP更新
## cron: */5 * * * *

# 环境变量：YDNS_CONFIG
# 格式：域名|用户名|密码|记录类型
# 举例：
#   只更新IPv4：abc.ydns.eu|123456@qq.com|a123456|A
#   只更新IPv6：abc.ydns.eu|123456@qq.com|a123456|AAAA
#   同时更新v4/v6：abc.ydns.eu|123456@qq.com|a123456|A&AAAA

CONFIG="${YDNS_CONFIG:-}"

if [ -z "$CONFIG" ]; then
    echo "❌ 缺少环境变量 YDNS_CONFIG，格式应为：域名|用户名|密码|记录类型(A/AAAA/A&AAAA)"
    exit 1
fi

# 分割配置
YDNS_HOST=$(echo "$CONFIG" | cut -d '|' -f1)
YDNS_USER=$(echo "$CONFIG" | cut -d '|' -f2)
YDNS_PASS=$(echo "$CONFIG" | cut -d '|' -f3)
IP_TYPE=$(echo "$CONFIG" | cut -d '|' -f4)

if [ -z "$YDNS_HOST" ] || [ -z "$YDNS_USER" ] || [ -z "$YDNS_PASS" ] || [ -z "$IP_TYPE" ]; then
    echo "❌ YDNS_CONFIG 格式错误，应为：域名|用户名|密码|记录类型(A/AAAA/A&AAAA)"
    exit 1
fi

# API
IPV4_API="http://members.3322.org/dyndns/getip"
IPV6_API="https://api64.ipify.org"   # 获取IPv6

# 上次IP记录文件路径
IPV4_FILE="/ql/data/scripts/hlt1995_qlScript/ydns_last_ipv4.txt"
IPV6_FILE="/ql/data/scripts/hlt1995_qlScript/ydns_last_ipv6.txt"

DEBUG="${DEBUG:-false}"
LOG="/dev/null"

# 获取 IP
get_ipv4() { curl -4 -s "$IPV4_API" 2>/dev/null; }
get_ipv6() { curl -6 -s "$IPV6_API" 2>/dev/null; }

# 文件读写
get_last_ip() { [ -f "$1" ] && cat "$1" || echo ""; }
save_ip() { echo "$2" > "$1"; }

# 更新 YDNS
update_ydns() {
    local ip="$1"
    local url="https://ydns.io/api/v1/update/?host=${YDNS_HOST}&ip=${ip}"
    echo "请求URL: $url" | tee -a "$LOG"

    local response=$(curl -s -u "${YDNS_USER}:${YDNS_PASS}" "$url")
    echo "原始响应: $response" | tee -a "$LOG"

    if echo "$response" | grep -q -E "ok|good|nochg"; then
        echo "✅ 更新成功！响应: ${response}" | tee -a "$LOG"
        return 0
    else
        echo "❌ 更新失败或响应异常：${response}" >&2 | tee -a "$LOG"
        return 1
    fi
}

# 更新逻辑
update_ip() {
    local type="$1"
    local current_ip last_ip file label

    if [ "$type" = "A" ]; then
        current_ip=$(get_ipv4)
        file="$IPV4_FILE"
        label="IPv4"
    else
        current_ip=$(get_ipv6)
        file="$IPV6_FILE"
        label="IPv6"
    fi

    last_ip=$(get_last_ip "$file")

    if [ -z "$current_ip" ]; then
        echo "❌ 无法获取公网${label}地址" >&2 | tee -a "$LOG"
        return
    fi

    echo "${label} 当前: $current_ip" | tee -a "$LOG"
    echo "${label} 上次: $last_ip" | tee -a "$LOG"

    if [ "$current_ip" = "$last_ip" ]; then
        echo "ℹ️ ${label} 未变化，跳过更新" | tee -a "$LOG"
    else
        echo "🔄 ${label} 已变化，开始更新..." | tee -a "$LOG"
        if update_ydns "$current_ip"; then
            save_ip "$file" "$current_ip"
            echo "📌 已保存${label}: $current_ip" | tee -a "$LOG"
        fi
    fi
}

# 主流程
main() {
    [ "$DEBUG" = "true" ] && set -x

    echo "===== YDNS DDNS 更新启动 =====" | tee -a "$LOG"
    echo "域名: ${YDNS_HOST}" | tee -a "$LOG"
    echo "更新类型: ${IP_TYPE}" | tee -a "$LOG"

    case "$IP_TYPE" in
        A)        update_ip A ;;
        AAAA)     update_ip AAAA ;;
        "A&AAAA") update_ip A; update_ip AAAA ;;
        *)        echo "❌ 记录类型无效，应为 A / AAAA / A&AAAA" ;;
    esac

    echo "===== 更新完成 =====" | tee -a "$LOG"
}

main
