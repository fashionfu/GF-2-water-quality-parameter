# 高分二号水质参数遥感反演系统

## 项目简介

本项目是一个基于高分二号（GF-2）卫星影像的河湖水质监测系统，通过遥感技术结合无人机数据进行水质参数反演。系统主要使用高分二号影像的0、1、2、3四个波段数据，通过波段运算操作计算汉江流域的NDWI、TP、TN、DO等水质参数，并结合ArcGIS、ENVI等软件进行后期处理。

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/assets/145452598/4af2f7c8-10a7-4df5-aef4-acc86c1b3f8a" alt="水质参数图1" width="300"/>
      <br><strong>水质参数图1</strong>
    </td>
    <td align="center">
      <img src="https://github.com/fashionfu/GF-2-water-quality-parameter/assets/145452598/ec10f738-7c55-44b3-b09c-c92c75c90288" alt="水质参数图2" width="300"/>
      <br><strong>水质参数图2</strong>
    </td>
  </tr>
</table>

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
