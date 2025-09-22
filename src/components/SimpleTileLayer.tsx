import React, { useEffect, useRef, useState } from 'react'
import { Map, View } from 'ol'
import { defaults as defaultControls } from 'ol/control'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import { get as getProjection } from 'ol/proj'
import TileGrid from 'ol/tilegrid/TileGrid'
import { Select, Button, Spin, message } from 'antd'
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

interface SimpleTileLayerProps {
  year: number
  onYearChange?: (year: number) => void
  years?: number[]
  currentYearData?: ImageData
}

// 蒿坪镇地理边界配置 (基于实际坐标)
const HAOPING_BOUNDS = {
  west: 108.556,   // 108°33'21.92"E
  south: 32.479,   // 32°28'43.75"N
  east: 108.772,   // 108°46'18.66"E
  north: 32.647,   // 32°38'49.37"N
  center: [108.664, 32.563] as [number, number]  // 108°39'50.29"E, 32°33'46.70"N
}

// 瓦片配置 - 使用正确的地理范围
const TILE_CONFIGS = {
  2003: {
    url: 'http://localhost:8001/tiles/2003/{z}/{x}/{y}.png',
    name: '2003年SPOT-5影像',
    center: [108.55, 32.65], // 蒿坪镇中心
    zoom: 4,
    projection: 'EPSG:3857',
    bounds: [108.45, 32.55, 108.65, 32.75] // 蒿坪镇范围
  },
  2013: {
    url: 'http://localhost:8001/tiles/2013/{z}/{x}/{y}.png',
    name: '2013年Landsat-8影像',
    center: [108.55, 32.65], // 蒿坪镇中心
    zoom: 4,
    projection: 'EPSG:3857',
    bounds: [108.45, 32.55, 108.65, 32.75] // 蒿坪镇范围
  },
  2016: {
    url: 'http://localhost:8001/tiles/2016_geoscene_0917/{z}/{x}/{y}.png',
    name: '2016年GF-2影像 (GeoScene Pro 0917版)',
    center: [108.664, 32.563], // 蒿坪镇中心 (基于实际坐标)
    zoom: 8,
    projection: 'EPSG:3857',
    bounds: [108.556, 32.479, 108.772, 32.647], // 蒿坪镇范围 (基于实际坐标)
    minZoom: 6,
    maxZoom: 10
  }
}

const SimpleTileLayer: React.FC<SimpleTileLayerProps> = ({ 
  year, 
  onYearChange, 
  years, 
  currentYearData 
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const [selectedBasemap, setSelectedBasemap] = useState<'osm' | 'gaode_vec'>('osm')
  const [loading, setLoading] = useState(false)

  // 底图配置
  const basemapSources = {
    osm: {
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      name: 'OpenStreetMap'
    },
    gaode_vec: {
      url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      name: '高德地图'
    }
  }

  // 创建底图图层
  const createBasemapLayer = (basemapType: 'osm' | 'gaode_vec') => {
    const config = basemapSources[basemapType]
    return new TileLayer({
      source: new OSM({
        url: config.url
      }),
      visible: true
    })
  }

  // 创建遥感影像瓦片图层
  const createImageTileLayer = (year: number) => {
    const config = TILE_CONFIGS[year as keyof typeof TILE_CONFIGS]
    if (!config) return null

    console.log('创建瓦片图层:', config.url)
    console.log('瓦片配置:', config)

    return new TileLayer({
      source: new XYZ({
        url: config.url,
        projection: 'EPSG:3857',
        minZoom: config.minZoom || 0,
        maxZoom: config.maxZoom || 4
      }),
      visible: true,
      opacity: 0.8
    })
  }

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current) return

    console.log('🗺️ 初始化简单瓦片地图...')

    // 延迟初始化，确保容器有尺寸
    const initMap = () => {
      if (!mapRef.current) return

      const map = new Map({
        target: mapRef.current,
        controls: defaultControls(),
        layers: [],
        view: new View({
          center: fromLonLat(HAOPING_BOUNDS.center),
          zoom: 8,
          minZoom: 6,
          maxZoom: 10,
          projection: 'EPSG:3857'
        })
      })

      mapInstanceRef.current = map

      // 添加底图
      const basemapLayer = createBasemapLayer(selectedBasemap)
      basemapLayer.set('id', 'base-map')
      map.addLayer(basemapLayer)

      // 添加遥感影像瓦片图层
      const imageLayer = createImageTileLayer(year)
      if (imageLayer) {
        imageLayer.set('id', 'image-tiles')
        map.addLayer(imageLayer)
        console.log(`✅ 添加${year}年遥感影像瓦片图层`)
        console.log('瓦片图层URL:', imageLayer.getSource().getUrls())
        
        // 添加瓦片加载事件监听
        const source = imageLayer.getSource()
        source.on('tileloadstart', (event) => {
          console.log('瓦片开始加载:', event.tile)
        })
        source.on('tileloadend', (event) => {
          console.log('瓦片加载完成:', event.tile)
        })
        source.on('tileloaderror', (event) => {
          console.error('瓦片加载失败:', event.tile)
        })
      } else {
        console.warn(`❌ 无法创建${year}年遥感影像瓦片图层`)
      }

      // 设置地图视图到蒿坪镇范围
      setTimeout(() => {
        map.updateSize()
        const view = map.getView()
        
        // 蒿坪镇范围 (Web Mercator坐标)
        const haopingExtent = [
          fromLonLat([HAOPING_BOUNDS.west, HAOPING_BOUNDS.south])[0], // 西南角X
          fromLonLat([HAOPING_BOUNDS.west, HAOPING_BOUNDS.south])[1], // 西南角Y
          fromLonLat([HAOPING_BOUNDS.east, HAOPING_BOUNDS.north])[0], // 东北角X
          fromLonLat([HAOPING_BOUNDS.east, HAOPING_BOUNDS.north])[1]  // 东北角Y
        ]
        
        console.log('蒿坪镇范围 (Web Mercator):', haopingExtent)
        console.log('蒿坪镇范围 (经纬度):', [
          HAOPING_BOUNDS.west, HAOPING_BOUNDS.south,
          HAOPING_BOUNDS.east, HAOPING_BOUNDS.north
        ])
        
        view.fit(haopingExtent, { padding: [20, 20, 20, 20] })
        console.log('🎯 地图视图已设置到蒿坪镇范围')
        console.log('当前地图中心:', view.getCenter())
        console.log('当前缩放级别:', view.getZoom())
      }, 200)
    }

    // 延迟初始化
    const timer = setTimeout(initMap, 100)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
      }
    }
  }, [selectedBasemap, year])

  // 切换底图
  const handleBasemapChange = (basemapType: 'osm' | 'gaode_vec') => {
    if (!mapInstanceRef.current) return

    console.log('🔄 切换底图到:', basemapType)

    // 移除旧底图
    const layers = mapInstanceRef.current.getLayers().getArray()
    const baseLayer = layers.find(layer => (layer as any).get('id') === 'base-map')
    if (baseLayer) {
      mapInstanceRef.current.removeLayer(baseLayer)
    }

    // 添加新底图
    const newBasemapLayer = createBasemapLayer(basemapType)
    newBasemapLayer.set('id', 'base-map')
    mapInstanceRef.current.addLayer(newBasemapLayer)

    setSelectedBasemap(basemapType)
  }

  // 重新加载数据
  const handleReloadData = () => {
    setLoading(true)
    message.loading('正在重新加载数据...', 1)
    
    setTimeout(() => {
      setLoading(false)
      message.success('数据重新加载完成')
    }, 1000)
  }

  return (
    <div className="map-container">
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

      <div className="map-controls">
        <div className="control-group">
          <label>选择年份：</label>
          <Select
            value={year}
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
          <Button onClick={handleReloadData} size="small" loading={loading}>
            重新加载数据
          </Button>
        </div>
        {currentYearData && (
          <div className="control-group">
            <span>NDVI值：{currentYearData.ndvi.toFixed(3)}</span>
          </div>
        )}
      </div>
      
      <Spin spinning={loading}>
        <div ref={mapRef} className="map" />
      </Spin>
      
      {currentYearData && (
        <div className="map-info">
          <p>年份: {currentYearData.year}</p>
          <p>传感器: {currentYearData.metadata.sensor}</p>
          <p>NDVI: {currentYearData.ndvi.toFixed(3)}</p>
          <p>分辨率: {currentYearData.metadata.resolution}m</p>
          <p>获取日期: {currentYearData.metadata.acquisitionDate}</p>
        </div>
      )}
    </div>
  )
}

export default SimpleTileLayer
