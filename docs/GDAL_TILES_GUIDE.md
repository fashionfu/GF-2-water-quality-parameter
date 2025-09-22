# GDAL瓦片方案使用指南

## 概述

本方案使用GDAL将高分辨率遥感影像切分为Web瓦片，然后在OpenLayers中加载显示。这种方法比直接加载GeoTIFF文件更高效、更稳定。

## 文件结构

```
haoping-analysis/
├── scripts/
│   ├── gdal_tile_generator.py    # GDAL切片脚本
│   ├── tile_server.py            # 本地瓦片服务器
│   └── generate_tiles.bat        # Windows批处理脚本
├── src/
│   └── components/
│       ├── TileLayer.tsx         # 瓦片图层组件
│       └── TileLayer.css         # 瓦片图层样式
└── public/
    └── tiles/                    # 瓦片输出目录
        ├── 2003/                 # 2003年瓦片
        ├── 2013/                 # 2013年瓦片
        └── 2016/                 # 2016年瓦片
```

## 使用步骤

### 第一步：安装GDAL

#### 方法1：使用conda（推荐）
```bash
conda install gdal
```

#### 方法2：从官网下载
1. 访问 https://gisinternals.com/development.php
2. 下载适合Windows的GDAL版本
3. 安装并配置环境变量

#### 方法3：使用pip
```bash
pip install gdal
```

### 第二步：生成瓦片

#### 方法1：使用批处理脚本（推荐）
```bash
# 双击运行
scripts/generate_tiles.bat
```

#### 方法2：手动执行Python脚本
```bash
# 生成2003年瓦片
python scripts/gdal_tile_generator.py "F:/01_Master/02_AnKangProject/各年份安康蒿坪融合数据/2003配准 融合/2003按shp裁剪/ETMMulti_Spot5_GS_subset.dat" -o "public/tiles/2003" -z "0-12" -p raster

# 生成2013年瓦片
python scripts/gdal_tile_generator.py "F:/01_Master/02_AnKangProject/各年份安康蒿坪融合数据/Processing13_end/Mosaicking_Msked.dat" -o "public/tiles/2013" -z "0-12" -p raster

# 生成2016年瓦片
python scripts/gdal_tile_generator.py "F:/01_Master/02_AnKangProject/各年份安康蒿坪融合数据/2016-2018/GF2_32.6/GF2_32.6/2016-32.6-按shp裁剪/GF2_PMS1_E108.7_N32.6_20160402_L1A0001501541-NND1_subset.dat" -o "public/tiles/2016" -z "0-12" -p raster
```

### 第三步：启动瓦片服务器

```bash
# 启动本地瓦片服务器
python scripts/tile_server.py -d public/tiles -p 8000
```

### 第四步：启动前端应用

```bash
# 启动React应用
npm run dev
```

## 参数说明

### GDAL切片参数

- `-p raster`: 保持原始投影
- `-z 0-12`: 缩放级别范围（0-12级）
- `-tilesize 256`: 瓦片大小（256x256像素）
- `-w none`: 不使用网络地图服务

### 瓦片服务器参数

- `-d public/tiles`: 瓦片目录
- `-p 8000`: 服务器端口

## 瓦片URL格式

生成的瓦片URL格式为：
```
http://localhost:8000/tiles/{year}/{z}/{x}/{y}.png
```

例如：
- 2003年瓦片：`http://localhost:8000/tiles/2003/12/3283/1654.png`
- 2013年瓦片：`http://localhost:8000/tiles/2013/12/3283/1654.png`
- 2016年瓦片：`http://localhost:8000/tiles/2016/12/3283/1654.png`

## 优势对比

### GDAL瓦片方案 vs GeoTIFF直接加载

| 特性 | GDAL瓦片 | GeoTIFF直接加载 |
|------|----------|----------------|
| 加载速度 | 快（按需加载） | 慢（全图加载） |
| 内存使用 | 低 | 高 |
| 网络传输 | 优化 | 未优化 |
| 缩放性能 | 优秀 | 一般 |
| 浏览器兼容性 | 好 | 一般 |
| 服务器要求 | 需要 | 不需要 |

## 故障排除

### 常见问题

1. **GDAL未安装**
   - 错误：`gdal2tiles.py: command not found`
   - 解决：安装GDAL并配置环境变量

2. **瓦片服务器无法启动**
   - 错误：`Address already in use`
   - 解决：更换端口或停止占用端口的进程

3. **瓦片无法显示**
   - 检查瓦片服务器是否运行
   - 检查瓦片文件是否存在
   - 检查URL格式是否正确

4. **切片失败**
   - 检查输入文件路径是否正确
   - 检查文件格式是否支持
   - 检查磁盘空间是否充足

### 调试方法

1. **检查瓦片文件**
   ```bash
   # 查看瓦片目录结构
   dir public/tiles/2016/12/3283/
   ```

2. **测试瓦片URL**
   ```bash
   # 在浏览器中访问
   http://localhost:8000/tiles/2016/12/3283/1654.png
   ```

3. **查看服务器日志**
   ```bash
   # 启动服务器时查看输出
   python scripts/tile_server.py -d public/tiles
   ```

## 性能优化

### 切片优化

1. **调整缩放级别范围**
   ```bash
   # 根据实际需求调整
   -z 0-15  # 更高级别，文件更大
   -z 0-10  # 较低级别，文件更小
   ```

2. **调整瓦片大小**
   ```bash
   # 更大的瓦片，减少请求数量
   -tilesize 512
   ```

3. **使用并行处理**
   ```bash
   # 使用多核处理
   --processes 4
   ```

### 服务器优化

1. **启用缓存**
   - 瓦片服务器自动设置1小时缓存
   - 可以配置更长的缓存时间

2. **使用CDN**
   - 将瓦片上传到CDN
   - 修改URL模板指向CDN

## 扩展功能

### 添加更多年份

1. 在`TileLayer.tsx`中添加新的年份配置
2. 运行切片脚本生成新瓦片
3. 重启瓦片服务器

### 添加不同投影

1. 修改切片参数使用不同投影
2. 更新OpenLayers配置
3. 调整地图视图设置

### 添加瓦片缓存

1. 实现瓦片缓存机制
2. 添加瓦片预加载
3. 优化网络请求

## 总结

GDAL瓦片方案是一个成熟、高效的遥感影像显示解决方案。通过将大尺寸GeoTIFF文件切分为小瓦片，可以显著提升加载性能和用户体验。建议在生产环境中使用此方案。
