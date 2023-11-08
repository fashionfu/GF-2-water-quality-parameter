# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：LinearStretch.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/5/17 20:22 
'''

#使用ENVI中 Stretch data可以直接线性拉伸

from osgeo import gdal
import numpy as np

def LinearStretch(fileName):
    in_ds = gdal.Open(fileName)  # 打开样本文件
    # 读取tif影像信息
    xsize = in_ds.RasterXSize  # 获取行列数
    ysize = in_ds.RasterYSize
    bands = in_ds.RasterCount  # 获取波段数
    geotransform = in_ds.GetGeoTransform() # 获取仿射矩阵信息
    projection = in_ds.GetProjectionRef()   # 获取投影信息
    block_data = in_ds.ReadAsArray(0,0,xsize,ysize).astype(np.float32) # 获取影像信息
    # block_data = in_ds.ReadAsArray()
    # band1 = in_ds.GetRasterBand(1)
    # datatype = band1.DataType
    print("波段数为：", bands)
    print("行数为：", xsize)
    print("列数为：", ysize)
    NDWI_band1_data1 = in_ds.GetRasterBand(1).ReadAsArray(0,0,xsize,ysize).astype(np.float32)


    # 线性拉伸
    min_val = np.min(NDWI_band1_data1)
    max_val = np.max(NDWI_band1_data1)
    NDWI_band1_data1 = (NDWI_band1_data1 - min_val) / (max_val - min_val) * 255.0
    # print(NDWI_band1.shape)

    # 将像素值写入新的影像文件
    driver = gdal.GetDriverByName('GTiff')
    out_data = driver.Create('gf7_ndwi_Normalized_Image.tif', xsize, ysize, 1, gdal.GDT_Float32)
    out_data.SetGeoTransform(geotransform)
    out_data.SetProjection(projection)
    # out_band = out_data.GetRasterBand(1)
    out_data.GetRasterBand(1).WriteArray(NDWI_band1_data1[0])
    # dataset.GetRasterBand(1).WriteArray(img)
    out_data = None
    band = None
    out_band = None

LinearStretch(r'D:\python\PycharmDemo\demo\train\Water\gf7\NDWI.tif')




# # 加载影像
# data = gdal.Open(r'D:\python\PycharmDemo\demo\train\Water\wurenji\NDWI.tif')
# geo_transform = data.GetGeoTransform()
# proj = data.GetProjection()
# band = data.GetRasterBand(1)
#
# # 读取影像的像素值
# pixels = band.ReadAsArray().astype(np.float32)
#
# # 线性拉伸
# min_val = np.min(pixels)
# max_val = np.max(pixels)
# pixels = (pixels - min_val) / (max_val - min_val) * 255.0
#
# # 将像素值写入新的影像文件
# driver = gdal.GetDriverByName('GTiff')
# out_data = driver.Create('wurenji_ndwi_Normalized_Image.tif', band.XSize, band.YSize, 1, gdal.GDT_Float32)
# out_data.SetGeoTransform(geo_transform)
# out_data.SetProjection(proj)
# out_band = out_data.GetRasterBand(1)
# out_band.WriteArray(pixels)
#
# # 释放资源
# out_data = None
# band = None
# out_band = None


