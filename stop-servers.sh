#!/bin/bash

# 关闭所有 Vite 开发服务器端口
echo "正在关闭所有开发服务器..."

# 关闭指定端口的进程
for port in 5500 5501 5502 5503 5173 5174 4173 4174; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "关闭端口 $port (进程 ID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

# 关闭所有 Vite 相关进程
pkill -9 -f "vite" 2>/dev/null

# 等待一下
sleep 1

# 检查是否还有进程在运行
remaining=$(lsof -i -P 2>/dev/null | grep LISTEN | grep -E "(5500|5501|5502|5503|5173|5174|4173|4174)" | wc -l)

if [ "$remaining" -eq 0 ]; then
  echo "✓ 所有端口已成功关闭"
else
  echo "⚠ 仍有 $remaining 个端口在运行，可能需要手动关闭"
  echo "运行中的端口："
  lsof -i -P 2>/dev/null | grep LISTEN | grep -E "(5500|5501|5502|5503|5173|5174|4173|4174)"
fi
