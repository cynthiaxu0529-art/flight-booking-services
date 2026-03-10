# GitHub Actions CI/CD

自动化测试和部署配置说明。

---

## 📋 Overview

我们配置了两个GitHub Actions workflows:

1. **CI (Continuous Integration)** - 代码质量检查
2. **Deploy** - 自动部署到生产环境

---

## 🔄 CI Workflow

**文件:** `.github/workflows/ci.yml`

**触发条件:**
- Push到 `main` 或 `develop` 分支
- Pull Request到 `main` 分支

**Jobs:**

### 1. Lint & Type Check
- ✅ TypeScript编译检查
- ✅ 类型错误检测

### 2. Build
- ✅ 构建项目
- ✅ 上传build artifacts

### 3. Test
- ⏸️ 单元测试 (待添加)
- ⏸️ 代码覆盖率 (待添加)

### 4. Docker Build
- ✅ 构建Docker镜像
- ✅ 镜像缓存优化

### 5. Security Scan
- ✅ npm audit (依赖漏洞扫描)
- ✅ 敏感信息检测

---

## 🚀 Deploy Workflow

**文件:** `.github/workflows/deploy.yml`

**触发条件:**
- Push到 `main` 分支 (自动)
- 手动触发 (workflow_dispatch)

**部署选项 (4选1):**

### 选项1: Vercel

**配置步骤:**

1. **获取Vercel Token:**
   ```bash
   npx vercel login
   npx vercel token create
   ```

2. **获取项目信息:**
   ```bash
   cd ~/flight-booking-service
   npx vercel link
   # 会生成 .vercel/project.json
   ```

3. **在GitHub添加Secrets:**
   
   Settings → Secrets and variables → Actions → New repository secret
   
   ```
   VERCEL_TOKEN=xxx
   VERCEL_ORG_ID=xxx  (从 .vercel/project.json)
   VERCEL_PROJECT_ID=xxx  (从 .vercel/project.json)
   ```

4. **启用workflow:**
   
   编辑 `.github/workflows/deploy.yml`:
   ```yaml
   - name: Deploy to Vercel
     if: true  # 改为 true
   ```

### 选项2: Railway

**配置步骤:**

1. **安装Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **初始化项目:**
   ```bash
   cd ~/flight-booking-service
   railway init
   ```

3. **获取Token:**
   ```bash
   railway token
   ```

4. **在GitHub添加Secret:**
   ```
   RAILWAY_TOKEN=xxx
   ```

5. **启用workflow:**
   ```yaml
   - name: Deploy to Railway
     if: true
   ```

### 选项3: SSH部署到VPS

**配置步骤:**

1. **生成SSH密钥 (如果没有):**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions"
   ```

2. **添加公钥到服务器:**
   ```bash
   ssh-copy-id user@your-server.com
   ```

3. **在GitHub添加Secrets:**
   ```
   SSH_HOST=your-server.com
   SSH_USER=ubuntu
   SSH_PRIVATE_KEY=<私钥内容>
   ```

4. **在服务器安装PM2:**
   ```bash
   npm install -g pm2
   pm2 startup
   ```

5. **启用workflow:**
   ```yaml
   - name: Deploy to VPS via SSH
     if: true
   ```

### 选项4: Docker部署

**配置步骤:**

1. **配置Docker Registry:**
   
   GitHub Container Registry:
   ```bash
   # Settings → Developer settings → Personal access tokens
   # 创建token,勾选 write:packages
   ```

2. **在GitHub添加Secrets:**
   ```
   DOCKER_USERNAME=your-username
   DOCKER_PASSWORD=ghp_xxx  (或 registry token)
   ```

3. **修改workflow:**
   ```yaml
   - name: Build and push Docker image
     if: true
     with:
       tags: |
         ghcr.io/cynthiaxu0529-art/flight-booking:latest
   ```

---

## 📊 查看CI/CD状态

### GitHub Actions页面

访问: https://github.com/cynthiaxu0529-art/flight-booking-services/actions

可以看到:
- ✅ 所有workflow运行记录
- 📊 每个job的执行时间
- 📄 详细日志

### README徽章

在README.md中显示CI状态:

```markdown
[![CI](https://github.com/cynthiaxu0529-art/flight-booking-services/actions/workflows/ci.yml/badge.svg)](https://github.com/cynthiaxu0529-art/flight-booking-services/actions/workflows/ci.yml)
```

---

## 🧪 本地测试Workflow

在推送前,可以本地验证workflow配置:

```bash
# 安装act (GitHub Actions本地运行工具)
brew install act

# 运行CI workflow
act push

# 运行特定job
act -j lint-and-typecheck
```

---

## 🔐 Secrets管理

### 添加Secret

1. GitHub仓库 → Settings
2. Secrets and variables → Actions
3. New repository secret

### 推荐的Secrets

| Secret | 用途 | 示例 |
|--------|------|------|
| `VERCEL_TOKEN` | Vercel部署 | `xxx` |
| `RAILWAY_TOKEN` | Railway部署 | `xxx` |
| `SSH_PRIVATE_KEY` | SSH部署 | `-----BEGIN...` |
| `SLACK_WEBHOOK_URL` | 部署通知 | `https://hooks.slack.com/...` |

### 在Workflow中使用

```yaml
env:
  MY_SECRET: ${{ secrets.MY_SECRET }}
```

---

## 📈 优化建议

### 1. 缓存依赖

已配置Node.js缓存:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### 2. 并行执行

CI workflow中的jobs会并行运行,加快速度。

### 3. 条件执行

部署只在main分支触发:
```yaml
if: github.ref == 'refs/heads/main'
```

### 4. 矩阵构建 (可选)

测试多个Node.js版本:
```yaml
strategy:
  matrix:
    node-version: [18, 20]
```

---

## ⚠️ 故障排查

### CI失败排查步骤

1. **查看日志:**
   - Actions → 点击失败的workflow
   - 展开失败的step
   - 查看错误信息

2. **常见错误:**
   
   **TypeScript编译失败:**
   ```bash
   # 本地测试
   npx tsc --noEmit
   ```
   
   **npm audit失败:**
   ```bash
   # 查看漏洞
   npm audit
   
   # 修复
   npm audit fix
   ```
   
   **Docker构建失败:**
   ```bash
   # 本地测试
   docker build -t test .
   ```

3. **重新运行:**
   - Actions → 点击workflow
   - 点击 "Re-run all jobs"

### 部署失败排查

1. **检查Secrets:**
   - 确认所有secrets已添加
   - 验证token未过期

2. **查看部署日志:**
   - 展开Deploy job
   - 查看具体错误

3. **手动部署测试:**
   ```bash
   # 本地测试部署命令
   vercel --prod  # 或其他部署命令
   ```

---

## 🎯 下一步

### Phase 1: 基础CI ✅
- [x] TypeScript检查
- [x] Build测试
- [x] Docker构建

### Phase 2: 测试覆盖
- [ ] 添加单元测试
- [ ] 集成测试
- [ ] E2E测试

### Phase 3: 自动部署
- [ ] 配置生产部署
- [ ] 健康检查
- [ ] 回滚机制

### Phase 4: 监控告警
- [ ] 部署通知 (Slack/Discord)
- [ ] 性能监控
- [ ] 错误追踪 (Sentry)

---

## 📞 获取帮助

**GitHub Actions文档:**
- https://docs.github.com/actions

**社区:**
- GitHub Community: https://github.community

**我们的支持:**
- Issues: https://github.com/cynthiaxu0529-art/flight-booking-services/issues

---

## ✅ 配置检查清单

- [ ] CI workflow能正常运行
- [ ] TypeScript检查通过
- [ ] Docker镜像能构建
- [ ] 部署方式已选择并配置
- [ ] Secrets已添加
- [ ] README徽章显示正常

完成后,每次push代码都会自动运行CI! 🚀
