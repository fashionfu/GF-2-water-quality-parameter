# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：ImageProcess_Guassion_Kmean_HSV.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/5/11 15:42 
'''
import numpy as np
import cv2
from osgeo import gdal

# 读取无人机影像数据
uav_ds = gdal.Open('uav_image.tif')
uav_data = uav_ds.ReadAsArray()

# 读取高分二号影像数据
gf2_ds = gdal.Open('gf2_image.tif')
gf2_data = gf2_ds.ReadAsArray()

# 归一化
uav_data = (uav_data - np.min(uav_data)) / (np.max(uav_data) - np.min(uav_data))
gf2_data = (gf2_data - np.min(gf2_data)) / (np.max(gf2_data) - np.min(gf2_data))

# K均值聚类图像分割
uav_data = cv2.cvtColor(uav_data, cv2.COLOR_GRAY2RGB)
gf2_data = cv2.cvtColor(gf2_data, cv2.COLOR_GRAY2RGB)
uav_data = uav_data.reshape((-1, 3))
gf2_data = gf2_data.reshape((-1, 3))
uav_data = np.float32(uav_data)
gf2_data = np.float32(gf2_data)
criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
k = 8
ret, uav_label, uav_center = cv2.kmeans(uav_data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
ret, gf2_label, gf2_center = cv2.kmeans(gf2_data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
uav_center = np.uint8(uav_center)
gf2_center = np.uint8(gf2_center)
uav_res = uav_center[uav_label.flatten()]
gf2_res = gf2_center[gf2_label.flatten()]
uav_res = uav_res.reshape((uav_data.shape[0], uav_data.shape[1], uav_data.shape[2]))
gf2_res = gf2_res.reshape((gf2_data.shape[0], gf2_data.shape[1], gf2_data.shape[2]))
uav_data = cv2.cvtColor(uav_res, cv2.COLOR_RGB2GRAY)
gf2_data = cv2.cvtColor(gf2_res, cv2.COLOR_RGB2GRAY)

# K均值聚类图像分割是一种常用的图像分割方法。K均值聚类是一种无监督学习算法，其目的是将一组数据分成K个簇。在图像分割中，我们可以将每个像素看作一个数据点，并将其聚类成K个簇。
# 聚类后，同一簇内的像素具有相似的特征，而不同簇之间的像素具有不同的特征。
#
# 当我们使用K均值聚类进行图像分割时，我们通常会选择颜色或灰度值作为像素的特征。
# 具体来说，我们可以将每个像素表示为一个向量，其中每个分量表示像素在某个颜色空间（如RGB、HSV等）或灰度空间中的值。
# 然后，我们可以使用K均值聚类算法将所有像素分成K个簇，其中每个簇对应于一个颜色或灰度值。
# 具体来说，K均值聚类图像分割的过程如下：
#
# 1.选择K个聚类中心（也称为质心），可以随机选择或根据颜色、位置等特征进行选择。
# 2.对每个像素，计算其与每个聚类中心的距离，将其分配到距离最近的聚类中心所在的簇中。
# 3.对每个簇，重新计算其聚类中心，即将簇内所有像素的特征取平均值作为新的聚类中心。
# 4.重复步骤2和步骤3，直到聚类中心不再发生变化或达到最大迭代次数为止。
# 在K均值聚类图像分割中，我们通常将像素的颜色或灰度值作为特征进行聚类。聚类后，我们可以将同一簇内的像素标记为同一种颜色或灰度值，以实现图像分割的效果。
# 由于K均值聚类图像分割是一种无监督学习算法，因此不需要任何关于图像内容的先验知识，适用于各种类型的图像分割任务。

# HSV颜色空间转换
uav_data = cv2.cvtColor(uav_data, cv2.COLOR_GRAY2RGB)
gf2_data = cv2.cvtColor(gf2_data, cv2.COLOR_GRAY2RGB)
uav_data = cv2.cvtColor(uav_data, cv2.COLOR_RGB2HSV)
gf2_data = cv2.cvtColor(gf2_data, cv2.COLOR_RGB2HSV)
# 高斯滤波和中值滤波去噪
uav_data = cv2.GaussianBlur(uav_data, (5, 5), 0)
gf2_data = cv2.GaussianBlur(gf2_data, (5, 5), 0)
uav_data = cv2.medianBlur(uav_data, 5)
gf2_data = cv2.medianBlur(gf2_data, 5)

# 形态学处理
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
uav_data = cv2.morphologyEx(uav_data, cv2.MORPH_OPEN, kernel)
gf2_data = cv2.morphologyEx(gf2_data, cv2.MORPH_OPEN, kernel)
uav_data = cv2.morphologyEx(uav_data, cv2.MORPH_CLOSE, kernel)
gf2_data = cv2.morphologyEx(gf2_data, cv2.MORPH_CLOSE, kernel)

# 提取无人机影像和高分二号影像的特征
sift = cv2.xfeatures2d.SIFT_create()
uav_kp, uav_des = sift.detectAndCompute(uav_data[:, :, 2], None)
gf2_kp, gf2_des = sift.detectAndCompute(gf2_data[:, :, 2], None)

# 进行特征匹配
bf = cv2.BFMatcher()
matches = bf.knnMatch(uav_des, gf2_des, k=2)

# 找出好的匹配点
good = []
for m, n in matches:
    if m.distance < 0.75 * n.distance:
        good.append([m])

# 计算相似度
similarity = len(good) / (len(uav_kp) * 1.0)

print('相似度为：%.2f' % similarity)

# 在高斯滤波和中值滤波去噪之后，使用了形态学处理来进一步去除影像中的噪点和小块。
# 在形态学处理中，我们使用了开运算和闭运算操作，其中开运算可以去除影像中的小颗粒点，闭运算可以填充影像中的小洞和裂缝。
# 接下来，我们使用OpenCV库中的SIFT算法提取无人机影像和高分二号影像的特征，然后使用BFMatcher进行特征匹配。
# 最后，我们根据特征匹配的结果计算相似度，并将结果输出到控制台。


