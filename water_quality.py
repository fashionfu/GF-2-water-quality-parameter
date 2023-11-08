# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：water_quality.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/3/30 17:24 
'''
import numpy as np
import math
from osgeo import gdal, gdal_array  # 导入读取遥感影像的库
from numba import jit
import math

def water_quality_test(fileName):
    in_ds = gdal.Open(fileName)  # 打开样本文件
    # 读取tif影像信息
    xsize = in_ds.RasterXSize  # 获取行列数
    ysize = in_ds.RasterYSize
    bands = in_ds.RasterCount  # 获取波段数
    geotransform = in_ds.GetGeoTransform() # 获取仿射矩阵信息
    projection = in_ds.GetProjectionRef()   # 获取投影信息
    block_data = in_ds.ReadAsArray(0, 0, xsize, ysize).astype(np.float32) # 获取影像信息
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

    np.seterr(divide='ignore', invalid='ignore')

    # 化学水质参数计算
    # from 广州市黑臭水体评价模型构建及污染染溯源研究
    COD = (R / G - 0.5777) / 0.007  # 化学需氧量浓度，单位是mg/L

    # from 广州市黑臭水体评价模型构建及污染染溯源研究
    TP = 4.9703 * np.power((R / G), 11.618)  # 总磷的浓度，单位为mg/L

    # from 基于实测数据的鄱阳湖总氮、 总磷遥感反演模型研究
    TN = 2.2632 * (NIR / G) * (NIR / G) + 1.1392 * (NIR / G) + 0.7451

    # from 广州市黑臭水体评价模型构建及污染染溯源研究
    # 计算结果多为负数，不合理
    # NH3N = (R / G - 0.661) / 0.07       # 氨氮的浓度，单位为mg/L

    # from 基于Landsat-8 OLI影像的术河临沂段氮磷污染物反演
    # 取值范围为：-0.09到1.48 不合理
    # NH3N = 3.1749 * R / G - 1.9909  # 氨氮的浓度，单位为mg/L

    NH3N = 4.519 * ((G - R) / (G + R)) * ((G - R) / (G + R))\
           - 2.1 * (G - R) / (G + R) + 0.47      # 氨氮的浓度，单位为mg/L

    # from 平原水库微污染水溶解氧含量模型反演与验证
    # DO = 15.73229 - 30.80257 * (R + G) / 10000    # 溶解氧的浓度，单位为mg/L
    # from 基于自动监测和Sentinel-2影像的钦州湾溶解氧反演模型研究
    DO = 771.854 * (1 / R) - 1.476 * (R * R) / (B * B) + 6.435

    # 保存影像
    gdal_array.SaveArray(COD.astype(gdal_array.numpy.uint32),
                         'COD.tif', format="GTIFF", prototype='')
    print("COD图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, COD, "COD1.tif")
    print("COD1图像生成成功！")
    gdal_array.SaveArray(TP.astype(gdal_array.numpy.uint32),
                         'TP.tif', format="GTIFF", prototype='')
    print("TP图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, TP, "TP1.tif")
    print("TP1图像生成成功！")
    gdal_array.SaveArray(TN.astype(gdal_array.numpy.uint32),
                        'TN.tif', format="GTIFF", prototype='')
    print("TN图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, TN, "TN1.tif")
    print("TN1图像生成成功！")
    gdal_array.SaveArray(NH3N.astype(gdal_array.numpy.uint32),
                         'NH3N.tif', format="GTIFF", prototype='')
    print("NH3N图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, NH3N, "NH3N1.tif")
    print("NH3N1图像生成成功！")
    gdal_array.SaveArray(DO.astype(gdal_array.numpy.uint32),
                         'DO.tif', format="GTIFF", prototype='')
    print("DO图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, DO, "DO1.tif")
    print("DO1图像生成成功！")

    # 水质等级划分
    watergrades_all = R / R    # 随便给定一个初值
    watergrades_all = go_fast_waterquality_all(COD, TP, NH3N, DO, watergrades_all)
    # 保存影像
    gdal_array.SaveArray(watergrades_all.astype(gdal_array.numpy.uint32),
                         'watergrades_all.tif', format="GTIFF", prototype='')
    print("watergrades_all图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, watergrades_all, "watergrades_all1.tif")
    print("watergrades_all1图像生成成功！")



    # 营养状态指数计算
    # from 基于GF-1影像的洞庭湖区水体水质遥感监测
    chla = 4.089 * (NIR / R) * (NIR / R) - 0.746 * (NIR / R) + 29.7331  # chla 为叶绿素a浓度，单位为mg/m3
    TSS = 119.62 * np.power((R / G), 6.0823)  # tss为总悬浮物浓度，单位为mg / L
    sd = 284.15 * np.power(TSS, -0.67)  # sd 为透明度，单位是cm

    # 保存影像
    gdal_array.SaveArray(chla.astype(gdal_array.numpy.uint32),
                         'chla.tif', format="GTIFF", prototype='')
    print("chla图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, chla, "chla1.tif")
    print("chla1图像生成成功！")
    gdal_array.SaveArray(TSS.astype(gdal_array.numpy.uint32),
                         'TSS.tif', format="GTIFF", prototype='')
    print("TSS图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, TSS, "TSS1.tif")
    print("TSS1图像生成成功！")
    gdal_array.SaveArray(sd.astype(gdal_array.numpy.uint32),
                         'sd.tif', format="GTIFF", prototype='')
    print("sd图像生成成功！")
    writetif(1, xsize, ysize, projection, geotransform, sd, "sd1.tif")
    print("sd1图像生成成功！")


    # #TLI_chla = 25 + 10.86 * np.log(chla)
    # TLI_sd = 51.18 - 19.4 * np.log(sd)
    # TLI_TP = 94.36 + 16.24 * np.log(TP)
    # TLI_TN = 54.53 + 16.94 + np.log(TN)
    # # TLI_CODMn = 1.09 + 26.61 * np.log(CODMn)
    #
    # TLI = 0.3261 * TLI_chla + 0.2301 * TLI_TP + 0.2192 * TLI_TN + 0.2246 * TLI_sd
    # TLIgrades = G / G #随便给定一个初值
    # go_fast_TLI(TLI, TLIgrades)
    # # 保存影像
    # gdal_array.SaveArray(TLI.astype(gdal_array.numpy.uint32),
    #                      'TLI.tif', format="GTIFF", prototype='')
    # print("TLI图像生成成功！")
    # writetif(1, xsize, ysize, projection, geotransform, TLI, "TLI1.tif")
    # print("TLI1图像生成成功！")
    #
    # gdal_array.SaveArray(TLIgrades.astype(gdal_array.numpy.uint32),
    #                      'TLIgrades.tif', format="GTIFF", prototype='')
    # print("TLIgrades图像生成成功！")
    # writetif(1, xsize, ysize, projection, geotransform, TLIgrades, "TLIgrades1.tif")
    # print("TLIgrades1图像生成成功！")
    #
    #
    # NDBWI = (G - R) / (G + R)   # 黑臭水体指数
    # BOI = (G - R) / (B + G + R)
    # # 保存影像
    # gdal_array.SaveArray(NDBWI.astype(gdal_array.numpy.uint32),
    #                      'NDBWI.tif', format="GTIFF", prototype='')
    # print("NDBWI像生成成功！")
    # writetif(1, xsize, ysize, projection, geotransform, NDBWI, "NDBWI1.tif")
    # print("NDBWI1图像生成成功！")
    #
    # writetif(1, xsize, ysize, projection, geotransform, BOI, "BOI.tif")
    # print("BOI图像生成成功！")
    #
    # NDBWI_grades = NDBWI
    # NDBWI_grades = go_fast_NDBWI(NDBWI, NDBWI_grades)
    # BOIgrades = BOI
    # BOIgrades = go_fast_BOI(BOI, BOIgrades)
    # # 保存影像
    # gdal_array.SaveArray(NDBWI_grades.astype(gdal_array.numpy.uint32),
    #                      'NDBWI_grades.tif', format="GTIFF", prototype='')
    # print("NDBWI_grades像生成成功！")
    # writetif(1, xsize, ysize, projection, geotransform, NDBWI_grades, "NDBWI_grades1.tif")
    # print("NDBWI_grades1图像生成成功！")
    # writetif(1, xsize, ysize, projection, geotransform, BOIgrades, "BOI_grades.tif")
    # print("BOI_grades图像生成成功！")


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



# 水质等级划分
@jit(nopython=True)
def go_fast_waterquality_all(COD, TP, NH3N, DO, watergrades_all):
    for row in range(COD.shape[0]):
        for col in range(COD.shape[1]):
            if COD[row, col] > 40 or TP[row, col] > 0.4 or NH3N[row, col] > 2.0 or DO[row, col] < 2:
                watergrades_all[row, col] = 6
            elif COD[row, col] > 30 or TP[row, col] > 0.3 or NH3N[row, col] > 1.5 or DO[row, col] < 3:
                watergrades_all[row, col] = 5
            elif COD[row, col] > 20 or TP[row, col] > 0.2 or NH3N[row, col] > 1.0 or DO[row, col] < 5:
                watergrades_all[row, col] = 4
            elif COD[row, col] > 15 or TP[row, col] > 0.1 or NH3N[row, col] > 0.5 or DO[row, col] < 6:
                watergrades_all[row, col] = 3
            elif COD[row, col] > 15 or TP[row, col] > 0.02 or NH3N[row, col] > 0.15 or DO[row, col] < 7.5:
                watergrades_all[row, col] = 2
            elif COD[row, col] <= 15 and TP[row, col] <= 0.02 and NH3N[row, col] <= 0.15 and DO[row, col] >= 7.5:
                watergrades_all[row, col] = 1
            # else:
            #     watergrades_all[row, col] = 0

    return watergrades_all


# 水质营养状态指数划分
@jit(nopython=True)
def go_fast_TLI(TLI, TLIgrades):
    for row in range(TLI.shape[0]):
        for col in range(TLI.shape[1]):
            if TLI[row, col] < 30:
                TLIgrades[row, col] = 1
            elif (TLI[row, col] >= 30) and (TLI[row, col] < 50):
                TLIgrades[row, col] = 2
            elif (TLI[row, col] >= 50) and (TLI[row, col] < 60):
                TLIgrades[row, col] = 3
            elif (TLI[row, col] >= 60) and (TLI[row, col] < 70):
                TLIgrades[row, col] = 4
            elif TLI[row, col] >= 70:
                TLIgrades[row, col] = 5
            else:
                TLIgrades[row, col] = 0
    return TLI, TLIgrades



# 黑臭水体划分
@jit(nopython=True)
def go_fast_NDBWI(NDBWI, NDBWI_grades):
    for row in range(NDBWI.shape[0]):
        for col in range(NDBWI.shape[1]):
            if NDBWI[row, col] >= 0.115 or NDBWI[row, col] <= -0.05:
                NDBWI_grades[row, col] = 1
                # print(NDBWI_grades[row, col])
            elif NDBWI[row, col] < 0.115 and NDBWI[row, col] > -0.05:
                NDBWI_grades[row, col] = 2
            else:
                NDBWI_grades[row, col] = 0
    return NDBWI_grades

# 黑臭水体划分
@jit(nopython=True)
def go_fast_BOI(BOI, BOIgrades):
    for row in range(BOI.shape[0]):
        for col in range(BOI.shape[1]):
            if BOI[row, col] >= 0.065:
                BOIgrades[row, col] = 1
                # print(BOIgrades[row, col])
            elif BOI[row, col] < 0.065:
                BOIgrades[row, col] = 2
            else:
                BOIgrades[row, col] = 0
    return BOIgrades


