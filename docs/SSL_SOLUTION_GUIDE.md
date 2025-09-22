# GeoScene SSL 证书问题完整解决方案

## 🔍 问题根源分析

基于您提供的 Vue.js 代码分析，发现了关键差异：

### Vue.js 成功访问的关键因素：

1. **使用端口 6443**: `https://geoscence51.geoscene.cn:6443`
2. **不同的服务路径**: `/geoscene/services/` vs `/server/rest/services/`
3. **简化的连接测试**: 只测试服务根目录可访问性
4. **CORS 模式请求**: 使用 `mode: 'cors'` 和 `Accept: application/json` 头

## 🛠️ 解决方案实施

### 1. 更新的服务配置

```javascript
// 新增端口 6443 配置
gf2_2016_port6443: {
  name: '2016年GF-2影像 (端口6443)',
  url: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer/tile/{z}/{y}/{x}',
  description: '使用端口6443的 Web Mercator 瓦片服务 (与Vue代码相同)'
}
```

### 2. 多端点连接测试

```javascript
const testUrls = [
  'https://geoscence51.geoscene.cn:6443/geoscene/rest/services', // Vue 成功路径
  'https://geoscence51.geoscene.cn/server/rest/services',         // 原始路径
  'https://geoscence51.geoscene.cn:6443/geoscene/services'        // Vue WFS 路径
];
```

### 3. 改进的瓦片加载策略

- ✅ **智能重试**: 最多重试 3 次，递增延迟
- ✅ **超时处理**: 10 秒超时保护
- ✅ **HTTP 降级**: HTTPS 失败时尝试 HTTP
- ✅ **详细日志**: 完整的加载状态跟踪

## 🎯 使用指南

### 步骤 1: 访问应用
打开: http://localhost:3001

### 步骤 2: 选择正确的标签页
选择 **"GeoScene 修复版"**

### 步骤 3: 测试连接
1. 点击 **"测试服务连接"** 按钮
2. 查看控制台输出，确认哪些端点可用

### 步骤 4: 加载瓦片
1. **首选**: 点击 **"加载端口6443 (推荐)"** - 绿色按钮
2. **备选**: 如果失败，尝试其他按钮

### 步骤 5: SSL 证书处理（如需要）
如果仍有 SSL 问题：

1. **手动访问服务**:
   - 打开新标签页
   - 访问: `https://geoscence51.geoscene.cn:6443/geoscene/rest/services`
   - 点击 "高级" → "继续前往..."

2. **接受证书**:
   - 浏览器会记住您的选择
   - 返回应用重新尝试

## 🔧 技术细节

### 端口差异说明

| 端口 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 默认 (443) | `/server/rest/services/` | ❌ SSL问题 | 标准 GeoScene REST API |
| 6443 | `/geoscene/rest/services/` | ✅ 可能可用 | Vue.js 成功使用的配置 |
| 6443 | `/geoscene/services/` | ✅ WFS 服务 | Vue.js WFS 服务路径 |

### SSL 证书问题类型

1. **自签名证书**: 服务器使用内部证书
2. **证书过期**: SSL 证书已过有效期
3. **域名不匹配**: 证书域名与访问域名不符
4. **证书链不完整**: 中间证书缺失

### 浏览器处理方式

```javascript
// Vue.js 成功的请求方式
const response = await fetch(testUrl, {
  method: 'GET',
  headers: { 'Accept': 'application/json' },
  mode: 'cors', // 关键：使用 CORS 模式
  cache: 'no-cache'
});
```

## 📊 故障排除

### 常见错误和解决方案

#### 1. `net::ERR_CERT_AUTHORITY_INVALID`
- **原因**: SSL 证书无效
- **解决**: 手动访问服务 URL 并接受证书

#### 2. `net::ERR_CONNECTION_REFUSED`
- **原因**: 端口不可访问
- **解决**: 尝试不同端口 (6443 vs 默认)

#### 3. `CORS error`
- **原因**: 跨域请求被阻止
- **解决**: 使用正确的 headers 和 mode

#### 4. 瓦片加载超时
- **原因**: 网络延迟或服务器响应慢
- **解决**: 自动重试机制已实现

### 调试命令

在浏览器控制台中运行：

```javascript
// 测试端口 6443 连接
fetch('https://geoscence51.geoscene.cn:6443/geoscene/rest/services', {
  method: 'GET',
  headers: { 'Accept': 'application/json' }
}).then(r => console.log('✅ 连接成功:', r.status))
  .catch(e => console.error('❌ 连接失败:', e.message));

// 测试瓦片 URL
const testTileUrl = 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer/tile/12/3285/1654';
fetch(testTileUrl).then(r => console.log('瓦片可访问:', r.ok));
```

## 🚀 预期结果

使用端口 6443 配置后，您应该能够：

- ✅ 成功连接到 GeoScene 服务
- ✅ 加载蒿坪镇区域的遥感影像
- ✅ 看到正确地理位置的瓦片
- ✅ 获得更好的加载性能
- ✅ 减少 SSL 证书错误

## 📝 更新日志

- **2024-09-18**: 基于 Vue.js 成功经验更新配置
- **2024-09-18**: 添加端口 6443 支持
- **2024-09-18**: 实现多端点测试和智能重试
- **2024-09-18**: 改进瓦片加载错误处理
