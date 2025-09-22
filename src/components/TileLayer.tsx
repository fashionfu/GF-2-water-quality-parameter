import React, { useEffect, useRef, useState } from 'react'
import { Map, View } from 'ol'
import { defaults as defaultControls } from 'ol/control'
import TileLayer from 'ol/layer/Tile'
import ImageLayer from 'ol/layer/Image'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import Static from 'ol/source/ImageStatic'
import { fromLonLat } from 'ol/proj'
import { createXYZ } from 'ol/tilegrid'
import { Select, Button, message } from 'antd'
import 'ol/ol.css'
import './TileLayer.css'

interface TileLayerProps {
  year: number
  onYearChange?: (year: number) => void
  years?: number[]
  currentYearData?: any
}

type BasemapType = 'osm' | 'gaode_vec'

const mapSources = {
  osm: {
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'OpenStreetMap'
  },
  gaode_vec: {
    url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    name: '高德地图'
  }
}

// 蒿坪镇遥感影像瓦片配置
const REMOTE_SENSING_TILES = {
  2003: {
    url: 'http://localhost:8001/tiles/2003/{z}/{x}/{y}.png',
    name: '2003年SPOT-5影像',
    center: [108.65, 32.55],
    zoom: 12,
    projection: 'EPSG:3857'
  },
  2013: {
    url: 'http://localhost:8001/tiles/2013/{z}/{x}/{y}.png',
    name: '2013年Landsat-8影像',
    center: [108.65, 32.55],
    zoom: 12,
    projection: 'EPSG:3857'
  },
  2016: {
    url: 'http://localhost:8001/tiles/2016_webmercator_tiles/{z}/{x}/{y}.png',
    name: '2016年GF-2影像',
    center: [108.65, 32.55],
    zoom: 12,
    projection: 'EPSG:3857'
  }
}

const TileLayerComponent: React.FC<TileLayerProps> = ({ 
  year, 
  onYearChange, 
  years, 
  currentYearData 
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapType>('osm')
  const [remoteSensingLayer, setRemoteSensingLayer] = useState<TileLayer<any> | null>(null)
  const [loading, setLoading] = useState(false)

  // 创建底图图层
  const createBasemapLayer = (basemapType: BasemapType): TileLayer<any> => {
    const config = mapSources[basemapType]
    
    const layer = new TileLayer({
      source: new OSM({
        url: config.url
      }),
      visible: true
    })

    ;(layer as any).set('id', 'base-map')
    ;(layer as any).set('label', config.name)
    
    return layer
  }

  // 创建遥感影像瓦片图层
  const createRemoteSensingLayer = (year: number): TileLayer<any> | null => {
    const config = REMOTE_SENSING_TILES[year as keyof typeof REMOTE_SENSING_TILES]
    
    if (!config) {
      console.warn(`未找到${year}年的瓦片配置`)
      return null
    }

    console.log(`创建${year}年遥感影像瓦片图层:`, config)

    const layer = new TileLayer({
      source: new XYZ({
        url: config.url,
        projection: config.projection,
        tileGrid: createXYZ({
          maxZoom: 15,
          minZoom: 0
        })
      }),
      visible: true,
      opacity: 0.8
    })

    ;(layer as any).set('id', 'remote-sensing-tiles')
    ;(layer as any).set('year', year)
    ;(layer as any).set('label', config.name)
    
    return layer
  }

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current) return

    const haopingBounds = {
      west: 108.50,
      south: 32.40,
      east: 108.80,
      north: 32.70
    }

    const map = new Map({
      target: mapRef.current,
      controls: defaultControls(),
      layers: [],
      view: new View({
        center: fromLonLat([
          (haopingBounds.west + haopingBounds.east) / 2,
          (haopingBounds.south + haopingBounds.north) / 2
        ]),
        zoom: 12,
        projection: 'EPSG:3857'
      })
    })

    mapInstanceRef.current = map

    // 添加底图
    const basemapLayer = createBasemapLayer(selectedBasemap)
    map.addLayer(basemapLayer)

    // 添加遥感影像瓦片图层
    const remoteLayer = createRemoteSensingLayer(year)
    if (remoteLayer) {
      map.addLayer(remoteLayer)
      setRemoteSensingLayer(remoteLayer)
      console.log('遥感影像瓦片图层已添加:', year)
    } else {
      console.warn('无法创建遥感影像瓦片图层:', year)
    }

    // 设置地图视图
    setTimeout(() => {
      map.updateSize()
      const center = fromLonLat([
        (haopingBounds.west + haopingBounds.east) / 2,
        (haopingBounds.south + haopingBounds.north) / 2
      ])
      map.getView().setCenter(center)
      map.getView().setZoom(12)
    }, 100)

    console.log('瓦片地图初始化完成')

    return () => {
      map.setTarget(undefined)
    }
  }, [selectedBasemap, year])

  // 切换底图
  const handleBasemapChange = (basemapType: BasemapType) => {
    if (!mapInstanceRef.current) return
    
    console.log('切换底图到:', basemapType)
    
    // 移除旧底图
    const layers = mapInstanceRef.current.getLayers().getArray()
    const baseLayer = layers.find(layer => (layer as any).get('id') === 'base-map')
    if (baseLayer) {
      mapInstanceRef.current.removeLayer(baseLayer)
    }
    
    // 添加新底图
    const newBasemapLayer = createBasemapLayer(basemapType)
    mapInstanceRef.current.addLayer(newBasemapLayer)
    
    setSelectedBasemap(basemapType)
  }

  // 切换遥感影像年份
  const handleYearChange = (newYear: number) => {
    if (!mapInstanceRef.current) return
    
    setLoading(true)
    
    try {
      // 移除旧遥感影像图层
      if (remoteSensingLayer) {
        mapInstanceRef.current.removeLayer(remoteSensingLayer)
      }
      
      // 添加新遥感影像图层
      const newRemoteLayer = createRemoteSensingLayer(newYear)
      if (newRemoteLayer) {
        mapInstanceRef.current.addLayer(newRemoteLayer)
        setRemoteSensingLayer(newRemoteLayer)
        
        // 调整视图到新影像
        const config = REMOTE_SENSING_TILES[newYear as keyof typeof REMOTE_SENSING_TILES]
        if (config) {
          const view = mapInstanceRef.current.getView()
          view.setCenter(fromLonLat(config.center))
          view.setZoom(config.zoom)
        }
        
        message.success(`${newYear}年遥感影像加载成功`)
      } else {
        message.warning(`${newYear}年遥感影像瓦片不存在`)
      }
      
      onYearChange?.(newYear)
      
    } catch (error) {
      console.error('切换遥感影像失败:', error)
      message.error('遥感影像加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 检查瓦片服务器状态
  const checkTileServer = async () => {
    try {
      const response = await fetch('http://localhost:8001/tiles/2016/0/0/0.png', {
        method: 'HEAD'
      })
      
      if (response.ok) {
        message.success('瓦片服务器连接正常')
      } else {
        message.warning('瓦片服务器响应异常')
      }
    } catch (error) {
      message.error('无法连接到瓦片服务器，请确保服务器已启动')
    }
  }

  return (
    <div className="tile-layer-container">
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

      {/* 控制面板 */}
      <div className="tile-controls">
        <div className="control-group">
          <label>选择年份：</label>
          <Select
            value={year}
            onChange={handleYearChange}
            style={{ width: 120, marginLeft: 8 }}
            loading={loading}
          >
            {years?.map(year => (
              <Select.Option key={year} value={year}>
                {year}年
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <div className="control-group">
          <Button onClick={checkTileServer} size="small">
            检查服务器
          </Button>
        </div>
        
        {currentYearData && (
          <div className="control-group">
            <span>NDVI值：{currentYearData.ndvi?.toFixed(3) || 'N/A'}</span>
          </div>
        )}
      </div>
      
      {/* 地图容器 */}
      <div ref={mapRef} className="tile-map" />
      
      {/* 状态信息 */}
      <div className="tile-status">
        <p>当前显示: {REMOTE_SENSING_TILES[year as keyof typeof REMOTE_SENSING_TILES]?.name || '未知'}</p>
        <p>瓦片服务器: http://localhost:8001</p>
        <p>投影系统: EPSG:4326</p>
        <p>测试页面: <a href="http://localhost:8001/test_tiles.html" target="_blank">打开测试</a></p>
      </div>
    </div>
  )
}

export default TileLayerComponent
