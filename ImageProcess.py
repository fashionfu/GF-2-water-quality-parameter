# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：ImageProcess.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/5/10 17:08 
'''
# 以下是Python语言实现的几种比较无人机影像和高分二号影像之间相似度的方法的示例代码：
# 像素值比较法
from osgeo import gdal
import numpy as np

# 打开无人机影像和高分二号影像
drone_ds = gdal.Open('drone_img.tif')
gf2_ds = gdal.Open('gf2_img.tif')

# 读取无人机影像和高分二号影像的像素值
drone_img = drone_ds.GetRasterBand(1).ReadAsArray()
gf2_img = gf2_ds.GetRasterBand(1).ReadAsArray()

# 像素值比较法
mse = np.mean((drone_img - gf2_img) ** 2)
psnr = 10 * np.log10(255.0**2 / mse)

print("MSE: ", mse)
print("PSNR: ", psnr)


# 相关性比较法
from osgeo import gdal
import numpy as np

# 打开无人机影像和高分二号影像
drone_ds = gdal.Open('drone_img.tif')
gf2_ds = gdal.Open('gf2_img.tif')

# 读取无人机影像和高分二号影像的像素值
drone_img = drone_ds.GetRasterBand(1).ReadAsArray().ravel()
gf2_img = gf2_ds.GetRasterBand(1).ReadAsArray().ravel()

# 相关性比较法
corr_coef = np.corrcoef(drone_img, gf2_img)[0, 1]

print("Correlation Coefficient: ", corr_coef)


# 特征提取法
from osgeo import gdal
import cv2

# 打开无人机影像和高分二号影像
drone_ds = gdal.Open('drone_img.tif')
gf2_ds = gdal.Open('gf2_img.tif')

# 读取无人机影像和高分二号影像的像素值
drone_img = drone_ds.ReadAsArray()
gf2_img = gf2_ds.ReadAsArray()

# 特征提取法
sift = cv2.xfeatures2d.SIFT_create()
kp1, des1 = sift.detectAndCompute(drone_img, None)
kp2, des2 = sift.detectAndCompute(gf2_img, None)

bf = cv2.BFMatcher()
matches = bf.knnMatch(des1, des2, k=2)

good = []
for m, n in matches:
    if m.distance < 0.75 * n.distance:
        good.append([m])

similarity = len(good) / min(len(kp1), len(kp2))

print("Similarity: ", similarity)

# 基于深度学习的方法
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.applications import ResNet50

# 读入无人机影像和高分二号影像
drone_img = cv2.imread('drone_img.tif')
gf2_img = cv2.imread('gf2_img.tif')

# 基于深度学习的方法
model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
drone_img = cv2.resize(drone_img, (224, 224))
gf2_img = cv2.resize(gf2_img, (224, 224))
drone_img = preprocess_input(drone_img)
gf2_img = preprocess_input(gf2_img)
drone_features = model.predict(np.array([drone_img]))
gf2_features = model.predict(np.array([gf2_img]))
cosine_similarity = tf.keras.losses.cosine_similarity(drone_features, gf2_features).numpy()[0]

print("Cosine Similarity: ", cosine_similarity)
# 上述代码中，每种方法都有对应的实现，包括像素值比较法、相关性比较法、特特提取法和基于深度学习的方法。这些方法的具体实现如下：
# 像素值比较法
# 这种方法是最简单的相似度比较方法，只需要对两幅图像的像素值进行比较即可。我们可以使用NumPy库中的mean函数计算均方误差（MSE），使用OpenCV库中的PSNR函数计算峰值信噪比（PSNR）。
# 相关性比较法
# 这种方法通过计算两幅图像的相关系数来比较它们的相似度。我们可以使用NumPy库中的corrcoef函数计算相关系数。
# 特征提取法
# 这种方法通过提取两幅图像中的特征，并进行特征匹配和配准来比较它们的相似度。我们可以使用OpenCV库中的SIFT算法进行特征提取和匹配。
# 基于深度学习的方法
# 这种方法使用预训练的深度学习模型对两幅图像进行特征提取，并计算它们之间的相似度。我们可以使用TensorFlow库中的ResNet50模型进行特征提取，并使用TensorFlow库中的cosine_similarity函数计算余弦相似度。
# 需要注意的是，这些方法的具体实现可能需要根据具体的数据类型和应用场景进行调整和优化。