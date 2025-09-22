import React, { useEffect, useRef, useState } from 'react'
import { Map, View } from 'ol'
import { defaults as defaultControls } from 'ol/control'
import ImageLayer from 'ol/layer/Image'
import Static from 'ol/source/ImageStatic'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'
import { Select, Button } from 'antd'
import GeoTIFFProcessor from '../utils/GeoTIFFProcessor'
import SimpleGeoTIFFLoader from '../utils/SimpleGeoTIFFLoader'
import { testSimpleGeoTIFF } from '../utils/SimpleGeoTIFFTest'
import 'ol/ol.css'
import './MapContainer.css'

interface ImageData {
  year: number
  path: string
  thumbnail: string
  ndvi: number
  metadata: {
    resolution: number
    acquisitionDate: string
    bands: string[]
    sensor: string
  }
}

interface MapContainerProps {
  year: number
  imageData?: ImageData
  onYearChange?: (year: number) => void
  onLoadData?: () => void
  selectedYear?: number
  years?: number[]
  currentYearData?: ImageData
}

// 底图类型
type BasemapType = 'gaode_vec' | 'osm'

// 底图配置
const mapSources = {
  // 高德地图 - 国内可访问，推荐
  gaode_vec: {
    url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    name: '高德地图'
  },
  // OpenStreetMap - 开源地图
  osm: {
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'OpenStreetMap'
  }
};

// 创建底图图层的函数
const createBasemapLayer = (basemapType: BasemapType): TileLayer<any> => {
  const config = mapSources[basemapType];
  
  const layer = new TileLayer({
    source: new OSM({
      url: config.url
    }),
    visible: true
  });

  // 设置图层属性
  (layer as any).set('id', 'base-map');
  (layer as any).set('label', config.name);
  
  return layer;
};

const MapContainer: React.FC<MapContainerProps> = ({ 
  year, 
  imageData, 
  onYearChange, 
  onLoadData, 
  selectedYear, 
  years, 
  currentYearData 
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapType>('osm')
  const basemapLayerRef = useRef<TileLayer<any> | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // 测试GeoTIFF库
  useEffect(() => {
    testSimpleGeoTIFF().then(success => {
      if (success) {
        console.log('✅ 简单GeoTIFF测试成功')
      } else {
        console.log('❌ 简单GeoTIFF测试失败')
      }
    })
  }, [])

  // 添加底图函数
  const addBaseMap = (map: Map, basemapType: BasemapType) => {
    const config = mapSources[basemapType];
    const basemapLayer = new TileLayer({
      source: new OSM({
        url: config.url
      }),
      visible: true
    });

    // 设置图层属性
    (basemapLayer as any).set('id', 'base-map');
    (basemapLayer as any).set('label', config.name);
    
    map.addLayer(basemapLayer);
    basemapLayerRef.current = basemapLayer;
    
    console.log(`添加${config.name}底图成功`);
  };

  useEffect(() => {
    if (!mapRef.current) return

    // 蒿坪镇全域地理范围 (经度, 纬度) - 往下移动视角
    const haopingBounds = {
      west: 108.50,   // 保持西边界
      south: 32.40,   // 向南移动
      east: 108.80,   // 保持东边界
      north: 32.70    // 向南移动
    }

    // 创建地图
    const map = new Map({
      target: mapRef.current,
      controls: defaultControls(),
      layers: [],
      view: new View({
        center: fromLonLat([
          (haopingBounds.west + haopingBounds.east) / 2,
          (haopingBounds.south + haopingBounds.north) / 2
        ]),
        zoom: 12  // 提高缩放级别以放大显示
      })
    })

    mapInstanceRef.current = map

    // 添加底图
    addBaseMap(map, selectedBasemap);

    // 强制地图更新
    setTimeout(() => {
      map.updateSize()
      const center = fromLonLat([
        (haopingBounds.west + haopingBounds.east) / 2,
        (haopingBounds.south + haopingBounds.north) / 2
      ])
      map.getView().setCenter(center)
      map.getView().setZoom(12)  // 保持与初始缩放级别一致
      console.log('地图中心坐标 (Web Mercator):', center)
      console.log('地图中心坐标 (经纬度):', [
        (haopingBounds.west + haopingBounds.east) / 2,
        (haopingBounds.south + haopingBounds.north) / 2
      ])
    }, 100)

    console.log('地图初始化完成，底图类型:', selectedBasemap)
    console.log('地图图层数量:', map.getLayers().getLength())
    console.log('地图容器尺寸:', mapRef.current?.offsetWidth, 'x', mapRef.current?.offsetHeight)
    console.log('地图视图中心:', map.getView().getCenter())
    console.log('地图缩放级别:', map.getView().getZoom())

    return () => {
      map.setTarget(undefined)
    }
  }, [selectedBasemap])

  // 底图切换处理
  const handleBasemapChange = (basemapType: BasemapType) => {
    if (!mapInstanceRef.current) return;
    
    console.log('切换底图到:', basemapType);
    
    // 移除当前底图
    const layers = mapInstanceRef.current.getLayers().getArray();
    const baseLayer = layers.find(layer => (layer as any).get('id') === 'base-map');
    if (baseLayer) {
      mapInstanceRef.current.removeLayer(baseLayer);
    }
    
    // 添加新底图
    addBaseMap(mapInstanceRef.current, basemapType);
    
    setSelectedBasemap(basemapType);
  }

  // 影像图层更新
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // 清除现有影像图层（保留底图）
    const layers = mapInstanceRef.current.getLayers().getArray()
    layers.forEach((layer, index) => {
      if (index > 0) { // 保留底图（索引0）
        mapInstanceRef.current!.removeLayer(layer)
      }
    })

    if (imageData) {
      console.log('添加影像图层:', imageData.year, imageData.thumbnail)
      
      // 蒿坪镇的地理范围 (经度, 纬度)
      const haopingExtent = [
        fromLonLat([108.45, 32.55])[0], // 西南角
        fromLonLat([108.45, 32.55])[1],
        fromLonLat([108.65, 32.75])[0], // 东北角
        fromLonLat([108.65, 32.75])[1]
      ]
      
      console.log('影像范围:', haopingExtent)
      console.log('影像URL:', imageData.thumbnail)
      
      // 异步加载GeoTIFF文件
      const loadGeoTIFFLayer = async () => {
        try {
          // 尝试加载GeoTIFF文件
          const geoTIFFUrl = imageData.thumbnail.replace('.png', '.tif')
          console.log('尝试加载GeoTIFF文件:', geoTIFFUrl)
          
          // 先尝试简化加载器
          let geoTIFFSource = await SimpleGeoTIFFLoader.createSimpleGeoTIFFSource(geoTIFFUrl)
          
          // 如果简化加载器失败，尝试完整处理器
          if (!geoTIFFSource) {
            console.log('简化加载器失败，尝试完整处理器...')
            geoTIFFSource = await GeoTIFFProcessor.createGeoTIFFSource(geoTIFFUrl)
          }
          
          if (geoTIFFSource) {
            console.log('GeoTIFF加载成功，使用解析后的数据')
            
            // 使用GeoTIFF解析后的数据
            const imageSource = new Static({
              url: geoTIFFSource.url,
              imageExtent: geoTIFFSource.extent,
              projection: geoTIFFSource.projection
            })
            
            // 创建影像图层
            const imageLayer = new ImageLayer({
              source: imageSource,
              opacity: 0.8
            })

            // 设置图层属性
            imageLayer.set('id', 'remote-sensing-image')
            imageLayer.set('year', imageData.year)
            
            // 添加到地图
            mapInstanceRef.current!.addLayer(imageLayer)
            
            // 调整地图视图到影像范围
            const view = mapInstanceRef.current!.getView()
            view.fit(geoTIFFSource.extent, { padding: [20, 20, 20, 20] })
            
          } else {
            throw new Error('所有GeoTIFF加载方法都失败')
          }
          
        } catch (error) {
          console.warn('GeoTIFF加载失败，使用备用方案:', error)
          
          // 备用方案：使用本地测试图像
          const fallbackUrl = `/images/2016/test-image.svg`
          
          const imageSource = new Static({
            url: fallbackUrl,
            imageExtent: haopingExtent,
            projection: 'EPSG:3857'
          })
          
          // 创建影像图层
          const imageLayer = new ImageLayer({
            source: imageSource,
            opacity: 0.8
          })

          // 设置图层属性
          imageLayer.set('id', 'remote-sensing-image')
          imageLayer.set('year', imageData.year)
          
          // 添加到地图
          mapInstanceRef.current!.addLayer(imageLayer)
          
          // 调整地图视图到影像范围
          const view = mapInstanceRef.current!.getView()
          view.fit(haopingExtent, { padding: [20, 20, 20, 20] })
        }
      }
      
      // 执行异步加载
      loadGeoTIFFLayer()
      
      // 显示数据加载成功提示
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000) // 3秒后自动隐藏
    }
  }, [year, imageData])

  return (
    <div className="map-container">
      {/* 底图选择器 */}
      <div className="basemap-selector">
        <label>底图选择：</label>
        <Select
          value={selectedBasemap}
          onChange={handleBasemapChange}
          style={{ width: 150, marginLeft: 8 }}
        >
          <Select.Option value="osm">OpenStreetMap</Select.Option>
          <Select.Option value="gaode_vec">高德地图</Select.Option>
        </Select>
      </div>

      {/* 左下角控制按钮 */}
      <div className="map-controls">
        <div className="control-group">
          <label>选择年份：</label>
          <Select
            value={selectedYear || year}
            onChange={onYearChange}
            style={{ width: 120, marginLeft: 8 }}
          >
            {years?.map(year => (
              <Select.Option key={year} value={year}>
                {year}年
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="control-group">
          <Button onClick={onLoadData} size="small">
            重新加载数据
          </Button>
        </div>
        {currentYearData && (
          <div className="control-group">
            <span>NDVI值：{currentYearData.ndvi.toFixed(3)}</span>
          </div>
        )}
      </div>
      
      <div ref={mapRef} className="map" />
      
      {/* 数据加载成功提示 */}
      {showSuccessMessage && (
        <div className="success-message">
          <div className="success-content">
            <span className="success-icon">✓</span>
            <span>数据加载成功</span>
          </div>
        </div>
      )}
      
      {imageData && (
        <div className="map-info">
          <p>年份: {imageData.year}</p>
          <p>传感器: {imageData.metadata.sensor}</p>
          <p>NDVI: {imageData.ndvi.toFixed(3)}</p>
          <p>分辨率: {imageData.metadata.resolution}m</p>
          <p>获取日期: {imageData.metadata.acquisitionDate}</p>
        </div>
      )}
    </div>
  )
}

export default MapContainer