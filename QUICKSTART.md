# Quick Start Guide - Phase 1

快速启动指南,专注于**搜索功能验证**,暂不涉及支付和报销。

---

## 目标

- ✅ Slack Bot能响应 `/flight search`
- ✅ 能调用Atlas API搜索航班
- ✅ 在Slack显示航班列表
- ✅ 验证基础交互流程

**不涉及:**
- ❌ 真实支付
- ❌ 报销系统集成
- ❌ 生产部署

---

## 前置条件

1. **Node.js 18+** 已安装
2. **Slack workspace** (需要admin权限创建App)
3. **Atlas API测试账号** (申请sandbox credentials)
4. **ngrok** (暴露本地服务给Slack)

---

## 步骤1: 安装依赖

```bash
cd ~/flight-booking-service
npm install
```

---

## 步骤2: 配置环境变量 (最小化)

创建`.env`文件:

```bash
# Slack (稍后填写)
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=

# Atlas API
ATLAS_API_URL=https://sandbox.atriptech.com/api
ATLAS_CLIENT_ID=your-client-id
ATLAS_CLIENT_SECRET=your-client-secret

# 以下暂时留空(Phase 1不需要)
FLUXA_WALLET_API_KEY=
FLUXA_WALLET_ADDRESS=
REIMBURSEMENT_API_URL=
REIMBURSEMENT_API_KEY=

# Server
PORT=3000
NODE_ENV=development
```

**注意:** 先只需要配置 `ATLAS_*` 参数,Slack参数等创建App后再填。

---

## 步骤3: 创建Slack App

### 3.1 创建App

1. 访问 https://api.slack.com/apps
2. 点击 **Create New App**
3. 选择 **From scratch**
4. 填写:
   - **App Name:** Flight Booking Bot
   - **Workspace:** 选择你的workspace
5. 点击 **Create App**

### 3.2 添加权限

1. 左侧菜单 → **OAuth & Permissions**
2. **Scopes** → **Bot Token Scopes** → 添加:
   - `chat:write`
   - `commands`
   - `files:write`
   - `users:read`
3. 滚动到顶部 → 点击 **Install to Workspace**
4. 授权后,复制 **Bot User OAuth Token** (以`xoxb-`开头)
5. 粘贴到`.env`的`SLACK_BOT_TOKEN`

### 3.3 添加Slash Command

1. 左侧菜单 → **Slash Commands**
2. 点击 **Create New Command**
3. 填写:
   - **Command:** `/flight`
   - **Request URL:** `https://your-ngrok-url.ngrok.io/slack/events`
   - **Short Description:** Search and book flights
   - **Usage Hint:** `search <origin> <dest> <date>`
4. **暂时先不保存** (等ngrok启动后再填URL)

### 3.4 启用Interactive Components

1. 左侧菜单 → **Interactivity & Shortcuts**
2. 打开 **Interactivity** 开关
3. **Request URL:** `https://your-ngrok-url.ngrok.io/slack/events`
4. **暂时先不保存** (等ngrok启动后再填URL)

### 3.5 复制Signing Secret

1. 左侧菜单 → **Basic Information**
2. 找到 **App Credentials** → **Signing Secret**
3. 点击 **Show** → 复制
4. 粘贴到`.env`的`SLACK_SIGNING_SECRET`

---

## 步骤4: 启动本地服务

```bash
npm run dev
```

应该看到:
```
⚡️ Flight Booking Service is running on port 3000
```

---

## 步骤5: 暴露本地服务 (ngrok)

### 5.1 安装ngrok (如果没有)

```bash
# macOS
brew install ngrok

# 或下载: https://ngrok.com/download
```

### 5.2 启动ngrok

**新开一个终端**,运行:

```bash
ngrok http 3000
```

你会看到:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**复制这个`https://abc123.ngrok.io`地址** (每次运行都会变)

### 5.3 更新Slack App URLs

回到 Slack App 配置页面:

1. **Slash Commands** → 编辑 `/flight` → Request URL改为:
   ```
   https://abc123.ngrok.io/slack/events
   ```
2. **Interactivity & Shortcuts** → Request URL改为:
   ```
   https://abc123.ngrok.io/slack/events
   ```
3. 保存

---

## 步骤6: 测试!

### 6.1 在Slack中测试

1. 打开你的Slack workspace
2. 任意频道输入:
   ```
   /flight search PEK SIN 2026-03-15
   ```
3. 应该看到:
   - 🔍 Searching flights... (临时消息)
   - 航班列表 (带"选择"按钮)

### 6.2 预期结果

```
✈️ Flights: PEK → SIN
📅 2026-03-15 | Found 5 options
─────────────────────────────
1️⃣ CA975 ⭐
🛫 出发: PEK 10:30
🛬 到达: SIN 16:45
⏱️ 直飞 | 💰 $280 USD
                    [选择]
─────────────────────────────
2️⃣ MU5387
...
```

### 6.3 常见错误

**"dispatch_failed"**
- 检查Request URL是否正确
- 确认ngrok在运行
- 查看服务器日志

**"Atlas search error"**
- 检查Atlas credentials
- 确认API URL正确
- 查看服务器日志中的详细错误

---

## 步骤7: 简化测试 (跳过真实支付)

### 修改代码:暂时Mock支付流程

编辑 `src/slack/actions/confirm-booking.ts`,在创建订单后,**暂时不调用FluxA API**:

```typescript
// 注释掉支付链接创建
/*
const paymentLink = await fluxaClient.createPaymentLink({...});
*/

// 替换为Mock
await client.chat.postMessage({
  channel: channelId,
  text: `✅ Order created: ${orderNo}\n\n` +
        `💡 Phase 1 Test: 支付功能暂未实现\n` +
        `✓ 搜索功能 OK\n` +
        `✓ 价格验证 OK\n` +
        `✓ 订单创建 OK`,
});
```

这样你可以测试完整的用户交互流程,不需要真实支付。

---

## 步骤8: 调试技巧

### 查看服务器日志

终端会实时显示:
```
Atlas search error: ...
Slack command: /flight search PEK SIN 2026-03-15
```

### 查看ngrok请求

访问: http://localhost:4040

可以看到所有从Slack发来的请求。

### 查看Slack App日志

Slack App配置页面 → **Event Subscriptions** → 可以看到请求历史

---

## 成功标志

Phase 1完成的标准:

- ✅ `/flight search` 能返回航班列表
- ✅ 点击"选择"能显示订单确认
- ✅ 点击"确认下单"能创建Atlas订单
- ✅ 无报错,交互流畅

---

## 下一步

Phase 1稳定后:

1. **优化搜索结果展示** - 更友好的格式
2. **添加错误处理** - 无航班/API失败时的提示
3. **乘客信息管理** - 保存用户的护照信息
4. **Phase 2: 支付集成** - FluxA Wallet对接

---

## 需要帮助?

常见问题:

1. **Atlas API申请** - 联系Atlas销售获取测试账号
2. **ngrok URL改变** - 每次重启ngrok需要更新Slack App配置
3. **权限问题** - 确保在Slack workspace有创建App权限

## 简化启动脚本

创建 `scripts/dev.sh`:

```bash
#!/bin/bash
echo "🚀 Starting Flight Booking Service..."
echo ""
echo "1. 确保.env已配置"
echo "2. 在另一个终端运行: ngrok http 3000"
echo "3. 复制ngrok URL更新Slack App配置"
echo ""
npm run dev
```

运行:
```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

---

祝测试顺利! 🚀
