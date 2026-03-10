# Architecture Documentation

## System Overview

Flight Booking Service 是一个基于 Slack 的机票预订系统，集成 Atlas API、FluxA Wallet 和 Reimbursement System。

## Core Components

### 1. Slack Bot
- **Commands**: `/flight search`, `/flight status`
- **Interactive Components**: 按钮(选择航班、确认预订)
- **Notifications**: 订单状态更新

### 2. Atlas API Integration
- **Search**: 搜索航班
- **Verify**: 验证价格有效性
- **Order**: 创建订单
- **Pay**: 支付订单(使用预充值账户)

### 3. FluxA Wallet Integration
- **Payment Links**: 生成USDC支付二维码
- **Payment Polling**: 轮询支付状态(每10秒)
- **Webhook**: 接收支付确认(备用)

### 4. Reimbursement System Integration
- **Auto-create**: 出票后自动创建报销单
- **Itinerary PDF**: 自动生成行程单
- **Attachments**: 关联电子客票

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User: /flight search PEK SIN 2026-03-15             │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Slack Bot → Atlas API (search)                      │
│    返回: 5个航班选项 + routingIdentifier                │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Save to TempOrder (routingId, flight data)          │
│    显示: Slack消息 + "选择"按钮                          │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. User clicks "选择"                                   │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Slack Bot → Atlas API (verify)                      │
│    返回: sessionId, isValid                             │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. 显示订单确认 + "确认下单"按钮                         │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 7. User clicks "确认下单"                               │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Slack Bot → Atlas API (order)                       │
│    返回: orderNo                                        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 9. Slack Bot → FluxA Wallet (create payment link)      │
│    返回: paymentLinkId, QR code                         │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 10. 上传二维码到Slack + 开始轮询支付状态                 │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 11. User扫码支付USDC                                    │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 12. 轮询检测到支付 → Slack通知                          │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 13. Slack Bot → Atlas API (pay)                        │
│     触发出票流程                                        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 14. Atlas Webhook → Slack Bot (ticket issued)          │
│     携带: PNR, eTicket URL                              │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 15. Slack Bot → Reimbursement API                      │
│     POST /reimbursements/flights                        │
│     {atlas_order_no, pnr, flight, payment}              │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 16. Reimbursement System:                              │
│     • 保存报销单                                        │
│     • 保存航班详情                                       │
│     • 生成行程单PDF                                     │
│     返回: reimbursement_id, itinerary_url               │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 17. Slack通知:                                         │
│     ✅ 机票已出票 (PNR)                                 │
│     📋 报销单已生成 (链接)                               │
│     📄 行程单PDF (下载按钮)                              │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### TempOrder (临时订单)

```typescript
{
  id: string;              // UUID
  slackUserId: string;     // Slack用户ID
  slackChannel: string;    // Slack频道ID
  routingId: string;       // Atlas routingIdentifier
  sessionId?: string;      // Atlas sessionId (验证后)
  flightData: JSON;        // 航班详情快照
  status: string;          // searching | verified | ordering | paying | paid | completed
  paymentLinkId?: string;  // FluxA支付链接ID
  atlasOrderNo?: string;   // Atlas订单号
  expiresAt: Date;         // 过期时间(15分钟)
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### 1. 航班搜索失败
- 显示友好错误消息
- 建议重试或修改搜索条件

### 2. 价格变动
- 验证时发现价格不一致
- 通知用户重新搜索
- 删除过期订单

### 3. 订单创建失败
- 记录错误日志
- 通知用户具体失败原因
- 保留临时订单供调试

### 4. 支付超时
- 15分钟无支付 → 自动取消订单
- 发送Slack通知
- 清理临时数据

### 5. 报销单创建失败
- 仍然通知用户出票成功
- 提示手动创建报销单
- 记录错误供后续处理

## Security Considerations

### 1. API密钥管理
- 所有密钥存储在环境变量
- 不提交到Git仓库
- 生产环境使用secrets管理

### 2. Webhook验证
- Atlas: 验证来源IP或签名(如果提供)
- FluxA: 验证签名
- Slack: 使用Signing Secret验证

### 3. 用户授权
- 检查Slack用户ID匹配
- 订单只能由创建者操作
- 敏感操作需二次确认

## Scalability

### Current Limitations
- 单实例运行
- 轮询支付状态(不适合大量并发)
- 临时订单存储在数据库

### Future Improvements
- 使用Redis替代数据库存储临时订单
- WebSocket替代轮询
- 多实例部署(需要共享状态)
- 消息队列处理Webhook

## Monitoring

### Key Metrics
- 搜索请求量
- 订单转化率
- 支付成功率
- 报销单生成成功率
- API响应时间

### Logging
- 所有API调用
- 错误堆栈
- 用户操作轨迹
- Webhook接收记录

## Deployment Checklist

- [ ] 配置环境变量
- [ ] 设置Slack App
- [ ] 配置Webhook URLs
- [ ] 测试Atlas API连接
- [ ] 测试FluxA Wallet集成
- [ ] 测试Reimbursement API
- [ ] 配置数据库
- [ ] 设置监控和日志
- [ ] 准备生产域名和SSL证书
- [ ] 配置自动重启(PM2/Docker)
