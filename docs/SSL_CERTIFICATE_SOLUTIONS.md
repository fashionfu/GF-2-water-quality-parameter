# GeoScene Enterprise SSL 证书问题解决方案

## 问题描述

GeoScene Enterprise 服务 (`https://geoscence51.geoscene.cn/server/rest/services/Hosted/GF2_data/MapServer`) 存在 SSL 证书验证问题，导致浏览器报告 `net::ERR_CERT_AUTHORITY_INVALID` 错误。

## 根本原因

1. **SSL 证书无效**: 服务器使用的 SSL 证书可能是自签名证书或证书颁发机构不被浏览器信任
2. **证书过期**: SSL 证书可能已过期
3. **域名不匹配**: 证书中的域名与实际访问的域名不匹配

## 解决方案

### 1. 浏览器级别解决方案 (推荐)

#### Chrome/Edge 浏览器:
1. 直接访问服务 URL: `https://geoscence51.geoscene.cn/server/rest/services`
2. 浏览器会显示"您的连接不是私密连接"警告
3. 点击"高级"
4. 点击"继续前往 geoscence51.geoscene.cn (不安全)"
5. 这会将证书添加到浏览器的例外列表

#### Firefox 浏览器:
1. 访问服务 URL
2. 点击"高级"
3. 点击"接受风险并继续"

### 2. 代码级别解决方案

我们在代码中实现了以下策略:

#### A. 使用 no-cors 模式进行连接测试
```javascript
const response = await fetch(url, {
  method: 'GET',
  mode: 'no-cors',
  cache: 'no-cache'
});
```

#### B. 错误处理和重试机制
```javascript
tileLoadFunction: (tile, src) => {
  const img = tile.getImage();
  let retryCount = 0;
  const maxRetries = 2;
  
  const loadTile = () => {
    img.onerror = (error) => {
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => loadTile(), 1000 * retryCount);
      }
    };
    img.src = src;
  };
  loadTile();
}
```

### 3. 网络级别解决方案

#### A. 使用代理服务器
创建一个代理服务器来转发请求:

```javascript
// proxy-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/geoscene-proxy', createProxyMiddleware({
  target: 'https://geoscence51.geoscene.cn',
  changeOrigin: true,
  pathRewrite: {
    '^/geoscene-proxy': ''
  },
  secure: false // 忽略 SSL 证书错误
}));

app.listen(8080);
```

#### B. 修改瓦片 URL
```javascript
const proxyUrl = 'http://localhost:8080/geoscene-proxy/server/rest/services/Hosted/GF2_data/MapServer/tile/{z}/{y}/{x}';
```

### 4. 服务器级别解决方案 (需要服务器管理员权限)

1. **更新 SSL 证书**: 安装有效的 SSL 证书
2. **配置 CORS**: 添加适当的 CORS 头
3. **启用 HTTPS 重定向**: 确保所有请求都通过 HTTPS

## 当前实现状态

### GeoSceneOnlineLayer_Fixed.tsx 特性:

1. **智能连接测试**: 使用 no-cors 模式测试服务可用性
2. **详细错误日志**: 提供详细的瓦片加载状态信息
3. **用户友好提示**: 在界面上显示 SSL 证书问题的解决建议
4. **正确的投影配置**: 使用标准 Web Mercator 投影
5. **适当的缩放限制**: 限制在服务支持的缩放级别 (6-17)

### 使用建议:

1. **首先测试连接**: 点击"测试服务连接"按钮
2. **手动接受证书**: 如果连接失败，请在浏览器中手动访问服务 URL 并接受证书
3. **监控控制台**: 查看浏览器控制台了解详细的加载状态
4. **尝试不同格式**: 如果标准格式失败，尝试"备用格式"

## 技术细节

### 投影系统配置:
- **服务原始投影**: EPSG:32649 (UTM Zone 49N)
- **地图显示投影**: EPSG:3857 (Web Mercator)
- **坐标转换**: 自动处理经纬度到 Web Mercator 的转换

### 瓦片 URL 格式:
- **标准格式**: `tile/{z}/{y}/{x}`
- **备用格式**: `tile/{z}/{x}/{y}`

### 缩放级别:
- **服务支持**: Level 6-17
- **地图限制**: 对应 OpenLayers 缩放级别 6-17

## 故障排除

### 如果瓦片仍无法加载:

1. **检查网络连接**: 确保可以访问外网
2. **清除浏览器缓存**: 清除缓存和 Cookie
3. **尝试不同浏览器**: 某些浏览器对 SSL 证书更严格
4. **检查防火墙**: 确保防火墙没有阻止 HTTPS 连接
5. **联系服务提供方**: 报告 SSL 证书问题

### 常见错误信息:

- `net::ERR_CERT_AUTHORITY_INVALID`: SSL 证书无效
- `net::ERR_CERT_DATE_INVALID`: SSL 证书过期
- `net::ERR_CERT_COMMON_NAME_INVALID`: 证书域名不匹配
- `net::ERR_CONNECTION_REFUSED`: 服务器拒绝连接
- `CORS error`: 跨域资源共享被阻止

## 更新日志

- **2024-09-18**: 创建 GeoSceneOnlineLayer_Fixed.tsx，实现 SSL 证书问题的代码级解决方案
- **2024-09-18**: 添加详细的错误处理和用户提示
- **2024-09-18**: 实现正确的投影系统配置和坐标转换
