# 高分二号水质参数遥感反演系统

## 项目简介

本项目是一个基于高分二号（GF-2）卫星影像的河湖水质监测系统，通过遥感技术结合无人机数据进行水质参数反演。系统主要使用高分二号影像的0、1、2、3四个波段数据，通过波段运算操作计算汉江流域的NDWI、TP、TN、DO等水质参数，并结合ArcGIS、ENVI等软件进行后期处理。

<div align="center">
<table>
  <tr>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/assets/145452598/4af2f7c8-10a7-4df5-aef4-acc86c1b3f8a" alt="水质参数图1" width="300"/>
      <br><strong>各年份遥感影像</strong>
    </td>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/assets/145452598/ec10f738-7c55-44b3-b09c-c92c75c90288" alt="水质参数图2" width="300"/>
      <br><strong>水质参数图</strong>
    </td>
  </tr>
</table>
  <table>
  <tr>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/blob/main/GF2-systemDemo.png" alt="水质参数图1" width="600"/>
      <br><strong>遥感影像平台</strong>
    </td>
  </tr>
</table>
</div>

## 主要功能

### 1. 水体提取
- 基于NDWI（归一化差异水体指数）进行水体提取
- 支持阈值自动调整和形态学处理
- 生成水体二值化掩膜图像

### 2. 水质参数反演
- **化学需氧量（COD）**: `(R / G - 0.5777) / 0.007`
- **总磷（TP）**: `4.9703 * (R / G)^11.618`
- **总氮（TN）**: `2.2632 * (NIR / G)^2 + 1.1392 * (NIR / G) + 0.7451`
- **氨氮（NH3N）**: `4.519 * ((G - R) / (G + R))^2 - 2.1 * (G - R) / (G + R) + 0.47`
- **溶解氧（DO）**: `771.854 * (1 / R) - 1.476 * (R^2) / (B^2) + 6.435`

### 3. 营养状态评估
- **叶绿素a（Chla）**: `4.089 * (NIR / R)^2 - 0.746 * (NIR / R) + 29.7331`
- **总悬浮物（TSS）**: `119.62 * (R / G)^6.0823`
- **透明度（SD）**: `284.15 * TSS^(-0.67)`

### 4. 图像处理与分析
- 轮廓提取和河流识别
- 图像相似度计算（无人机与卫星影像对比）
- 线性拉伸和图像增强
- 栅格转矢量（Shapefile）功能

## Water-quality
###      主要使用的图像为：高分二号影像0、1、2、3共四个波段的数组数据
###      通过波段运算操作，运算了汉江流域的NDWI、TP、TN、DO等水质参数
###      再使用arcgis、envi等软件进行后期处理，属于无人机和遥感技术结合的河湖水质监测技术的软件制作

## 项目结构

```
GF-2-water-quality-parameter-main/
├── main.py                              # 主程序入口
├── Water.py                             # 水体提取模块
├── water_quality.py                     # 水质参数反演模块
├── contours.py                          # 轮廓提取和河流识别
├── buildshp.py                          # 栅格转矢量工具
├── ImageProcess.py                      # 图像相似度计算
├── ImageProcess_Guassion_Kmean_HSV.py   # 高斯滤波和K均值聚类
├── ImagePrcoess_ImageEnd_corr_coef.py   # 相关系数计算
├── demo1similarity.py                   # 相似度计算示例
├── LinearStretch.py                     # 线性拉伸处理
├── fix_image.py                         # 图像修复工具
├── __init__.py                          # Python包初始化
├── 清水行动.pdf                         # 项目说明文档
└── README.md                            # 项目说明文档
```

## 核心模块说明

### Water.py - 水体提取模块
- `water_extract_NDWI()`: 基于NDWI指数提取水体
- `go_fast_NDWI()`: 使用Numba加速的二值化处理
- `writetif()`: 保存带地理信息的TIFF文件

### water_quality.py - 水质参数反演模块
- `water_quality_test()`: 主要的水质参数计算函数
- `go_fast_waterquality_all()`: 水质等级划分（1-6级）
- `go_fast_TLI()`: 营养状态指数计算
- `go_fast_NDBWI()`: 黑臭水体指数计算

### contours.py - 轮廓处理模块
- `draw_contours()`: 绘制水体轮廓
- `river_end()`: 河流识别和提取
- `cnt_area()`: 计算轮廓面积
- `cnt_length()`: 计算轮廓周长

### buildshp.py - 矢量转换模块
- `raster2shp()`: 栅格转Shapefile
- `raster2vector()`: 栅格转矢量（支持多波段）

## 蒿坪镇遥感影像分析平台 - 技术实现文档

### 项目概述

本项目是一个基于React + OpenLayers的遥感影像分析平台，专门用于显示和分析蒿坪镇的遥感数据。项目采用GeoScene Enterprise在线服务，实现了高精度的遥感影像瓦片显示功能。

## 1. 前端页面设计分析

### 1.1 整体架构设计

#### 组件层次结构
```
App.tsx
└── HaopingAnalysis.tsx (主容器组件)
    └── GeoScenePreciseLayer.tsx (核心地图组件)
```

#### 设计理念
- **单一职责原则**：每个组件只负责特定功能
- **简化界面**：移除复杂的标签页系统，专注于核心功能
- **响应式布局**：使用Flexbox实现自适应布局

### 1.2 页面布局设计

#### 主容器设计 (`HaopingAnalysis.tsx`)
```typescript
// 极简化的主容器，直接渲染核心地图组件
const HaopingAnalysis: React.FC = () => {
  return (
    <div className="haoping-analysis">
      <div className="map-wrapper">
        <GeoScenePreciseLayer />
      </div>
    </div>
  )
}
```

**设计特点：**
- 移除了所有不必要的状态管理
- 移除了复杂的标签页切换逻辑
- 专注于单一的地图显示功能

#### 地图容器设计 (`GeoScenePreciseLayer.tsx`)
```typescript
// 采用垂直布局，地图在上，控制面板在下
<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
  {/* 地图容器 - 占据主要空间 */}
  <div ref={mapRef} style={{ flex: 1, ... }} />
  
  {/* 控制按钮区域 - 固定高度，位于底部 */}
  <div style={{ minHeight: '60px', backgroundColor: '#fafafa' }}>
    {/* 控制按钮 */}
  </div>
</div>
```

**设计特点：**
- **地图优先**：地图占据主要视觉空间
- **控制面板下置**：将控制按钮放置在地图下方，不遮挡地图内容
- **固定高度控制区**：确保控制面板始终可见且不占用过多空间

### 1.3 按钮设计分析

#### 按钮布局设计
```typescript
// 控制按钮区域样式
<div style={{ 
  padding: '10px', 
  borderTop: '1px solid #e8e8e8', 
  display: 'flex', 
  gap: '10px', 
  alignItems: 'center',
  flexWrap: 'wrap',
  backgroundColor: '#fafafa',
  minHeight: '60px'
}}>
```

**设计特点：**
- **水平排列**：使用`display: flex`实现按钮水平排列
- **自适应换行**：`flexWrap: 'wrap'`确保小屏幕时按钮自动换行
- **统一间距**：`gap: '10px'`确保按钮间距一致
- **视觉分离**：`borderTop`和背景色区分控制区域和地图区域

#### 按钮功能分类

**1. 底图控制**
```typescript
<Select value={baseMapType} onChange={switchBaseMap} style={{ width: 120 }}>
  {Object.keys(BASE_MAPS).map((key) => (
    <Option key={key} value={key}>
      {BASE_MAPS[key as keyof typeof BASE_MAPS].name}
    </Option>
  ))}
</Select>
```

**2. 服务测试**
```typescript
<Button onClick={testServiceConnection} loading={isLoading} size="small">
  测试服务连接
</Button>
```

**3. 数据加载**
```typescript
<Button
  type="primary"
  onClick={loadPreciseTileLayer}
  loading={isLoading}
  size="small"
  style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
>
  渲染修复加载遥感数据
</Button>
```

**4. 图层管理**
```typescript
<Button onClick={clearRemoteSensingLayer} size="small">
  清除遥感图层
</Button>
<Button onClick={restoreBaseMap} size="small">
  恢复底图
</Button>
```

**5. 视图控制**
```typescript
<Button onClick={resetToServiceExtent} size="small">
  重置到服务范围
</Button>
```

#### 按钮样式设计原则
- **尺寸统一**：所有按钮使用`size="small"`保持一致性
- **颜色区分**：不同类型按钮使用不同颜色（主要、次要、警告等）
- **状态反馈**：使用`loading`属性提供加载状态反馈
- **功能分组**：通过间距和颜色进行功能分组

### 1.4 地图调用设计

#### OpenLayers地图初始化
```typescript
const map = new Map({
  target: mapRef.current,
  layers: [baseLayer],
  view: new View({
    center: fromLonLat([
      (PRECISE_CONFIG.geoExtent.xmin + PRECISE_CONFIG.geoExtent.xmax) / 2,
      (PRECISE_CONFIG.geoExtent.ymin + PRECISE_CONFIG.geoExtent.ymax) / 2
    ]),
    zoom: 12,
    minZoom: PRECISE_CONFIG.zoomLevels.minLOD,
    maxZoom: PRECISE_CONFIG.zoomLevels.maxLOD,
    projection: 'EPSG:3857',
    extent: [
      PRECISE_CONFIG.webMercatorExtent.xmin,
      PRECISE_CONFIG.webMercatorExtent.ymin,
      PRECISE_CONFIG.webMercatorExtent.xmax,
      PRECISE_CONFIG.webMercatorExtent.ymax
    ]
  })
});
```

**设计特点：**
- **精确坐标**：使用服务元数据中的精确地理范围
- **投影统一**：统一使用Web Mercator投影(EPSG:3857)
- **缩放限制**：根据服务能力设置最小/最大缩放级别
- **范围限制**：设置地图显示范围，防止用户浏览到无关区域

#### 瓦片图层设计
```typescript
const tileLayer = new TileLayer({
  source: new XYZ({
    url: PRECISE_CONFIG.tileUrl,
    crossOrigin: 'anonymous',
    tileGrid: tileGrid, // 使用精确的瓦片网格
  }),
  opacity: 1.0,
  visible: true,
  zIndex: 1000,
  preload: 0,
  useInterimTilesOnError: false
});
```

**设计特点：**
- **精确瓦片网格**：使用服务元数据中的精确分辨率配置
- **跨域处理**：设置`crossOrigin: 'anonymous'`处理跨域问题
- **渲染优化**：设置`zIndex`确保图层优先级，`preload: 0`减少不必要的预加载

## 2. GeoScene Enterprise服务集成分析

### 2.1 服务配置设计

#### 服务URL配置
```typescript
const PRECISE_CONFIG = {
  // 服务URL配置
  tileServiceUrl: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer',
  tileUrl: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer/tile/{z}/{y}/{x}',
  jsapiUrl: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer?f=jsapi',
  
  // 精确的地理范围 (来自服务元数据)
  geoExtent: {
    xmin: 108.556089991995194,
    ymin: 32.478813272518501,
    xmax: 108.771856340087851,
    ymax: 32.647048539145018
  },
  
  // Web Mercator范围 (来自服务元数据)
  webMercatorExtent: {
    xmin: 12084408.6604176853,
    ymin: 3826327.72376103653,
    xmax: 12108427.6604176853,
    ymax: 3848548.72376103653
  }
};
```

**配置特点：**
- **多端点支持**：提供REST服务、瓦片服务、JSAPI等多种访问方式
- **精确坐标**：使用服务元数据中的精确地理范围
- **投影转换**：同时提供经纬度和Web Mercator坐标

#### 瓦片网格配置
```typescript
tileGrid: {
  origin: [-20037508.342787001, 20037508.342787001],
  tileSize: [256, 256],
  resolutions: [
    156543.03392799999,    // Level 0
    78271.516963999893,    // Level 1
    // ... 24个分辨率级别
    0.018661383852976041   // Level 23
  ]
}
```

**配置特点：**
- **标准瓦片规格**：256x256像素瓦片
- **24级LOD**：支持从全球到米级精度的24个缩放级别
- **标准原点**：使用Web Mercator标准原点

### 2.2 服务连接测试设计

#### 多端点测试策略
```typescript
const testServiceConnection = async () => {
  const testUrls = [
    PRECISE_CONFIG.tileServiceUrl,
    PRECISE_CONFIG.jsapiUrl,
    `${PRECISE_CONFIG.tileServiceUrl}?f=json`
  ];

  const results = [];
  for (const url of testUrls) {
    try {
      const start = Date.now();
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      const end = Date.now();
      
      results.push({
        url: url.split('/').pop(),
        status: response.status,
        time: end - start,
        ok: response.ok
      });
    } catch (error) {
      results.push({
        url: url.split('/').pop(),
        status: 'ERROR',
        time: 0,
        ok: false
      });
    }
  }
};
```

**测试特点：**
- **多端点验证**：同时测试REST服务、JSAPI、JSON元数据端点
- **性能监控**：记录每个端点的响应时间
- **错误处理**：捕获并记录连接错误
- **用户反馈**：通过Ant Design的message组件提供测试结果反馈

#### 瓦片数据测试
```typescript
// 先手动测试一个瓦片URL
const testTileUrl = PRECISE_CONFIG.tileUrl
  .replace('{z}', '12')
  .replace('{x}', '3285')
  .replace('{y}', '1654');

try {
  const testResponse = await fetch(testTileUrl);
  console.log('📊 瓦片响应状态:', testResponse.status, testResponse.statusText);
  console.log('📊 瓦片响应头:', Object.fromEntries(testResponse.headers.entries()));
  console.log('📊 瓦片内容长度:', testResponse.headers.get('content-length'));
  console.log('📊 瓦片内容类型:', testResponse.headers.get('content-type'));
} catch (testError) {
  console.error('❌ 瓦片测试失败:', testError);
}
```

**测试特点：**
- **具体瓦片测试**：测试特定坐标的瓦片是否可访问
- **响应头分析**：检查瓦片的内容类型和大小
- **调试信息**：提供详细的调试日志

### 2.3 代码调整策略

#### 1. 投影系统调整
```typescript
// 统一使用Web Mercator投影
projection: 'EPSG:3857'

// 坐标转换
center: fromLonLat([
  (PRECISE_CONFIG.geoExtent.xmin + PRECISE_CONFIG.geoExtent.xmax) / 2,
  (PRECISE_CONFIG.geoExtent.ymin + PRECISE_CONFIG.geoExtent.ymax) / 2
])
```

#### 2. 瓦片网格调整
```typescript
const grid = new TileGrid({
  origin: PRECISE_CONFIG.tileGrid.origin,
  resolutions: PRECISE_CONFIG.tileGrid.resolutions,
  tileSize: PRECISE_CONFIG.tileGrid.tileSize,
  // 移除extent，让TileGrid在全局范围内生效
});
```

#### 3. 渲染优化调整
```typescript
const tileLayer = new TileLayer({
  source: new XYZ({
    url: PRECISE_CONFIG.tileUrl,
    crossOrigin: 'anonymous',
    tileGrid: tileGrid,
  }),
  opacity: 1.0,
  visible: true,
  zIndex: 1000,
  preload: 0,
  useInterimTilesOnError: false
});
```

#### 4. 无底图模式调整
```typescript
// 清除所有现有图层
const currentLayers = mapInstanceRef.current.getLayers().getArray();
currentLayers.forEach(layer => {
  mapInstanceRef.current!.removeLayer(layer);
});

// 设置黑色背景
const mapElement = mapInstanceRef.current.getTargetElement();
if (mapElement) {
  (mapElement as HTMLElement).style.backgroundColor = '#000000';
}
```

## 3. 像素值获取技术分析

### 3.1 瓦片服务 vs 矢量服务对比

#### 瓦片服务特点
- **数据格式**：预渲染的图片瓦片（PNG/JPEG）
- **数据访问**：只能获取像素颜色值，无法直接获取原始数据值
- **性能优势**：加载速度快，渲染效率高
- **存储方式**：静态文件，按需加载

#### 矢量服务特点
- **数据格式**：原始地理数据（GeoJSON/Shapefile等）
- **数据访问**：可以获取完整的属性信息和几何信息
- **性能劣势**：需要实时处理，加载速度相对较慢
- **存储方式**：数据库存储，动态查询

### 3.2 瓦片服务获取像素值的可能性分析

#### 技术可行性
**✅ 可以实现，但有限制：**

1. **Canvas像素读取**
```typescript
// 理论实现方式
const getPixelValue = (x: number, y: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(x, y, 1, 1);
    const pixel = imageData.data; // [R, G, B, A]
    console.log('像素值:', pixel);
  };
  
  img.src = tileUrl;
};
```

2. **OpenLayers像素查询**
```typescript
// 使用OpenLayers的像素查询功能
map.on('click', (event) => {
  const pixel = event.pixel;
  const coordinate = map.getCoordinateFromPixel(pixel);
  
  // 获取该位置的瓦片
  const tile = map.getTileAtPixel(pixel);
  if (tile) {
    // 读取瓦片像素值
    const canvas = tile.getImage();
    // ... 像素值读取逻辑
  }
});
```

#### 实际限制

**❌ 主要限制：**

1. **数据精度损失**
   - 瓦片是预渲染的图片，原始数据值已经丢失
   - 只能获取RGB颜色值，无法获取原始遥感数据值
   - 颜色值需要反向映射到数据值，精度有限

2. **坐标转换复杂性**
   - 需要将地理坐标转换为瓦片坐标
   - 需要将瓦片坐标转换为像素坐标
   - 多级瓦片拼接时的坐标计算复杂

3. **数据完整性**
   - 瓦片边界处的数据可能不完整
   - 不同缩放级别的数据精度不同
   - 瓦片压缩可能影响数据精度

### 3.3 推荐解决方案

#### 方案1：使用GeoScene REST服务获取像素值
```typescript
// 通过REST服务查询特定坐标的数据值
const getPixelValueFromREST = async (x: number, y: number) => {
  const queryUrl = `${PRECISE_CONFIG.tileServiceUrl}/0/query`;
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    geometry: `${x},${y}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false'
  });
  
  const response = await fetch(`${queryUrl}?${params}`);
  const data = await response.json();
  return data.features[0]?.attributes;
};
```

#### 方案2：发布WMS服务获取像素值
```typescript
// 通过WMS GetFeatureInfo获取像素值
const getPixelValueFromWMS = async (x: number, y: number) => {
  const wmsUrl = `${PRECISE_CONFIG.tileServiceUrl}/wms`;
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: 'GF2_PMS1_E108_ProjectRaster',
    QUERY_LAYERS: 'GF2_PMS1_E108_ProjectRaster',
    CRS: 'EPSG:3857',
    I: Math.round(x),
    J: Math.round(y),
    WIDTH: '256',
    HEIGHT: '256',
    BBOX: `${x-128},${y-128},${x+128},${y+128}`,
    FORMAT: 'image/png',
    INFO_FORMAT: 'application/json'
  });
  
  const response = await fetch(`${wmsUrl}?${params}`);
  const data = await response.json();
  return data;
};
```

#### 方案3：使用GeoScene Pro发布矢量服务
```typescript
// 发布为Feature Service，可以获取完整属性
const getPixelValueFromFeatureService = async (x: number, y: number) => {
  const featureUrl = `${PRECISE_CONFIG.tileServiceUrl}/0/query`;
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    geometry: `${x},${y}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true'
  });
  
  const response = await fetch(`${featureUrl}?${params}`);
  const data = await response.json();
  return data.features[0];
};
```

### 3.4 结论与建议

#### 瓦片服务获取像素值的可行性
- **技术上可行**：可以通过Canvas API读取像素颜色值
- **精度有限**：只能获取RGB值，无法获取原始数据值
- **实现复杂**：需要处理坐标转换、瓦片拼接等复杂逻辑
- **不推荐**：对于专业遥感分析，精度和可靠性不足

#### 推荐方案
1. **最佳方案**：使用GeoScene Pro发布WMS或Feature Service
2. **次优方案**：通过REST服务查询特定坐标的数据
3. **备选方案**：结合瓦片显示和矢量查询，提供混合交互体验

#### 实现建议
```typescript
// 混合交互实现
const handleMapClick = (event: any) => {
  const coordinate = event.coordinate;
  
  // 1. 显示瓦片数据（用于可视化）
  // 2. 查询REST服务获取精确数据值（用于分析）
  // 3. 结合两种方式提供完整的用户体验
};
```

## 4. 项目技术总结

### 4.1 技术栈
- **前端框架**：React 18 + TypeScript
- **地图库**：OpenLayers 7
- **UI组件**：Ant Design
- **构建工具**：Vite
- **服务集成**：GeoScene Enterprise REST API

### 4.2 核心特性
- **精确坐标系统**：基于服务元数据的精确地理范围
- **多级瓦片支持**：24级LOD分辨率支持
- **跨域处理**：完善的CORS和SSL证书处理
- **响应式设计**：适配不同屏幕尺寸
- **无底图模式**：专注于遥感数据显示

### 4.3 性能优化
- **瓦片预加载控制**：`preload: 0`减少不必要的预加载
- **渲染优化**：`zIndex`控制图层优先级
- **内存管理**：及时清理地图实例和事件监听器
- **错误处理**：完善的错误捕获和用户反馈机制

### 4.4 扩展性设计
- **模块化架构**：组件职责清晰，易于维护
- **配置化设计**：服务配置集中管理，易于调整
- **事件驱动**：基于事件的地图交互，易于扩展
- **类型安全**：TypeScript提供完整的类型检查

## 安装依赖

```bash
pip install numpy
pip install opencv-python
pip install gdal
pip install numba
pip install pillow
```

## 使用方法

### 1. 基本使用
```python
from Water import water_extract_NDWI
from contours import draw_contours, river_end
from buildshp import raster2shp, raster2vector
from water_quality import water_quality_test

# 水体提取
water_extract_NDWI('input_image.tif')

# 轮廓提取
draw_contours('3bd_gf7.tif', 'NDWI_mask.jpg', 'NDWI_water.jpg', 
              'NDWI_river.jpg', 'NDWI_end.jpg', 'NDWI_river_end.jpg')

# 栅格转矢量
raster2shp('NDWI_mask1.tif', 'NDWI.shp')

# 水质反演
water_quality_test("input_image.tif")
```

### 2. 运行主程序
```bash
python main.py
```

## 输出结果

程序运行后会生成以下文件：
- `NDWI.tif`: NDWI指数图像
- `NDWI_mask1.tif`: 水体二值化掩膜
- `COD1.tif`, `TP1.tif`, `TN1.tif`, `NH3N1.tif`, `DO1.tif`: 各水质参数图像
- `chla1.tif`, `TSS1.tif`, `sd1.tif`: 营养状态参数图像
- `watergrades_all1.tif`: 综合水质等级图像
- `NDWI.shp`: 水体矢量文件

## 技术特点

1. **高性能计算**: 使用Numba JIT编译加速循环计算
2. **地理信息保持**: 所有输出图像保持原始地理坐标和投影信息
3. **多算法融合**: 结合多种图像处理算法提高精度
4. **模块化设计**: 各功能模块独立，便于维护和扩展

## 应用场景

- 河湖水质监测
- 环境遥感监测
- 水资源管理
- 生态保护评估
- 科研教学

## 注意事项

1. 输入图像需要包含4个波段（B、G、R、NIR）
2. 建议使用经过辐射定标和大气校正的影像
3. 不同地区可能需要调整NDWI阈值参数
4. 水质参数反演模型基于特定研究区域建立，使用时需验证适用性

## 参考文献

- 广州市黑臭水体评价模型构建及污染溯源研究
- 基于实测数据的鄱阳湖总氮、总磷遥感反演模型研究
- 基于Landsat-8 OLI影像的术河临沂段氮磷污染物反演
- 平原水库微污染水溶解氧含量模型反演与验证
- 基于自动监测和Sentinel-2影像的钦州湾溶解氧反演模型研究
- 基于GF-1影像的洞庭湖区水体水质遥感监测

## 作者信息

- 作者：10208
- 项目：PycharmDemo
- 开发环境：PyCharm
- 开发时间：2023年3月

## 许可证

本项目仅供学习和研究使用。

---

**文档版本**：v1.0  
**最后更新**：2025年9月  
**维护人员**：项目开发团队



# 高分二号水质参数遥感反演系统

## 项目简介

本项目是一个基于高分二号（GF-2）卫星影像的河湖水质监测系统，通过遥感技术结合无人机数据进行水质参数反演。系统主要使用高分二号影像的0、1、2、3四个波段数据，通过波段运算操作计算汉江流域的NDWI、TP、TN、DO等水质参数，并结合ArcGIS、ENVI等软件进行后期处理。

<div align="center">
<table>
  <tr>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/assets/145452598/4af2f7c8-10a7-4df5-aef4-acc86c1b3f8a" alt="水质参数图1" width="300"/>
      <br><strong>各年份遥感影像</strong>
    </td>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/assets/145452598/ec10f738-7c55-44b3-b09c-c92c75c90288" alt="水质参数图2" width="300"/>
      <br><strong>水质参数图</strong>
    </td>
  </tr>
</table>
  <table>
  <tr>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/blob/main/GF2-systemDemo.png" alt="水质参数图1" width="600"/>
      <br><strong>遥感影像平台</strong>
    </td>
  </tr>
</table>
</div>

## 主要功能

### 1. 水体提取
- 基于NDWI（归一化差异水体指数）进行水体提取
- 支持阈值自动调整和形态学处理
- 生成水体二值化掩膜图像

### 2. 水质参数反演
- **化学需氧量（COD）**: `(R / G - 0.5777) / 0.007`
- **总磷（TP）**: `4.9703 * (R / G)^11.618`
- **总氮（TN）**: `2.2632 * (NIR / G)^2 + 1.1392 * (NIR / G) + 0.7451`
- **氨氮（NH3N）**: `4.519 * ((G - R) / (G + R))^2 - 2.1 * (G - R) / (G + R) + 0.47`
- **溶解氧（DO）**: `771.854 * (1 / R) - 1.476 * (R^2) / (B^2) + 6.435`

### 3. 营养状态评估
- **叶绿素a（Chla）**: `4.089 * (NIR / R)^2 - 0.746 * (NIR / R) + 29.7331`
- **总悬浮物（TSS）**: `119.62 * (R / G)^6.0823`
- **透明度（SD）**: `284.15 * TSS^(-0.67)`

### 4. 图像处理与分析
- 轮廓提取和河流识别
- 图像相似度计算（无人机与卫星影像对比）
- 线性拉伸和图像增强
- 栅格转矢量（Shapefile）功能

## Water-quality
###      主要使用的图像为：高分二号影像0、1、2、3共四个波段的数组数据
###      通过波段运算操作，运算了汉江流域的NDWI、TP、TN、DO等水质参数
###      再使用arcgis、envi等软件进行后期处理，属于无人机和遥感技术结合的河湖水质监测技术的软件制作

## 项目结构

```
GF-2-water-quality-parameter-main/
├── main.py                              # 主程序入口
├── Water.py                             # 水体提取模块
├── water_quality.py                     # 水质参数反演模块
├── contours.py                          # 轮廓提取和河流识别
├── buildshp.py                          # 栅格转矢量工具
├── ImageProcess.py                      # 图像相似度计算
├── ImageProcess_Guassion_Kmean_HSV.py   # 高斯滤波和K均值聚类
├── ImagePrcoess_ImageEnd_corr_coef.py   # 相关系数计算
├── demo1similarity.py                   # 相似度计算示例
├── LinearStretch.py                     # 线性拉伸处理
├── fix_image.py                         # 图像修复工具
├── __init__.py                          # Python包初始化
├── 清水行动.pdf                         # 项目说明文档
└── README.md                            # 项目说明文档
```

## 核心模块说明

### Water.py - 水体提取模块
- `water_extract_NDWI()`: 基于NDWI指数提取水体
- `go_fast_NDWI()`: 使用Numba加速的二值化处理
- `writetif()`: 保存带地理信息的TIFF文件

### water_quality.py - 水质参数反演模块
- `water_quality_test()`: 主要的水质参数计算函数
- `go_fast_waterquality_all()`: 水质等级划分（1-6级）
- `go_fast_TLI()`: 营养状态指数计算
- `go_fast_NDBWI()`: 黑臭水体指数计算

### contours.py - 轮廓处理模块
- `draw_contours()`: 绘制水体轮廓
- `river_end()`: 河流识别和提取
- `cnt_area()`: 计算轮廓面积
- `cnt_length()`: 计算轮廓周长

### buildshp.py - 矢量转换模块
- `raster2shp()`: 栅格转Shapefile
- `raster2vector()`: 栅格转矢量（支持多波段）

## 安装依赖

```bash
pip install numpy
pip install opencv-python
pip install gdal
pip install numba
pip install pillow
```

## 使用方法

### 1. 基本使用
```python
from Water import water_extract_NDWI
from contours import draw_contours, river_end
from buildshp import raster2shp, raster2vector
from water_quality import water_quality_test

# 水体提取
water_extract_NDWI('input_image.tif')

# 轮廓提取
draw_contours('3bd_gf7.tif', 'NDWI_mask.jpg', 'NDWI_water.jpg', 
              'NDWI_river.jpg', 'NDWI_end.jpg', 'NDWI_river_end.jpg')

# 栅格转矢量
raster2shp('NDWI_mask1.tif', 'NDWI.shp')

# 水质反演
water_quality_test("input_image.tif")
```

### 2. 运行主程序
```bash
python main.py
```

## 输出结果

程序运行后会生成以下文件：
- `NDWI.tif`: NDWI指数图像
- `NDWI_mask1.tif`: 水体二值化掩膜
- `COD1.tif`, `TP1.tif`, `TN1.tif`, `NH3N1.tif`, `DO1.tif`: 各水质参数图像
- `chla1.tif`, `TSS1.tif`, `sd1.tif`: 营养状态参数图像
- `watergrades_all1.tif`: 综合水质等级图像
- `NDWI.shp`: 水体矢量文件

## 技术特点

1. **高性能计算**: 使用Numba JIT编译加速循环计算
2. **地理信息保持**: 所有输出图像保持原始地理坐标和投影信息
3. **多算法融合**: 结合多种图像处理算法提高精度
4. **模块化设计**: 各功能模块独立，便于维护和扩展

## 应用场景

- 河湖水质监测
- 环境遥感监测
- 水资源管理
- 生态保护评估
- 科研教学

## 注意事项

1. 输入图像需要包含4个波段（B、G、R、NIR）
2. 建议使用经过辐射定标和大气校正的影像
3. 不同地区可能需要调整NDWI阈值参数
4. 水质参数反演模型基于特定研究区域建立，使用时需验证适用性

## 参考文献

- 广州市黑臭水体评价模型构建及污染溯源研究
- 基于实测数据的鄱阳湖总氮、总磷遥感反演模型研究
- 基于Landsat-8 OLI影像的术河临沂段氮磷污染物反演
- 平原水库微污染水溶解氧含量模型反演与验证
- 基于自动监测和Sentinel-2影像的钦州湾溶解氧反演模型研究
- 基于GF-1影像的洞庭湖区水体水质遥感监测

## 作者信息

- 作者：10208
- 项目：PycharmDemo
- 开发环境：PyCharm
- 开发时间：2023年3月

## 许可证

本项目仅供学习和研究使用。

---
