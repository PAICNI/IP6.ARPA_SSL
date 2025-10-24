# IP6.ARPA SSL 一键配置工具

[![GitHub stars](https://img.shields.io/github/stars/eooce/auto-add-ssl-workers?style=social)](https://github.com/eooce/auto-add-ssl-workers) [![Telegram](https://img.shields.io/badge/%E5%8A%A0%E5%85%A5Telegram-%E7%BE%A4%E7%BB%84-blue?logo=telegram)](https://t.me/SZ_PAI) [![YouTube](httpsimg.shields.io/badge/%E8%AE%A2%E9%98%85-%E6%95%B0%E5%AD%97%E6%B4%BE-red?logo=youtube)](https://www.youtube.com/@PAI_CN)

一个基于 **Cloudflare Workers** 的工具，**一键为 IP6.ARPA 反向解析域名自动开启 Cloudflare 通用 SSL 证书**。无需复杂操作，几秒完成配置！同时内置 **IP6.ARPA 域名生成器**，支持一键生成并复制多个可用子域名。

---

## 功能亮点

- **一键开启 SSL**：支持 SSL.com（默认）、Let's Encrypt、Google、Sectigo 四家 CA
- **双模式 API**：
  - `POST /api/add-ssl`：JSON 提交
  - `GET /?zoneId=...`：查询参数调用
- **域名生成器**：输入 IPv6 CIDR（如 `2001:DB8::/48`），自动生成：
  - 根域名
  - 3 个随机前缀子域名（共 4 个）
  - **自动复制到剪贴板**
- **深色主题默认**：高对比度按钮 + 主题切换（支持本地记忆）
- **完全响应式**：手机、平板、电脑完美适配
- **安全无记录**：API Key 仅用于请求，**绝不存储**

---

## 快速开始

### 部署到 Cloudflare Workers

```bash
# 1. 克隆或 Fork 本仓库
git clone https://github.com/eooce/auto-add-ssl-workers.git

# 2. 使用 Wrangler 部署（推荐）
wrangler deploy
```

或直接在 [Cloudflare Workers 控制台](https://dash.cloudflare.com/) 粘贴代码部署。

---

### 网页使用

1. 访问你的 Worker 地址（如 `https://your-worker.workers.dev`）
2. 填写：
   - Cloudflare 注册邮箱
   - 区域 ID（Zone ID）
   - 全局 API Key
   - 选择 CA（建议 `SSL.com`）
3. 点击 **“添加 SSL 证书”**
4. 使用下方 **域名生成器** 输入 CIDR → 自动生成并复制

---

### API 调用示例

#### POST 请求
```json
{
  "email": "you@example.com",
  "zoneId": "your-zone-id",
  "apikey": "your-global-api-key",
  "enabled": true,
  "ca": "ssl_com"
}
```

## 加入社区

我们有活跃的交流群和教程频道，欢迎加入！

- **数字派 YouTube 频道**  
  https://www.youtube.com/@PAI_CN  
  **立即关注频道，获取最新教程！**

- **Telegram 粉丝交流群**  
  https://t.me/SZ_PAI  
  **点击加入群组，获取更多资源！**

> **防骗提醒**：任何私聊你的人都请谨慎！  
> 群内 **禁止链接、广告**，机器人自动踢禁！

---

## 许可证

[MIT License](LICENSE) - 免费使用、修改、商用

---

## 致谢

- 基于 Cloudflare Workers 构建
- 图标来自 [Font Awesome](https://fontawesome.com)
- 灵感源自 IP6.ARPA 社区玩家

---

**觉得好用就点个 Star！**  
有问题？欢迎提交 Issue，或在 Telegram 群内 @ 管理员。
