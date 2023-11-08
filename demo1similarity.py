# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：demo1similarity.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/5/17 16:22 
'''

import numpy as np
import cv2
from osgeo import gdal

# 读取无人机影像数据
uav_ds = gdal.Open(r'D:\python\PycharmDemo\demo\train\Water\wurenji\NDWI.tif')
uav_data = uav_ds.ReadAsArray()

# 读取高分二号影像数据
gf2_ds = gdal.Open(r'D:\python\PycharmDemo\demo\train\Water\gf7\NDWI.tif')
gf2_data = gf2_ds.ReadAsArray()

# 归一化
uav_data = (uav_data - np.min(uav_data)) / (np.max(uav_data) - np.min(uav_data))
gf2_data = (gf2_data - np.min(gf2_data)) / (np.max(gf2_data) - np.min(gf2_data))

# 将彩色图像转换为灰度图像
uav_gray = cv2.cvtColor(uav_data, cv2.COLOR_RGB2GRAY)
gf2_gray = cv2.cvtColor(gf2_data, cv2.COLOR_RGB2GRAY)

# 提取无人机影像和高分二号影像的特征（使用ORB算法）
orb = cv2.ORB_create()
uav_kp, uav_des = orb.detectAndCompute(uav_gray, None)
gf2_kp, gf2_des = orb.detectAndCompute(gf2_gray, None)
# 改用surf算法是因为sift算法需要版权，surf也需要版权...

# 在RGB图像中，每个像素由红色、绿色和蓝色三个通道的数值组成。不同的通道对应不同的颜色信息，因此可以通过分别处理不同通道的数据来提取不同的特征信息。
# 一般情况下，使用灰度图像进行特征提取是最常见和最简单的方法。但是，在某些情况下，使用彩色图像的某个通道进行特征提取可以获得更好的效果。
# 比如，在无人机影像和高分二号影像中，蓝色通道包含了较多的地面信息，而红色和绿色通道则包含了较多的植被信息。因此，我们可以选择使用蓝色通道进行特征提取，来提取出地面的特征信息。
# 在这段代码中，我们使用了第三个通道（即蓝色通道）进行特征提取。通过使用不同的通道进行特征提取，我们可以获得更丰富和更具代表性的图像特征信息，从而提高图像处理和分析的效果。

# 在无人机影像和高分二号影像中，蓝色通道包含了较多的地面信息的原因是与光的反射和吸收有关。
# 地面通常是由石头、土壤、水等物质组成，这些物质对不同波长的光的反射和吸收能力是不同的。蓝色光波长较短，能够被地面上的水分子和微小颗粒等物质所反射，
# 因此蓝色通道中包含了更多的地面信息，尤其是水体和湿地等地面特征。
# 相反，红色和绿色光波长较长，能够被地面上的植被叶片所反射，因此红色和绿色通道中包含了更多的植被信息。
# 因此，在无人机影像和高分二号影像中，使用蓝色通道进行特征提取可以提取出地面的特征信息，而使用红色和绿色通道进行特征提取则可以提取出植被的特征信息。
# 需要注意的是，不同的地面特征和不同的遥感影像类型可能会对通道的选择产生影响

# 调整窗口大小和相关系数阈值
similarity = 0
for w in range(5, 51, 5):
    res = cv2.matchTemplate(uav_data[:, :, 2], gf2_data[:, :, 2], cv2.TM_CCORR_NORMED, mask=None, templ=None, )
    loc = np.where(res >= 0.8)
    if loc[0].size > 0:
        similarity = res[loc].max()
    break

print('相似度为：%.2f' % similarity)
# 使用OpenCV库中的SIFT算法提取无人机影像和高分二号影像的特征，然后使用cv2.matchTemplate函数计算归一化交叉相关系数。
# 在cv2.matchTemplate函数中，我们可以通过调整mask参数来设置窗口大小，通过调整threshold参数来设置相关系数阈值。
# 在本例中，我们使用了一个循环来尝试不同的窗口大小，并通过设置阈值来确保找到一个合适的匹配结果。
# 当找到一个满足阈值条件的匹配结果时，我们便可以输出相似度。
#
# 需要注意的是，在实际应用中，我们需要根据具体的影像数据和应用场景，通过实验和调参来确定合适的窗口大小和相关系数阈值等参数。

