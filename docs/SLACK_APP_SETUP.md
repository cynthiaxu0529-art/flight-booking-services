# Slack App Setup Guide

完整的Slack App创建和配置指南,包含截图说明和故障排查。

---

## 📋 Overview

我们要创建一个Slack Bot,用户可以通过 `/flight` 命令搜索和预订机票。

**功能:**
- ✅ Slash Command: `/flight search`, `/flight status`
- ✅ Interactive Buttons: 选择航班、确认订单
- ✅ Rich Messages: 格式化的航班列表
- ✅ File Upload: 支付二维码、行程单PDF

---

## 🎯 创建步骤

### Step 1: 创建Slack App

1. **访问:** https://api.slack.com/apps

2. **点击 "Create New App"**

3. **选择创建方式:** "From scratch"

4. **填写信息:**
   ```
   App Name: Flight Booking Bot
   Pick a workspace: [选择你的workspace]
   ```

5. **点击 "Create App"**

---

### Step 2: 配置基本信息

#### 2.1 设置App图标 (可选)

1. 左侧菜单 → **Basic Information**
2. 向下滚动到 **Display Information**
3. 上传图标 (建议512x512px,飞机✈️主题)
4. 填写描述:
   ```
   Short description: Book flights via Atlas API with crypto payments
   
   Long description:
   Search and book flights from 150+ airlines using Slack. 
   Pay with USDC on Base network. Auto-generate reimbursements.
   ```

#### 2.2 复制App Credentials

1. 找到 **App Credentials** 区域
2. **复制 Signing Secret:**
   - 点击 "Show" 按钮
   - 复制整个字符串
   - 保存到 `.env` → `SLACK_SIGNING_SECRET=xxx`

---

### Step 3: 添加Bot Token权限

1. 左侧菜单 → **OAuth & Permissions**

2. 滚动到 **Scopes** → **Bot Token Scopes**

3. **点击 "Add an OAuth Scope"** 添加以下权限:

   | Scope | 用途 |
   |-------|------|
   | `chat:write` | 发送消息 |
   | `chat:write.public` | 在未加入的频道发消息 (可选) |
   | `commands` | Slash命令 |
   | `files:write` | 上传文件 (二维码/PDF) |
   | `users:read` | 读取用户信息 |

4. **滚动到顶部 → 点击 "Install to Workspace"**

5. **授权页面:** 检查权限列表,点击 "Allow"

6. **复制 Bot User OAuth Token:**
   - 会显示以 `xoxb-` 开头的token
   - 复制整个token
   - 保存到 `.env` → `SLACK_BOT_TOKEN=xoxb-...`

---

### Step 4: 创建Slash Command

1. 左侧菜单 → **Slash Commands**

2. **点击 "Create New Command"**

3. **填写信息:**
   ```
   Command: /flight
   Request URL: https://your-domain.com/slack/events
   Short Description: Search and book flights
   Usage Hint: search <origin> <dest> <date>
   Escape channels, users, and links sent to your app: ☑️
   ```

   **⚠️ Request URL说明:**
   - 开发环境: 使用ngrok URL (见下方)
   - 生产环境: 使用你的域名

4. **点击 "Save"**

---

### Step 5: 启用Interactive Components

1. 左侧菜单 → **Interactivity & Shortcuts**

2. **打开 "Interactivity" 开关**

3. **填写 Request URL:**
   ```
   https://your-domain.com/slack/events
   ```
   (与Slash Command相同)

4. **点击 "Save Changes"**

---

### Step 6: 配置Event Subscriptions (可选)

如果你想接收消息事件 (比如用户@bot):

1. 左侧菜单 → **Event Subscriptions**

2. **打开 "Enable Events"**

3. **Request URL:**
   ```
   https://your-domain.com/slack/events
   ```

4. **Subscribe to bot events:**
   - `app_mention` (用户@机器人)
   - `message.im` (私聊消息)

5. **点击 "Save Changes"**

---

## 🌐 本地开发配置 (ngrok)

开发阶段,Slack需要访问你的本地服务器。使用ngrok暴露本地端口:

### 1. 安装ngrok

```bash
# macOS
brew install ngrok

# 或访问: https://ngrok.com/download
```

### 2. 启动服务

**终端1 - 启动项目:**
```bash
cd ~/flight-booking-service
npm run dev
```

**终端2 - 启动ngrok:**
```bash
ngrok http 3000
```

### 3. 获取ngrok URL

ngrok会显示:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**复制这个 `https://abc123.ngrok-free.app` 地址**

### 4. 更新Slack App配置

回到Slack App配置页面,更新所有URL:

- **Slash Commands** → `/flight` → Request URL:
  ```
  https://abc123.ngrok-free.app/slack/events
  ```

- **Interactivity & Shortcuts** → Request URL:
  ```
  https://abc123.ngrok-free.app/slack/events
  ```

- **Event Subscriptions** → Request URL:
  ```
  https://abc123.ngrok-free.app/slack/events
  ```

**⚠️ 注意:** 每次重启ngrok,URL会变化,需要重新更新!

---

## 🧪 测试Slack Bot

### 1. 添加Bot到频道

1. 打开Slack workspace
2. 选择一个频道 (或创建测试频道 `#flight-booking-test`)
3. 输入: `/invite @Flight Booking Bot`

### 2. 测试Slash Command

在频道输入:
```
/flight search PEK SIN 2026-03-15
```

**预期结果:**

✅ **成功:**
```
🔍 Searching flights from PEK to SIN on 2026-03-15...

(几秒后)

✈️ Flights: PEK → SIN
📅 2026-03-15 | Found 3 options
─────────────────────────────
1️⃣ CA975 ⭐
🛫 出发: PEK 10:30
🛬 到达: SIN 16:45
⏱️ 直飞 | 💰 $280 USD
                    [选择]
```

❌ **失败 (dispatch_failed):**
- 检查Request URL是否正确
- 确认ngrok在运行
- 查看服务器日志

### 3. 测试Interactive Buttons

点击 **[选择]** 按钮

**预期结果:**

```
📋 Confirm Your Booking

Flight: CA975
Route: PEK → SIN
Departure: 2026-03-15 10:30
Price: $280 USD

[✅ Confirm Booking] [❌ Cancel]
```

---

## 📊 查看日志和调试

### Slack请求日志

访问ngrok Web界面:
```
http://localhost:4040
```

可以看到:
- 所有从Slack发来的请求
- 请求body
- 响应内容

### Slack App日志

Slack App配置页面 → **Event Subscriptions** 或 **Slash Commands**

可以看到:
- 请求历史
- 错误信息
- 响应时间

### 服务器日志

本地开发时,终端会实时显示:
```bash
Atlas search: { origin: 'PEK', destination: 'SIN', ... }
Slack command received: /flight search PEK SIN 2026-03-15
```

---

## 🎨 消息格式化技巧

### 1. Block Kit Builder

设计复杂消息布局:

**工具:** https://app.slack.com/block-kit-builder

**示例:**
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "✈️ Flight Options"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*CA975* PEK → SIN\n$280 USD"
      },
      "accessory": {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Select"
        },
        "value": "flight_1",
        "action_id": "select_flight"
      }
    }
  ]
}
```

### 2. Markdown语法

Slack支持的格式:

```
*粗体*
_斜体_
~删除线~
`代码`
```code block```
> 引用
• 列表项
```

### 3. Emoji

```
:airplane: ✈️
:white_check_mark: ✅
:x: ❌
:moneybag: 💰
:clock3: 🕒
```

---

## 🔒 安全配置

### 1. 验证Slack请求

所有从Slack来的请求都带有签名,服务器会自动验证:

```typescript
// @slack/bolt 自动处理
// 使用 SLACK_SIGNING_SECRET 验证请求真实性
```

### 2. 限制访问权限

**Bot Token权限最小化:**
- ✅ 只添加必需的scopes
- ❌ 不要添加 `users:write` 等危险权限

**Workspace限制:**
- 只安装到你的workspace
- 不要发布到Slack App Directory (除非需要)

### 3. Token轮换

定期更新Bot Token:
1. **OAuth & Permissions** → **Rotate Token**
2. 更新 `.env` 文件
3. 重启服务

---

## 🚀 生产环境部署

### 1. 获取固定域名

**选项A: Vercel**
```bash
vercel deploy
# 会得到: https://flight-booking-xxx.vercel.app
```

**选项B: 自定义域名**
```bash
# 配置DNS指向你的服务器
your-domain.com → your-server-ip

# 配置SSL证书 (Let's Encrypt)
certbot --nginx -d api.your-domain.com
```

### 2. 更新Slack App URLs

用生产域名替换ngrok URL:

```
https://api.your-domain.com/slack/events
```

### 3. 测试生产环境

```bash
# 测试Slack能否访问
curl -X POST https://api.your-domain.com/slack/events

# 在Slack测试
/flight search PEK SIN 2026-03-15
```

---

## ⚠️ 常见问题

### Q1: "dispatch_failed" 错误

**原因:**
- Request URL不可访问
- ngrok未运行
- 服务器未启动

**解决:**
```bash
# 1. 检查服务器
curl http://localhost:3000/health
# 应返回: {"status":"ok"}

# 2. 检查ngrok
curl https://your-ngrok-url/health

# 3. 更新Slack URL配置
```

### Q2: 收到请求但无响应

**原因:**
- 服务器处理超时 (Slack要求3秒内响应)
- 代码抛出异常

**解决:**
```typescript
// 先ack,再处理
app.command('/flight', async ({ command, ack, respond }) => {
  await ack(); // 立即确认收到

  // 耗时操作放在后面
  const flights = await searchFlights(...);
  await respond({ blocks: ... });
});
```

### Q3: Interactive按钮不工作

**检查:**
- [ ] Interactivity是否启用
- [ ] Request URL是否正确
- [ ] action_id是否匹配代码

**调试:**
```typescript
app.action('select_flight', async ({ ack, body, logger }) => {
  await ack();
  logger.info('Button clicked:', body); // 查看日志
});
```

### Q4: Bot不回复消息

**可能原因:**
- Bot未加入频道
- Token权限不足
- 代码逻辑错误

**解决:**
```bash
# 1. 添加Bot到频道
/invite @Flight Booking Bot

# 2. 检查权限
OAuth & Permissions → Scopes

# 3. 查看日志
npm run dev
```

---

## 📞 获取帮助

**Slack API文档:**
- https://api.slack.com/docs
- https://api.slack.com/block-kit

**社区:**
- Slack Community: https://slackcommunity.com
- Stack Overflow: [slack-api] tag

**我们的支持:**
- GitHub Issues: https://github.com/cynthiaxu0529-art/flight-booking-services/issues

---

## ✅ 配置检查清单

部署前确认:

**基本配置:**
- [ ] App已创建
- [ ] Bot Token已复制到`.env`
- [ ] Signing Secret已复制到`.env`

**功能配置:**
- [ ] Slash Command `/flight` 已创建
- [ ] Interactive Components已启用
- [ ] Request URLs已配置

**开发环境:**
- [ ] ngrok已安装
- [ ] 本地服务可启动
- [ ] Slack可以访问本地服务

**测试:**
- [ ] `/flight search` 能返回结果
- [ ] 按钮点击有响应
- [ ] 错误处理正常

---

## 🎉 完成!

Slack App配置完成后:

1. 继续 [Atlas API配置](./ATLAS_API_SETUP.md)
2. 启动本地开发 [快速启动](../QUICKSTART.md)
3. 进行端到端测试

**祝配置顺利!** 🚀

---

## 附录: 完整配置截图清单

建议保存以下页面截图,方便后续查看:

1. Basic Information → App Credentials
2. OAuth & Permissions → Bot Token Scopes
3. OAuth & Permissions → OAuth Tokens
4. Slash Commands → /flight配置
5. Interactivity & Shortcuts → Request URL

可以创建一个 `docs/screenshots/` 文件夹保存这些截图。
