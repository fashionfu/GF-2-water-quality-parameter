# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：Water.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/3/30 17:20 
'''
import numpy as np
from osgeo import gdal, gdal_array  # 导入读取遥感影像的库
import cv2
from numba import jit
import math

def water_extract_NDWI(fileName):
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

    # 获取GF-2号多个波段
    B = block_data[0, :, :]
    G = block_data[1, :, :]
    R = block_data[2, :, :]
    NIR = block_data[3, :, :]

    np.seterr(divide='ignore', invalid='ignore')    #忽略除法中的NaN值

    # 计算归一化差异水体指数NDWI
    NDWI = (G - NIR) * 1.0 / (G + NIR)

    # 生成tif遥感影像
    writetif(1, xsize, ysize, projection, geotransform, NDWI, "NDWI.tif")
    print("NDWI图像生成成功！")

    # 根据阈值划分水体与非水体
    # 蒿坪河高分二号数据使用阈值 32.4：0.02 32.6：-0.2
    threshold = 0.02
    NDWI = go_fast_NDWI(NDWI, threshold)     #使用numba加快for循环运行速度
    # for row in range(NDWI.shape[0]):
    #     for col in range(NDWI.shape[1]):
    #         if NDWI[row, col] >= threshold:
    #             NDWI[row, col] = 1
    #         else:
    #             NDWI[row, col] = 0

    # 最后对图像进行开运算进行去噪，即先腐蚀后膨胀
    kernel = np.ones((5, 5), np.float32)
    opening = cv2.morphologyEx(NDWI, cv2.MORPH_OPEN, kernel)

    # 生成掩膜二值图——这种保存方法没有地理信息
    # gdal_array.SaveArray(opening.astype(gdal_array.numpy.uint32),
    #                      'NDWI_mask.tif', format="GTIFF", prototype='')
    # print("NDWI二值化掩膜图像生成成功！")

    # 生成掩膜二值图——采用gdal包，包含地理信息等
    writetif(1, xsize, ysize, projection, geotransform, opening, "NDWI_mask1.tif")
    print("NDWI二值化掩膜图像生成成功！")

    # # 生成掩膜二值图——采用opencv简单划分
    # retval, NDWI_mask = cv2.threshold(NDWI, threshold, 255, cv2.THRESH_BINARY)
    # cv2.imwrite('NDWI_mask.jpg', NDWI_mask)
    # 保存为jpg图片
    cv2.imwrite('NDWI_mask.jpg', NDWI)
    print("NDWI二值化掩膜图像生成成功！")


def writetif(im_bands, xsize, ysize, projection, geotransform, img, outimgname):
    driver = gdal.GetDriverByName('GTiff')
    dataset = driver.Create(outimgname, xsize, ysize, im_bands, gdal.GDT_Float32)  # 1为波段数量
    dataset.SetProjection(projection)  # 写入投影
    dataset.SetGeoTransform(geotransform)  # 写入仿射变换参数
    if im_bands == 1:
        dataset.GetRasterBand(1).WriteArray(img)  # 写入数组数据
    else:
        for i in range(im_bands):
            dataset.GetRasterBand(i + 1).WriteArray(img[i])
    del dataset

@jit(nopython=True)
def go_fast_NDWI(NDWI, threshold):
    for row in range(NDWI.shape[0]):
        for col in range(NDWI.shape[1]):
            if NDWI[row, col] >= threshold:
                NDWI[row, col] = 1
            else:
                NDWI[row, col] = 0
    return NDWI

# # 保存裁剪后的子图片
#             driver = gdal.GetDriverByName("GTiff")
#             out_dataset = driver.Create(output_file, x_max-x_min, y_max-y_min, 1, gdal.GDT_Float32)
#             out_dataset.SetGeoTransform((geotransform[0]+x_min*geotransform[1], geotransform[1], 0, geotransform[3]+y_min*geotransform[5], 0, geotransform[5]))
#             out_dataset.SetProjection(projection)
#             out_dataset.GetRasterBand(1).WriteArray(data)
#             out_dataset.FlushCache()
#             out_dataset = None
#
#     # 关闭数据集
#     dataset = None