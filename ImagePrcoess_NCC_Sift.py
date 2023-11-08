# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：ImagePrcoess_NCC_Sift.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/5/11 15:41 
'''
from osgeo import gdal
import numpy as np
import cv2
# 加载第一张影像
uav_data = gdal.Open(r'G:\傅炜舜-数据处理\water\无人机与gf7-23对比\wurenji\NDWIplusMin1m')
uav_geo_transform = uav_data.GetGeoTransform()
uav_proj = uav_data.GetProjection()
uav_band = uav_data.GetRasterBand(1)

# 加载第二张影像
gf2_data = gdal.Open(r'G:\傅炜舜-数据处理\water\无人机与gf7-23对比\gf7\NDWIgf7plusMin1m')
gf2_geo_transform = gf2_data.GetGeoTransform()
gf2_proj = gf2_data.GetProjection()
gf2_band = gf2_data.GetRasterBand(1)

# 读取第一张影像的像素值
uav_pixels = uav_band.ReadAsArray().astype(np.float64)

# 读取第二张影像的像素值
gf2_pixels = gf2_band.ReadAsArray().astype(np.float64)

# 调整第二张影像的大小，使其与第一张影像的大小相同
gf2_pixels = cv2.resize(gf2_pixels, (uav_pixels.shape[1], uav_pixels.shape[0]), interpolation=cv2.INTER_LINEAR)#相似度为：5.28

# 调整第一张影像的大小，使其与第一张影像的大小相同
# uav_pixels = cv2.resize(uav_pixels, (gf2_pixels.shape[1], gf2_pixels.shape[0]), interpolation=cv2.INTER_LINEAR)#相似度为：5.16

# 计算两张影像的相关系数
# corr_coef = cv2.compare(uav_pixels, gf2_pixels, cv2.CMP_EQ)
# similarity = np.sum(corr_coef) / (uav_pixels.shape[0] * uav_pixels.shape[1])
# print('相似度为：%.2f' % similarity)
# cv2.compare() 函数用于比较两个数组的元素，并将比较结果存储在输出数组中。但是使用 cv2.compare() 函数计算了两个数组的相关系数，这是不正确的。
# 相关系数是一种统计量，用于衡量两个变量之间的线性关系，通常用于分析数据之间的关联性。在图像处理中通常使用相关系数来衡量两个图像之间的相似度。

mask = (~np.isnan(uav_pixels.flatten())) & (~np.isnan(gf2_pixels.flatten()))
np.seterr(divide='ignore', invalid='ignore')    #忽略除法中的NaN值

# 计算两张影像的相关系数
corr_coef = np.corrcoef(uav_pixels.flatten()[mask], gf2_pixels.flatten()[mask])[0, 1]
print('图像相关系数为：%.2f' % corr_coef)

# 这里，uav_pixels.flatten() 和 gf2_pixels.flatten() 分别表示将 uav_pixels 和 gf2_pixels 数组展平（变成一维数组）后的结果。
# 使用 numpy.corrcoef() 函数计算这两个一维数组的相关系数矩阵，并提取出矩阵中的第一个元素（即两个图像之间的相关系数）即可。
# 请注意，相关系数的取值范围为 [-1, 1]，其中 1 表示完全正相关，-1 表示完全负相关，0 表示没有线性关系。

# 相关系数是一种统计量，用于衡量两个变量之间的线性关系，通常用于分析数据之间的关联性。在图像处理中，我们可以使用相关系数来衡量两个图像之间的相似程度。
# 相关系数的取值范围为 [-1, 1]，其中 1 表示完全正相关，-1 表示完全负相关，0 表示没有线性关系。
#
# 在计算图像相似度时，我们通常使用皮尔逊相关系数（Pearson correlation coefficient），它可以衡量两个图像之间的线性相关程度。
# 皮尔逊相关系数通常用于衡量两个随机变量之间的相关程度，但它也可以应用于图像相似度的计算中。
# https://blog.csdn.net/changjuanfang/article/details/129996934

#皮尔逊相关指数是反映灰度值上呈现出的一定的线性关系，而我们通过波段运算得出来的NDWI、TP、DO等指数都是单波段的灰度值图像，正好完全契合
