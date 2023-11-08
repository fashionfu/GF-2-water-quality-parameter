# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：contours.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/3/30 17:23 
'''
import cv2
import numpy as np
from osgeo import gdal
from numba import jit
import math
from PIL import Image

def cnt_area(cnt):
  area = cv2.contourArea(cnt)
  return area

def cnt_length(cnt):
  length = cv2.arcLength(cnt, True)
  return length

@jit(nopython=True)
def go_fast_river(im, block_data, river_end, river_end_mask):
    for row in range(river_end_mask.shape[0]):
        for col in range(river_end_mask.shape[1]):
            b, g, r = im[row, col]
            if b > 128 and g > 128 and r > 128:
                # river_end[:, row, col] = block_data[:, row, col]
                river_end_mask[row, col] = 1
            else:
                river_end[:, row, col] = 0
                river_end_mask[row, col] = 0
    return river_end, river_end_mask

def draw_contours(threebandsimg, mask_jpg, outimg1, outimg2, outimg3, outimg4):
    # drawContours需三波段图像，其它格式的图像会报错，因此读取3波段图像 (可使用ENVI另外输出）
    image = cv2.imread(threebandsimg)
    img = image.copy()
    # 轮廓提取
    thresh = cv2.imread(mask_jpg, cv2.CV_8UC1)  #图像需设置为8UC1格式
    contours,hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    print("轮廓的数量为:%d" % (len(contours)))
    # 第三个参数传递值为-1，绘制所有轮廓
    cv2.drawContours(img, contours, -1, (0, 0, 255), -1)
    # cv2.drawContours(img, contours, 3, (0, 255, 0), 3)
    # cnt = contours[3]
    # cv.drawContours(img, [cnt], 0, (0, 255, 0), 3)
    # 显示轮廓
    cv2.namedWindow('drawContours', 0)
    # cv2.imshow('drawContours', img)
    # 保存包含轮廓的图片
    cv2.imwrite(outimg1, img)
    # 绘制面积前n的轮廓
    rivers = image.copy()
    # len(contours[0]), len中存放的是轮廓中的角点
    # 根据轮廓中的点数对轮廓进行排序
    # contours.sort(key=len, reverse=True)
    # 根据轮廓中的面积对轮廓进行排序
    # contours.sort(key=cnt_area, reverse=True)
    # 根据轮廓的长度对轮廓进行排序
    contours = np.array(contours)

    # *********************************************
    # contours.sort(classmethod )

    contours_max = contours[0:3000]  #显示面积前n的轮廓
    cv2.drawContours(rivers, contours_max, -1, (0, 0, 255), -1)     #最后一个参数-1为填充，其它为线宽
    cv2.namedWindow('The first n contours with the largest area', 0)
    # cv2.imshow('The first n contours with the largest area', rivers)
    cv2.imwrite(outimg2, rivers)

    contours_end = []
    for c in contours_max:
        # 找到边界坐标
        x, y, w, h = cv2.boundingRect(c)  # 计算点集最外面的矩形边界
        # cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)    # 横平竖直的矩形

        # 找面积最小的矩形
        rect = cv2.minAreaRect(c)
        # 得到最小矩形的坐标
        box = cv2.boxPoints(rect)
        # 标准化坐标到整数
        box = np.int0(box)
        # 最小矩形的长宽
        width, height = rect[1]
        # 最小矩形的角度:[-90,0)
        angle = rect[2]
        # 画出边界
        # cv2.drawContours(image, [box], 0, (0, 255, 0), 3)
        # 计算轮廓周长
        length = cv2.arcLength(c, True)

        # 统计最小外接矩形面积与水域面积，便于区分出河流
        area_water = cv2.contourArea(c)
        area_MBR = w * h
        # 如果水体面积与其最小外接矩形之比小于0.45，或者长宽比小于<0.6，且水体长度大于300，则认为该水体为河流
        if (area_water * 1.0 / area_MBR < 0.45 or (width / height < 0.6 or height / width < 0.6)) and length > 300:
            contours_end.append(c)

        # # 计算最小封闭圆的中心和半径
        # (x, y), radius = cv2.minEnclosingCircle(c)
        # # 换成整数integer
        # center = (int(x), int(y))
        # radius = int(radius)
        # # 画圆
        # cv2.circle(image, center, radius, (0, 255, 0), 2)

    print("最终轮廓的数量为:%d" % (len(contours_end)))
    # 显示最终轮廓结果
    end = image.copy()
    cv2.drawContours(end, contours_end, -1, (0, 0, 255), -1)
    cv2.namedWindow('The first n contours with the largest area', 0)
    # cv2.imshow('The first n contours with the largest area', end)
    cv2.imwrite(outimg3, end)
    # cv2.waitKey()

    # 创建一个全黑的图像，方便后续输入二值图，生成shp文件
    img_black = image.copy()
    img_black[:, :, 0:3] = 0
    # 生成最终的二值图
    cv2.drawContours(img_black, contours_end, -1, (255, 255, 255), -1)
    cv2.imwrite(outimg4, img_black)
    print("river_end图像生成成功！")


def river_end(river_jpg, ori_tif, outimg1, outimg2):
    in_ds = gdal.Open(ori_tif)  # 打开样本文件
    # 读取tif影像信息
    xsize = in_ds.RasterXSize  # 获取行列数
    ysize = in_ds.RasterYSize
    bands = in_ds.RasterCount  # 获取波段数
    geotransform = in_ds.GetGeoTransform()  # 获取仿射矩阵信息
    projection = in_ds.GetProjectionRef()  # 获取投影信息
    block_data = in_ds.ReadAsArray(0, 0, xsize, ysize).astype(np.float32)  # 获取影像信息

    im = cv2.imread(river_jpg)

    river_end = block_data
    river_end_mask = block_data[0, :, :]  # 随便给定一个初值
    # 获取筛选后的河流tif影像以及其二值tif影像
    river_end, river_end_mask = go_fast_river(im, block_data, river_end, river_end_mask)

    # 生成tif遥感影像
    driver = gdal.GetDriverByName('GTiff')  # 数据类型必须有，因为要计算需要多大内存空间
    im_bands = 4  # 设置输出影像的波段数
    dataset = driver.Create(outimg1, xsize, ysize, im_bands, gdal.GDT_Float32)  # 1为波段数量
    dataset.SetProjection(projection)  # 写入投影
    dataset.SetGeoTransform(geotransform)  # 写入仿射变换参数
    if im_bands == 1:
        dataset.GetRasterBand(1).WriteArray(river_end)  # 写入数组数据
    else:
        for i in range(im_bands):
            dataset.GetRasterBand(i + 1).WriteArray(river_end[i])
    del dataset
    print("river_end图像生成成功！")

    im_bands1 = 1  # 设置输出影像的波段数
    dataset1 = driver.Create(outimg2, xsize, ysize, im_bands1, gdal.GDT_Float32)  # 1为波段数量
    dataset1.SetProjection(projection)  # 写入投影
    dataset1.SetGeoTransform(geotransform)  # 写入仿射变换参数
    if im_bands1 == 1:
        dataset1.GetRasterBand(1).WriteArray(river_end_mask)  # 写入数组数据
    else:
        for i in range(im_bands1):
            dataset1.GetRasterBand(i + 1).WriteArray(river_end_mask[i])
    del dataset1
    print("river_end_mask图像生成成功！")
