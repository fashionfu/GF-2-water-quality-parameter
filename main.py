# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：main.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/3/30 17:22 
'''
from Water import water_extract_NDWI
from contours import draw_contours, river_end
from buildshp import raster2shp, raster2vector
from water_quality import water_quality_test

if __name__ == '__main__':

    # 读取原始影像进行水体提取
    water_extract_NDWI('GF701_017803_E108.7_N32.4_20230109114707_MUX_01_SC0_0004_2301098410_radio_FLAASH_rpcortho_PC_caijian_warp_roi.tif')
    # 读取3波段影像3bd.tif和水体二值图影像NDWI_mask.jpg
    # 提取所有水体轮廓NDWI_water.jpg，进行滤波NDWI_river.jpg，几何约束NDWI_end.jpg，最终获取河流二值图NDWI_river_end.jpg
    draw_contours('3bd_gf7.tif', 'NDWI_mask.jpg', 'NDWI_water.jpg', 'NDWI_river.jpg', 'NDWI_end.jpg', 'NDWI_river_end.jpg')    # 绘制轮廓
    # 二值图转shp文件
    raster2shp('NDWI_mask1.tif', 'NDWI.shp')

    # 进行水质反演
    water_quality_test("GF701_017803_E108.7_N32.4_20230109114707_MUX_01_SC0_0004_2301098410_radio_FLAASH_rpcortho_PC_caijian_warp_roi.tif")

