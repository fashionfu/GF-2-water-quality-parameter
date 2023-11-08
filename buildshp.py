# -*- coding: UTF-8 -*-
'''
@Project ：PycharmDemo 
@File    ：buildshp.py
@IDE     ：PyCharm 
@Author  ：10208 
@Date    ：2023/3/30 17:24 
'''
from osgeo import gdal
from osgeo import ogr, osr                  # 导入处理shp文件的库
import os

def raster2shp(src, tgt):
    """
    函数输入的是一个二值影像，利用这个二值影像，创建shp文件
    """
    # src = "extracted_img.tif"
    # 输出的shapefile文件名称
    # tgt = "extract.shp"
    # 图层名称
    tgtLayer = "extract"
    # 打开输入的栅格文件
    srcDS = gdal.Open(src)
    # 获取第一个波段
    band = srcDS.GetRasterBand(1)
    # 让gdal库使用该波段作为遮罩层
    mask = band
    # 创建输出的shapefile文件
    driver = ogr.GetDriverByName("ESRI Shapefile")
    shp = driver.CreateDataSource(tgt)
    # 拷贝空间索引
    srs = osr.SpatialReference()
    srs.ImportFromWkt(srcDS.GetProjectionRef())
    layer = shp.CreateLayer(tgtLayer, srs=srs)
    # 创建dbf文件
    fd = ogr.FieldDefn("DN", ogr.OFTInteger)
    layer.CreateField(fd)
    dst_field = 0
    # 从图片中自动提取特征
    extract = gdal.Polygonize(band, mask, layer, dst_field, [], None)



def raster2vector(raster_path, vecter_path, ignore_values=None):
    # 读取路径中的栅格数据
    raster = gdal.Open(raster_path)
    # in_band 为想要转为矢量的波段,一般需要进行转矢量的栅格都是单波段分类结果
    # 若栅格为多波段,需要提前转换为单波段
    band = raster.GetRasterBand(1)

    # 读取栅格的投影信息,为后面生成的矢量赋予相同的投影信息
    prj = osr.SpatialReference()
    prj.ImportFromWkt(raster.GetProjection())

    drv = ogr.GetDriverByName("ESRI Shapefile")
    # 若文件已经存在,删除
    if os.path.exists(vecter_path):
        drv.DeleteDataSource(vecter_path)

    # 创建目标文件
    polygon = drv.CreateDataSource(vecter_path)
    # 创建面图层
    poly_layer = polygon.CreateLayer(vecter_path[:-4], srs=prj, geom_type=ogr.wkbMultiPolygon)
    # 添加浮点型字段,用来存储栅格的像素值
    field = ogr.FieldDefn("class", ogr.OFTReal)
    poly_layer.CreateField(field)

    # FPolygonize将每个像元转成一个矩形，然后将相似的像元进行合并
    # 设置矢量图层中保存像元值的字段序号为0
    gdal.FPolygonize(band, None, poly_layer, 0)

    # 删除ignore_value链表中的类别要素
    if ignore_values is not None:
        for feature in poly_layer:
            class_value = feature.GetField('class')
            for ignore_value in ignore_values:
                if class_value == ignore_value:
                    # 通过FID删除要素
                    poly_layer.DeleteFeature(feature.GetFID())
                    break

    polygon.SyncToDisk()
    polygon = None
    print("创建矢量shp文件成功")
