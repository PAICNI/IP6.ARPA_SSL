/**
 * Cloudflare Worker 主入口
 * 处理 API 请求（POST /api/add-ssl 或 GET /?zoneId=...）以及根路径的 HTML 页面返回
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API 请求路由：POST /api/add-ssl 或 GET /?zoneId=...
    const isApiRequest =
      (url.pathname === '/api/add-ssl' && request.method === 'POST') ||
      (url.pathname === '/' && request.method === 'GET' && url.searchParams.has('zoneId'));

    if (isApiRequest) {
      return handleApiRequest(request, url.searchParams);
    }

    // 默认返回 HTML 页面（默认深色主题 + 对比色按钮）
    return new Response(getHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

/**
 * 统一处理 API 请求（支持 POST JSON 和 GET 查询参数）
 * 调用 Cloudflare API 配置 Universal SSL
 */
async function handleApiRequest(request, queryParams) {
  let email, zone_id, api_key, enabled = true, certificate_authority = 'ssl_com';

  try {
    if (request.method === 'POST') {
      const body = await request.json();
      email = body.email;
      zone_id = body.zoneId;
      api_key = body.apikey;
      enabled = body.enabled ?? true;
      certificate_authority = body.ca || 'ssl_com';
    } else {
      email = queryParams.get('email');
      zone_id = queryParams.get('zoneId');
      api_key = queryParams.get('apikey');
      enabled = queryParams.get('enabled') !== 'false';
      certificate_authority = queryParams.get('ca') || 'ssl_com';
    }

    if (!email || !zone_id || !api_key) {
      return jsonResponse({
        success: false,
        errors: ['邮箱、区域ID和API密钥都是必需的'],
      }, 400);
    }

    const validCAs = ['ssl_com', 'lets_encrypt', 'google', 'sectigo'];
    const caToUse = validCAs.includes(certificate_authority) ? certificate_authority : 'ssl_com';

    const cfResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone_id}/ssl/universal/settings`, {
      method: 'PATCH',
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enabled,
        certificate_authority: caToUse,
      }),
    });

    const result = await cfResponse.json();
    return jsonResponse(result);

  } catch (error) {
    return jsonResponse({
      success: false,
      errors: [{ message: `请求失败: ${error.message || '未知错误'}` }],
    }, 500);
  }
}

/**
 * 工具函数：统一返回 JSON 响应并设置 CORS
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * 返回完整的 HTML 页面（默认深色主题 + 对比色按钮 + 主题切换）
 */
function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IP6.ARPA自动添加SSL证书</title>
  <meta name="description" content="一键为您的 IP6.ARPA 反向解析域名自动申请和配置 Cloudflare 通用 SSL 证书，同时提供 IP6.ARPA 域名生成。">
  <link rel="icon" href="https://tunnelbroker.net/favicon.ico" type="image/ico">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <style>
    :root {
      /* 深色主题变量（默认） */
      --bg-gradient: linear-gradient(135deg, #121212, #1e1e1e);
      --container-bg: rgba(30, 30, 30, 0.9);
      --text-color: #e0e0e0;
      --input-bg: rgba(50, 50, 50, 0.8);
      --border-color: rgba(255, 255, 255, 0.1);
      --btn-bg: linear-gradient(to right, #00d4ff, #ff6ec7);
      --info-bg: rgba(40, 40, 40, 0.6);
      --success-bg: #1e4028; --success-border: #2d6a4f; --success-text: #a8e6cf;
      --error-bg: #5f1c24; --error-border: #992833; --error-text: #fca5a5;
      --label-color: #ddd;
      --footer-color: #aaa;
      --code-bg: rgba(255,255,255,0.1);
    }

    /* 亮色主题覆盖变量 */
    [data-theme="light"] {
      --bg-gradient: linear-gradient(135deg, #f5f7fa, #c3cfe2);
      --container-bg: rgba(255, 255, 255, 0.85);
      --text-color: #333;
      --input-bg: rgba(255, 255, 255, 0.7);
      --border-color: rgba(255, 255, 255, 0.4);
      --btn-bg: linear-gradient(to right, #1a2a6c, #b21f1f);
      --info-bg: rgba(255, 255, 255, 0.35);
      --success-bg: #d4edda; --success-border: #c3e6cb; --success-text: #155724;
      --error-bg: #f8d7da; --error-border: #f5c6cb; --error-text: #721c24;
      --label-color: #2c3e50;
      --footer-color: #444;
      --code-bg: rgba(255,255,255,0.7);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    
    body {
      background: var(--bg-gradient);
      color: var(--text-color);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      transition: background 0.4s ease;
    }

    .container {
      background: var(--container-bg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 8px 8px 15px rgba(0, 0, 0, 0.15);
      width: 100%;
      max-width: 840px;
      padding: 30px;
      margin: 30px;
      position: relative;
      transition: background 0.4s ease;
    }

    .theme-toggle {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 50px;
      width: 50px;
      height: 26px;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 3px;
      transition: all 0.3s;
    }

    [data-theme="light"] .theme-toggle {
      background: rgba(0,0,0,0.1);
    }

    .theme-toggle .slider {
      width: 20px;
      height: 20px;
      background: #333;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    [data-theme="light"] .theme-toggle .slider {
      transform: translateX(24px);
      background: white;
    }

    h1 { text-align: center; margin-bottom: 25px; color: #e58d1dd9; font-size: 36px; padding-bottom: 15px; text-shadow: 1px 1px 3px rgba(0,0,0,0.7); }

    .form-row { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    .form-group.half-width { flex: 1; margin-bottom: 0; }

    .ca-select-style {
      width: 100%; padding: 12px 15px; border: 2px solid #555; border-radius: 8px; font-size: 16px;
      background: var(--input-bg); color: var(--text-color); transition: all 0.3s;
    }
    .ca-select-style:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.2); outline: none; }

    .registration-buttons { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 25px; }
    .register-btn {
      flex: 1; background: var(--btn-bg); color: white; text-align: center; text-decoration: none;
      border-radius: 8px; padding: 10px 15px; font-size: 16px; font-weight: 600; transition: all 0.3s;
      box-shadow: 5px 5px 10px rgba(0,0,0,0.15);
    }
    .register-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.15); }

    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 600; color: var(--label-color); }

    input[type="text"], input[type="email"], textarea, .ca-select-style {
      width: 100%; padding: 12px 15px; background: var(--input-bg); border: 1px solid var(--border-color);
      border-radius: 8px; font-size: 16px; color: var(--text-color); transition: all 0.3s; resize: none;
    }

    input[type="text"]:focus, input[type="email"]:focus, textarea:focus, .ca-select-style:focus {
      border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.2); outline: none;
      background: rgba(70,70,70,0.9);
    }
    [data-theme="light"] input:focus, [data-theme="light"] textarea:focus {
      background: rgba(255,255,255,0.5);
    }

    .error { border-color: #e74c3c !important; box-shadow: 0 0 0 3px rgba(231,76,60,0.2) !important; }
    .error-message { color: #e74c3c; font-size: 14px; margin-top: 5px; display: none; }

    .btn {
      background: var(--btn-bg); color: white; border: none; border-radius: 8px;
      padding: 14px 20px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;
      transition: all 0.3s; display: flex; justify-content: center; align-items: center;
      box-shadow: 5px 5px 10px rgba(0,0,0,0.15);
    }

    .info-box .btn#generate-btn { margin-top: 15px; }
    .info-box .btn#generate-btn i { position: relative; top: 1px; }

    .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    .btn:active { transform: translateY(0); }

    .spinner { display: none; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; margin-right: 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .result { margin-top: 20px; padding: 15px; border-radius: 8px; display: none; text-align: center; font-weight: 600; }
    .success { background-color: var(--success-bg); color: var(--success-text); border: 1px solid var(--success-border); }
    .error-result { background-color: var(--error-bg); color: var(--error-text); border: 1px solid var(--error-border); }

    .info-box {
      background: var(--info-bg); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border-left: 4px solid #db6034; padding: 15px; margin-top: 25px; border-radius: 8px;
    }

    .info-box h2 { color: var(--label-color); margin-bottom: 10px; font-size: 20px; }
    .info-box p { font-size: 14px; line-height: 1.5; color: #bbb; }
    [data-theme="light"] .info-box p { color: #34495e; }

    .footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--footer-color); }
    .footer a { color: inherit; text-decoration: none; transition: color 0.3s; }
    .footer a:hover { color: #3498db; }
    .separator { padding: 0 5px; color: inherit; display: inline-block; }

    pre { background: var(--code-bg); padding: 10px; border-radius: 6px; font-size: 14px; overflow-x: auto; color: #000; }
    [data-theme="light"] pre { color: #000; }
    [data-theme="dark"] pre { color: #eee; }

    @media (max-width: 600px) {
      .form-row { flex-direction: column; gap: 0; }
      .form-group.half-width { margin-bottom: 20px; }
      .footer { font-size: 0.8em; }
    }
  </style>
</head>
<body data-theme="dark">
  <div class="container">
    <!-- 主题切换开关 -->
    <button class="theme-toggle" id="theme-toggle" aria-label="切换主题">
      <div class="slider"></div>
    </button>

    <h1>IP6.ARPA自动添加SSL证书</h1>
    
    <div class="registration-buttons">
      <a href="https://tb.netassist.ua" class="register-btn" target="_blank"> IP6.ARPA 注册地址 ①</a>
      <a href="https://dns.he.net" class="register-btn" target="_blank"> IP6.ARPA 注册地址 ②</a>
      <a href="https://tunnelbroker.net/" class="register-btn" target="_blank"> IP6.ARPA 注册地址 ③</a>
    </div>
    
    <form id="ssl-form">
      <div class="form-row">
        <div class="form-group half-width">
          <label for="email"> Cloudflare注册邮箱 (Email)</label>
          <input type="email" id="email" placeholder="请输入您的Cloudflare邮箱">
          <div class="error-message" id="email-error">请输入有效的邮箱地址</div>
        </div>
        <div class="form-group half-width">
          <label for="zone-id"> 区域ID (Zone ID)</label>
          <input type="text" id="zone-id" placeholder="请输入您的区域ID">
          <div class="error-message" id="zone-id-error">请输入区域ID</div>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group half-width">
          <label for="api-key"> 全局API密钥 (API Key)</label>
          <input type="text" id="api-key" placeholder="请输入您的API密钥">
          <div class="error-message" id="api-key-error">请输入API密钥</div>
        </div>
        <div class="form-group half-width">
          <label for="ca-select"> CA证书颁发机构</label>
          <select id="ca-select" class="ca-select-style">
            <option value="ssl_com">SSL.com (默认)</option>
            <option value="lets_encrypt">Let's Encrypt</option>
            <option value="google">Google Trust Services</option>
            <option value="sectigo">Sectigo</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn" id="submit-btn">
        <div class="spinner" id="spinner"></div>
        <span id="btn-text"> 添加 SSL 证书</span>
      </button>
    </form>
    
    <div class="result" id="result-message"></div>
    
    <div class="info-box">
      <h2>IP6.ARPA 域名生成</h2>
      <div class="form-row" style="margin-top: 15px;">
        <div class="form-group half-width">
          <label for="ipv6-cidr"> 输入 IPv6 CIDR 地址</label>
          <input type="text" id="ipv6-cidr" placeholder="请输入 IPv6 CIDR, 例如: 2001:DB8::/48">
          <div class="error-message" id="ipv6-cidr-error">请输入有效的 IPv6 CIDR</div>
          <button type="button" class="btn" id="generate-btn"> 生成 IP6.ARPA 域名</button>
        </div>
        <div class="form-group half-width">
          <label for="generated-domain"> IP6.ARPA 域名生成结果</label>
          <textarea id="generated-domain" readonly rows="4" placeholder="生成结果将显示在这里"></textarea>
        </div>
      </div>
    </div>    
    
    <div class="info-box">
      <h2>API GET 调用示例</h2>
      <p style="font-size: 14px; margin-bottom: 10px;">证书颁发机构 (ca) 支持：<code>ssl_com</code>、<code>lets_encrypt</code>、<code>google</code>、<code>sectigo</code>。<strong>注意：ip6.arpa 域名通常仅支持 <code>ssl_com</code>。</strong></p>
      <pre>https://worker地址/?zoneId=...&email=...&apikey=...&enabled=true&ca=ssl_com</pre>
    </div>
    
    <div class="footer">
      Copyright 2025 <span class="separator">|</span>
      <a href="https://github.com/PAICNI/IP6.ARPA_SSL/blob/main/IP6.ARPA_SSL_Workers.js" target="_blank"> GitHub项目源代码</a> <span class="separator">|</span>
      <a href="https://t.me/SZ_PAI" target="_blank"> Telegram群组</a>
      <p style="margin-top: 10px;">此站点中api key仅用于请求,不记录,如有疑问,可自行在cloudflare workers部署</p>
    </div>
  </div>

  <script>
    // ==================== IPv6 反向域名生成逻辑 ====================
    function expandIpv6(ipv6) {
      ipv6 = ipv6.toLowerCase();
      if (!ipv6.includes('::')) {
        return ipv6.split(':').map(b => b.padStart(4, '0')).join('');
      }
      const [left, right] = ipv6.split('::');
      const leftBlocks = left ? left.split(':').filter(Boolean) : [];
      const rightBlocks = right ? right.split(':').filter(Boolean) : [];
      const zeroCount = 8 - leftBlocks.length - rightBlocks.length;
      if (zeroCount < 0) throw new Error('IPv6 地址块过多，格式错误。');
      const zeroPadding = '0000'.repeat(zeroCount);
      return leftBlocks.map(b => b.padStart(4, '0')).join('') + zeroPadding + rightBlocks.map(b => b.padStart(4, '0')).join('');
    }

    function randomHex(len) {
      let res = '';
      const chars = '0123456789abcdef';
      for (let i = 0; i < len; i++) res += chars[Math.floor(Math.random() * 16)];
      return res;
    }

    function generateArpaRootDomain(cidr) {
      const [ip, prefixStr] = cidr.split('/');
      if (!ip || !prefixStr) throw new Error('CIDR 格式不正确，请使用 IP/前缀长度 格式。');
      const prefix = parseInt(prefixStr, 10);
      if (isNaN(prefix) || prefix < 0 || prefix > 128 || prefix % 4 !== 0) {
        throw new Error('前缀长度无效，必须是 4 的倍数 (例如: /32, /48, /64)。');
      }
      const fullHex = expandIpv6(ip.trim());
      const chars = prefix / 4;
      const network = fullHex.substring(0, chars);
      return network.split('').reverse().join('.') + '.ip6.arpa';
    }

    function generateRandomPrefixDomains(base) {
      const list = [base];
      for (let i = 0; i < 3; i++) {
        const len = Math.floor(Math.random() * 4) + 1;
        const prefix = randomHex(len).split('').join('.');
        list.push(prefix + '.' + base);
      }
      return list;
    }

    // ==================== DOM 工具函数 ====================
    function loadSavedCidr() {
      const saved = localStorage.getItem('ipv6Cidr');
      if (saved) document.getElementById('ipv6-cidr').value = saved;
    }

    function saveCidr(cidr) {
      localStorage.setItem('ipv6Cidr', cidr.trim());
    }

    function showError(id, msg) {
      const el = document.getElementById(id);
      const err = document.getElementById(id + '-error');
      el.classList.add('error');
      err.textContent = msg;
      err.style.display = 'block';
      if (!document.querySelector('.error:focus')) el.focus();
    }

    function resetErrors() {
      document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    }

    function showResult(msg, type) {
      const el = document.getElementById('result-message');
      el.textContent = msg;
      el.className = 'result ' + (type === 'success' ? 'success' : 'error-result');
      el.style.display = 'block';
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async function copyText(text) {
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(text); return true; }
        catch (e) { console.warn('复制失败:', e); }
      }
      return false;
    }

    // ==================== 主题切换逻辑 ====================
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    function applyTheme(isDark) {
      body.dataset.theme = isDark ? 'dark' : 'light';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // 初始化：优先使用 localStorage，若无则默认深色
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || !savedTheme;
    applyTheme(isDark);

    // 切换事件
    themeToggle.addEventListener('click', () => {
      const current = body.dataset.theme;
      applyTheme(current === 'light');
    });

    // ==================== 页面初始化与事件绑定 ====================
    document.addEventListener('DOMContentLoaded', () => {
      loadSavedCidr();

      document.getElementById('ipv6-cidr').addEventListener('input', e => saveCidr(e.target.value));

      // 生成域名
      document.getElementById('generate-btn').addEventListener('click', async () => {
        resetErrors();
        const input = document.getElementById('ipv6-cidr').value.trim();
        const output = document.getElementById('generated-domain');
        output.value = '';
        if (!input) return showError('ipv6-cidr', '请输入 IPv6 CIDR 地址。');

        try {
          const root = generateArpaRootDomain(input);
          const domains = generateRandomPrefixDomains(root);
          const text = domains.join('\\n');
          output.value = text;
          const copied = await copyText(text);
          showResult(\`IP6.ARPA 域名生成成功！共生成 4 个域名。\${copied ? '所有域名已自动复制到剪贴板。' : '自动复制失败，请手动复制。'}\`, 'success');
        } catch (e) {
          showError('ipv6-cidr', e.message || '生成失败');
          showResult('生成失败: ' + (e.message || '未知错误'), 'error');
        }
      });

      // 提交 SSL 配置
      document.getElementById('ssl-form').addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const zoneId = document.getElementById('zone-id').value.trim();
        const apikey = document.getElementById('api-key').value.trim();
        const ca = document.getElementById('ca-select').value;

        resetErrors();
        let valid = true;
        if (!email) { showError('email', '请输入有效的邮箱地址'); valid = false; }
        if (!zoneId) { showError('zone-id', '请输入区域ID'); valid = false; }
        if (!apikey) { showError('api-key', '请输入API密钥'); valid = false; }
        if (!valid) return;

        const spinner = document.getElementById('spinner');
        const btnText = document.getElementById('btn-text');
        const submitBtn = document.getElementById('submit-btn');
        spinner.style.display = 'block';
        btnText.textContent = '添加中...';
        submitBtn.disabled = true;

        try {
          const res = await fetch('/api/add-ssl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, zoneId, apikey, enabled: true, ca })
          });
          const data = await res.json();

          if (data.success) {
            showResult('证书添加成功, 请10分钟后在Cloudflare该域名里检查SSL/TLS证书', 'success');
          } else {
            let msg = '添加证书失败';
            if (data.errors?.[0]?.message) msg += ': ' + data.errors[0].message;
            else if (data.errors) msg += ': ' + JSON.stringify(data.errors);
            showResult(msg, 'error');
          }
        } catch (err) {
          showResult('请求失败，请检查网络连接', 'error');
          console.error(err);
        } finally {
          spinner.style.display = 'none';
          btnText.textContent = '添加SSL证书';
          submitBtn.disabled = false;
        }
      });
    });
  </script>
</body>
</html>`;
}