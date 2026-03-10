# Atlas API Setup Guide

完整的Atlas API申请和配置指南。

---

## 📋 Overview

Atlas API 是 ATrip Tech (亚旅科技) 提供的 B2B 机票分销平台,整合了全球150+家低成本航空公司 (LCC)。

**官网:** https://www.atriptech.com  
**API文档:** https://docs.atriptech.com  
**联系方式:** 见下方

---

## 🎯 申请流程

### Step 1: 联系销售

**方式A: 官网申请**
1. 访问 https://www.atriptech.com
2. 点击 "Contact Us" 或 "申请试用"
3. 填写表单:
   ```
   公司名称: FluxA Limited
   联系人: Cynthia Xu
   职位: COO
   邮箱: cynthia@fluxapay.xyz
   需求: B2B API Integration for flight booking
   预计月订单量: 100-500 (Phase 1测试)
   ```

**方式B: 直接联系 (更快)**
- **Email:** business@atriptech.com
- **电话:** +86 21-xxxx-xxxx (需要从官网获取最新联系方式)
- **微信:** 添加官方客服微信

**邮件模板:**
```
Subject: API Integration Inquiry - FluxA Limited

Hi Atlas Team,

We are FluxA Limited, building AI-powered financial infrastructure 
for the agent economy. We are interested in integrating Atlas API 
into our flight booking system.

Company Details:
- Name: FluxA Limited (Cayman Islands)
- Website: https://fluxapay.xyz
- Use Case: Slack-based flight booking with crypto payments
- Expected Volume: 100-500 bookings/month initially

Could you please provide:
1. Sandbox API credentials for testing
2. API documentation and integration guide
3. Pricing structure
4. Technical support contact

Looking forward to hearing from you.

Best regards,
Cynthia Xu
COO, FluxA Limited
cynthia@fluxapay.xyz
```

---

### Step 2: 提供资料

Atlas通常需要:

**公司资料:**
- [ ] 营业执照扫描件
- [ ] 公司简介 (PPT或PDF)
- [ ] 官网链接

**技术资料:**
- [ ] 技术对接人信息 (姓名/邮箱/微信)
- [ ] 预计集成时间
- [ ] 技术架构说明 (可选)

**FluxA的资料准备:**
```
公司全称: FluxA Limited
注册地: Cayman Islands
官网: https://fluxapay.xyz
GitHub: https://github.com/cynthiaxu0529-art/flight-booking-services
技术负责人: Cynthia Xu (cynthia@fluxapay.xyz)
```

---

### Step 3: 获取测试账号

审核通过后(通常1-3个工作日),你会收到:

**Sandbox Credentials:**
```
API Base URL: https://sandbox.atriptech.com/api
Client ID: your-client-id
Client Secret: your-client-secret
```

**测试账户余额:**
- 通常会预充一定金额用于测试下单
- 或者提供测试模式(不真实出票)

---

### Step 4: 配置到项目

收到credentials后:

1. **编辑 `.env`:**
   ```bash
   cd ~/flight-booking-service
   cp .env.example .env
   ```

2. **填写Atlas配置:**
   ```env
   ATLAS_API_URL=https://sandbox.atriptech.com/api
   ATLAS_CLIENT_ID=your-client-id-here
   ATLAS_CLIENT_SECRET=your-client-secret-here
   ```

3. **测试连接:**
   ```bash
   npm run dev
   # 在Slack输入: /flight search PEK SIN 2026-03-15
   ```

---

## 🧪 API测试 (命令行)

在等待Slack配置时,可以先测试Atlas API:

### 测试脚本

创建 `scripts/test-atlas.ts`:

```typescript
import { atlasClient } from '../src/services/atlas';

async function test() {
  console.log('🧪 Testing Atlas API...\n');

  try {
    // 1. 搜索航班
    console.log('1️⃣ Searching flights...');
    const flights = await atlasClient.search({
      origin: 'PEK',
      destination: 'SIN',
      departureDate: '2026-03-15',
    });

    console.log(`✅ Found ${flights.length} flights`);
    flights.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.airline}${f.flightNumber} - $${f.price}`);
    });

    if (flights.length === 0) {
      console.log('❌ No flights found. Check API credentials or route.');
      return;
    }

    // 2. 验证价格
    console.log('\n2️⃣ Verifying price...');
    const verification = await atlasClient.verify(flights[0].routingIdentifier);
    console.log(`✅ Session ID: ${verification.sessionId}`);
    console.log(`✅ Valid: ${verification.isValid}`);

    console.log('\n✅ Atlas API test successful!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

test();
```

**运行测试:**
```bash
npx tsx scripts/test-atlas.ts
```

---

## 📊 API Endpoints概览

### 1. Search (搜索航班)

**Endpoint:** `POST /search`

**Request:**
```json
{
  "tripType": "OneWay",
  "fromCity": "PEK",
  "toCity": "SIN",
  "fromDate": "2026-03-15",
  "adultNumber": 1,
  "childNumber": 0,
  "infantNumber": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "routings": [
      {
        "routingIdentifier": "xxx",
        "adultPrice": 280.00,
        "currency": "USD",
        "fromSegments": [
          {
            "airlineCode": "CA",
            "flightNumber": "975",
            "departureDateTime": "2026-03-15T10:30:00",
            "arrivalDateTime": "2026-03-15T16:45:00",
            ...
          }
        ]
      }
    ]
  }
}
```

### 2. Verify (验证价格)

**Endpoint:** `POST /verify`

**Request:**
```json
{
  "routingIdentifier": "xxx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "xxx",
    "isValid": true
  }
}
```

### 3. Order (创建订单)

**Endpoint:** `POST /order`

**Request:**
```json
{
  "sessionId": "xxx",
  "passengers": [
    {
      "name": "CYNTHIA/XU",
      "passengerType": 1,
      "gender": 1,
      "birthday": "1990-01-01",
      "nationality": "CN",
      "cardNum": "E12345678",
      "cardExpired": "2030-12-31",
      "cardIssuePlace": "CN"
    }
  ],
  "contact": {
    "name": "Cynthia Xu",
    "email": "cynthia@fluxapay.xyz",
    "mobile": "+8613800138000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNo": "ATL20260310001"
  }
}
```

### 4. Pay (支付订单)

**Endpoint:** `POST /pay`

**Request:**
```json
{
  "orderNo": "ATL20260310001",
  "paymentMethod": "deposit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment successful"
}
```

---

## 🔔 Webhook配置

出票后Atlas会回调你的服务器。

**配置Webhook URL:**

联系Atlas技术支持提供:
```
Webhook URL: https://your-domain.com/webhooks/atlas/ticket-issued
```

**回调格式:**
```json
{
  "orderNo": "ATL20260310001",
  "pnr": "ABC123",
  "ticketURL": "https://...",
  "status": "ticketed"
}
```

**测试Webhook (本地):**

使用ngrok暴露本地服务:
```bash
ngrok http 3000
# Webhook URL: https://xxx.ngrok.io/webhooks/atlas/ticket-issued
```

---

## 💰 计费模式

Atlas通常有以下计费方式:

### 1. 技术服务费
- **按票收费:** 每张票 $1-3 USD
- **按月收费:** 固定月费 + 每票费用

### 2. 预付账户
- 需要预充值到Atlas账户
- 下单时从余额扣除
- 低于阈值时需要充值

### 3. 后付结算
- 月底统一结算
- 需要一定信用额度

**建议:** Phase 1先用预付账户,测试稳定后再申请月结。

---

## 🛡️ 安全最佳实践

### 1. Credentials管理
```bash
# ❌ 不要
ATLAS_CLIENT_SECRET=abc123  # 明文存储

# ✅ 应该
# 使用环境变量
export ATLAS_CLIENT_SECRET=$(cat /secure/path/secret.txt)

# 或使用secrets管理工具
# Vercel: Environment Variables
# AWS: Secrets Manager
# 1Password: CLI
```

### 2. IP白名单
联系Atlas添加你的服务器IP到白名单:
```
Production IP: xxx.xxx.xxx.xxx
Staging IP: xxx.xxx.xxx.xxx
```

### 3. 请求签名 (如果提供)
检查Atlas是否提供请求签名机制,用于验证Webhook真实性。

---

## ⚠️ 常见问题

### Q1: 搜索返回空结果?
**可能原因:**
- 航线不支持 (Atlas主要覆盖亚太LCC)
- 日期太近/太远 (通常支持1-330天)
- API参数错误

**解决:**
```bash
# 测试已知可用航线
PEK → SIN  ✅
HKG → BKK  ✅
KUL → SIN  ✅
```

### Q2: Verify返回isValid=false?
**可能原因:**
- 价格已变动
- routingIdentifier过期 (通常15分钟)
- 座位已售罄

**解决:** 重新搜索

### Q3: Order创建失败?
**检查清单:**
- [ ] sessionId是否有效
- [ ] 乘客信息格式是否正确
- [ ] 护照号/过期日期是否合理
- [ ] 联系方式是否完整

### Q4: Webhook没收到?
**排查:**
```bash
# 1. 检查URL是否可访问
curl -X POST https://your-domain.com/webhooks/atlas/ticket-issued

# 2. 检查服务器日志
tail -f /var/log/flight-booking.log

# 3. 联系Atlas确认Webhook配置
```

---

## 📞 技术支持

**Atlas技术支持:**
- Email: tech@atriptech.com
- 工作时间: 周一至周五 9:00-18:00 (北京时间)
- 响应时间: 通常24小时内

**紧急联系:**
- 如有生产环境问题,可要求技术对接人微信

---

## ✅ 申请检查清单

Phase 1启动前,确保:

- [ ] 已联系Atlas销售
- [ ] 已提交公司资料
- [ ] 收到Sandbox credentials
- [ ] 已配置到`.env`
- [ ] 已测试Search接口
- [ ] 已测试Verify接口
- [ ] 已了解计费模式
- [ ] 已配置Webhook URL (可选,Phase 2需要)

---

## 🚀 下一步

完成Atlas API申请后:
1. 继续 [Slack App配置](./SLACK_APP_SETUP.md)
2. 启动本地开发 [快速启动](../QUICKSTART.md)
3. 进行端到端测试

---

**祝申请顺利!** 🎉

如有问题,随时在项目GitHub Issues提问。
