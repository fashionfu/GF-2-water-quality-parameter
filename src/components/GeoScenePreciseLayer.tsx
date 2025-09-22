import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import TileArcGISRest from 'ol/source/TileArcGISRest';
import OSM from 'ol/source/OSM';
import TileGrid from 'ol/tilegrid/TileGrid';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, get as getProjection } from 'ol/proj';
import { Select, Button, message } from 'antd';
import * as olExtent from 'ol/extent';
import './MapContainer.css';

const { Option } = Select;

// 基于服务元数据的精确配置
const PRECISE_CONFIG = {
  // 服务URL配置
  tileServiceUrl: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer',
  tileUrl: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer/tile/{z}/{y}/{x}',
  jsapiUrl: 'https://geoscence51.geoscene.cn:6443/geoscene/rest/services/Hosted/GF2_data_3857/MapServer?f=jsapi',
  
  // 精确的地理范围 (来自服务元数据)
  geoExtent: {
    xmin: 108.556089991995194,
    ymin: 32.478813272518501,
    xmax: 108.771856340087851,
    ymax: 32.647048539145018
  },
  
  // Web Mercator范围 (来自服务元数据)
  webMercatorExtent: {
    xmin: 12084408.6604176853,
    ymin: 3826327.72376103653,
    xmax: 12108427.6604176853,
    ymax: 3848548.72376103653
  },
  
  // 初始范围 (来自服务元数据)
  initialExtent: {
    xmin: 12084783.34152266,
    ymin: 3827413.09650263982,
    xmax: 12108073.6832607277,
    ymax: 3847463.89650263963
  },
  
  // 瓦片网格配置 (来自XML配置)
  tileGrid: {
    origin: [-20037508.342787001, 20037508.342787001],
    tileSize: [256, 256],
    resolutions: [
      156543.03392799999,    // Level 0
      78271.516963999893,    // Level 1
      39135.758482000099,    // Level 2
      19567.879240999901,    // Level 3
      9783.9396204999593,    // Level 4
      4891.9698102499797,    // Level 5
      2445.9849051249898,    // Level 6
      1222.9924525624899,    // Level 7
      611.49622628138002,    // Level 8
      305.74811314055802,    // Level 9
      152.874056570411,      // Level 10
      76.437028285073197,    // Level 11
      38.218514142536598,    // Level 12
      19.109257071268299,    // Level 13
      9.5546285356341496,    // Level 14
      4.7773142679493699,    // Level 15
      2.38865713397468,      // Level 16
      1.1943285668550501,    // Level 17
      0.59716428355981699,   // Level 18
      0.29858214164761698,   // Level 19
      0.14929107082380833,   // Level 20
      0.074645535411904163,  // Level 21
      0.037322767705952081,  // Level 22
      0.018661383852976041   // Level 23
    ]
  },
  
  // 缩放级别限制 (来自服务元数据)
  zoomLevels: {
    minLOD: 0,
    maxLOD: 18,
    minScale: 591657527.591555,
    maxScale: 2256.994353
  }
};

// 底图配置
const BASE_MAPS = {
  osm: {
    name: 'OpenStreetMap',
    source: () => new OSM()
  },
  gaode: {
    name: '高德地图',
    source: () => new XYZ({
      url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
      wrapX: false
    })
  }
};

const GeoScenePreciseLayer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [baseMapType, setBaseMapType] = useState<keyof typeof BASE_MAPS>('osm');
  const [isLoading, setIsLoading] = useState(false);
  const [remoteSensingLayer, setRemoteSensingLayer] = useState<TileLayer<XYZ> | null>(null);
  const [tileGrid, setTileGrid] = useState<TileGrid | null>(null);

  // 创建精确的瓦片网格
  useEffect(() => {
    const grid = new TileGrid({
      origin: PRECISE_CONFIG.tileGrid.origin,
      resolutions: PRECISE_CONFIG.tileGrid.resolutions,
      tileSize: PRECISE_CONFIG.tileGrid.tileSize,
      // 移除 extent，让 TileGrid 在全局范围内生效，避免与 view 的 extent 冲突
    });
    setTileGrid(grid);
    console.log('✅ 创建精确瓦片网格:', {
      origin: PRECISE_CONFIG.tileGrid.origin,
      resolutionCount: PRECISE_CONFIG.tileGrid.resolutions.length,
      extent: [
        PRECISE_CONFIG.webMercatorExtent.xmin,
        PRECISE_CONFIG.webMercatorExtent.ymin,
        PRECISE_CONFIG.webMercatorExtent.xmax,
        PRECISE_CONFIG.webMercatorExtent.ymax
      ]
    });
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const baseLayer = new TileLayer({
        source: BASE_MAPS[baseMapType].source()
      });

      const map = new Map({
        target: mapRef.current,
        layers: [baseLayer],
        view: new View({
          center: fromLonLat([
            (PRECISE_CONFIG.geoExtent.xmin + PRECISE_CONFIG.geoExtent.xmax) / 2,
            (PRECISE_CONFIG.geoExtent.ymin + PRECISE_CONFIG.geoExtent.ymax) / 2
          ]),
          zoom: 12,
          minZoom: PRECISE_CONFIG.zoomLevels.minLOD,
          maxZoom: PRECISE_CONFIG.zoomLevels.maxLOD,
          projection: 'EPSG:3857',
          extent: [
            PRECISE_CONFIG.webMercatorExtent.xmin,
            PRECISE_CONFIG.webMercatorExtent.ymin,
            PRECISE_CONFIG.webMercatorExtent.xmax,
            PRECISE_CONFIG.webMercatorExtent.ymax
          ]
        })
      });

      mapInstanceRef.current = map;
      console.log('🗺️ 精确配置地图初始化完成');
      console.log('📍 地图中心 (经纬度):', [
        (PRECISE_CONFIG.geoExtent.xmin + PRECISE_CONFIG.geoExtent.xmax) / 2,
        (PRECISE_CONFIG.geoExtent.ymin + PRECISE_CONFIG.geoExtent.ymax) / 2
      ]);
      console.log('🔍 缩放级别限制:', PRECISE_CONFIG.zoomLevels);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [baseMapType]);

  // 切换底图
  const switchBaseMap = (newBaseMapType: keyof typeof BASE_MAPS) => {
    if (!mapInstanceRef.current) return;

    const currentLayers = mapInstanceRef.current.getLayers().getArray();
    const currentBaseLayer = currentLayers[0];

    if (currentBaseLayer) {
      mapInstanceRef.current.removeLayer(currentBaseLayer);
    }

    const newBaseLayer = new TileLayer({
      source: BASE_MAPS[newBaseMapType].source()
    });
    mapInstanceRef.current.getLayers().insertAt(0, newBaseLayer);
    setBaseMapType(newBaseMapType);
    console.log(`切换底图到: ${BASE_MAPS[newBaseMapType].name}`);
  };

  // 测试服务连接
  const testServiceConnection = async () => {
    setIsLoading(true);
    console.log('🔗 测试精确配置的服务连接');
    
    try {
      const testUrls = [
        PRECISE_CONFIG.tileServiceUrl,
        PRECISE_CONFIG.jsapiUrl,
        `${PRECISE_CONFIG.tileServiceUrl}?f=json`
      ];

      const results = [];
      for (const url of testUrls) {
        try {
          const start = Date.now();
          const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
          });
          const end = Date.now();
          
          results.push({
            url: url.split('/').pop(),
            status: response.status,
            time: end - start,
            ok: response.ok
          });
          
          console.log(`📡 ${url}: ${response.status} (${end - start}ms)`);
        } catch (error) {
          results.push({
            url: url.split('/').pop(),
            status: 'ERROR',
            time: 0,
            ok: false
          });
          console.error(`❌ ${url}:`, error);
        }
      }

      const successCount = results.filter(r => r.ok).length;
      if (successCount > 0) {
        message.success(`服务连接测试: ${successCount}/${results.length} 成功`);
      } else {
        message.error('服务连接测试失败');
      }

    } catch (error: any) {
      console.error('服务连接测试异常:', error);
      message.error(`连接测试异常: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载精确配置的瓦片图层 (调试版本)
  const loadPreciseTileLayer = async () => {
    if (!mapInstanceRef.current) {
      message.error('地图未初始化');
      return;
    }
    if (!tileGrid) {
      message.error('瓦片网格配置未加载，请稍后重试');
      return;
    }

    setIsLoading(true);
    console.log('🚀 开始加载精确配置的瓦片图层 (调试模式)');

    try {
      // 清除所有现有图层
      const currentLayers = mapInstanceRef.current.getLayers().getArray();
      console.log(`🧹 清除现有图层数量: ${currentLayers.length}`);
      currentLayers.forEach(layer => {
        mapInstanceRef.current!.removeLayer(layer);
      });

      // 先手动测试一个瓦片URL
      const testTileUrl = PRECISE_CONFIG.tileUrl.replace('{z}', '12').replace('{x}', '3285').replace('{y}', '1654');
      console.log('🧪 手动测试瓦片URL:', testTileUrl);
      
      try {
        const testResponse = await fetch(testTileUrl);
        console.log('📊 瓦片响应状态:', testResponse.status, testResponse.statusText);
        console.log('📊 瓦片响应头:', Object.fromEntries(testResponse.headers.entries()));
        console.log('📊 瓦片内容长度:', testResponse.headers.get('content-length'));
        console.log('📊 瓦片内容类型:', testResponse.headers.get('content-type'));
      } catch (testError) {
        console.error('❌ 瓦片测试失败:', testError);
      }

      console.log('📋 使用配置:', {
        tileUrl: PRECISE_CONFIG.tileUrl,
        extent: [
          PRECISE_CONFIG.webMercatorExtent.xmin,
          PRECISE_CONFIG.webMercatorExtent.ymin,
          PRECISE_CONFIG.webMercatorExtent.xmax,
          PRECISE_CONFIG.webMercatorExtent.ymax
        ]
      });

      // 渲染修复版本 - 强制可见性
      const tileLayer = new TileLayer({
        source: new XYZ({
          url: PRECISE_CONFIG.tileUrl,
          crossOrigin: 'anonymous',
          tileGrid: tileGrid, // 恢复使用精确的瓦片网格
        }),
        opacity: 1.0,
        visible: true,
        // 强制最高渲染优先级
        zIndex: 1000,
        // 设置渲染模式
        preload: 0,
        useInterimTilesOnError: false
      });

      // 添加详细的事件监听
      const source = tileLayer.getSource();
      if (source) {
        source.on('tileloadstart', (event: any) => {
          console.log('📡 开始加载瓦片 (调试模式):', event);
        });

        source.on('tileloadend', (event: any) => {
          console.log('✅ 瓦片加载完成 (调试模式):', event);
        });

        source.on('tileloaderror', (event: any) => {
          console.error('❌ 瓦片加载错误 (调试模式):', event);
        });
      }

      // 添加图层到地图
      console.log('添加遥感图层到地图 (渲染修复模式)');
      mapInstanceRef.current.addLayer(tileLayer);
      setRemoteSensingLayer(tileLayer);

      // 设置地图背景
      const mapElement = mapInstanceRef.current.getTargetElement();
      if (mapElement) {
        (mapElement as HTMLElement).style.backgroundColor = '#000000';
        console.log('🎨 设置地图背景为黑色');
      }

      // 获取当前视图信息
      const view = mapInstanceRef.current.getView();
      const currentCenter = view.getCenter();
      const currentZoom = view.getZoom();
      const currentExtent = view.calculateExtent();
      
      console.log('🗺️ 当前视图信息:', {
        center: currentCenter,
        zoom: currentZoom,
        extent: currentExtent
      });

      // 缩放到服务范围
      console.log('🎯 缩放到服务范围');
      view.fit([
        PRECISE_CONFIG.webMercatorExtent.xmin,
        PRECISE_CONFIG.webMercatorExtent.ymin,
        PRECISE_CONFIG.webMercatorExtent.xmax,
        PRECISE_CONFIG.webMercatorExtent.ymax
      ], {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 15
      });

      // 等待一秒后输出最终状态
      setTimeout(() => {
        const finalCenter = view.getCenter();
        const finalZoom = view.getZoom();
        const finalExtent = view.calculateExtent();
        const layerCount = mapInstanceRef.current?.getLayers().getLength();
        
        console.log('🔍 最终状态:', {
          center: finalCenter,
          zoom: finalZoom,
          extent: finalExtent,
          layerCount: layerCount,
          layerVisible: tileLayer.getVisible(),
          layerOpacity: tileLayer.getOpacity()
        });
      }, 1500);

      message.success('调试模式瓦片图层加载完成！请查看控制台详细信息');
      console.log('🎉 调试模式瓦片图层添加成功，等待瓦片加载...');

    } catch (error: any) {
      console.error('调试模式瓦片加载失败:', error);
      message.error(`瓦片加载失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 清除遥感图层
  const clearRemoteSensingLayer = () => {
    if (!mapInstanceRef.current) {
      message.error('地图未初始化');
      return;
    }
    
    if (remoteSensingLayer) {
      mapInstanceRef.current.removeLayer(remoteSensingLayer);
      setRemoteSensingLayer(null);
      message.success('已清除遥感图层');
    } else {
      message.info('没有遥感图层需要清除');
    }
  };

  // 重置地图视图到服务范围
  const resetToServiceExtent = () => {
    if (!mapInstanceRef.current) return;
    
    const view = mapInstanceRef.current.getView();
    view.fit([
      PRECISE_CONFIG.webMercatorExtent.xmin,
      PRECISE_CONFIG.webMercatorExtent.ymin,
      PRECISE_CONFIG.webMercatorExtent.xmax,
      PRECISE_CONFIG.webMercatorExtent.ymax
    ], { 
      padding: [50, 50, 50, 50], 
      duration: 800, 
      maxZoom: 15 
    });
    
    message.info('地图视图已重置到服务完整范围');
  };

  // 恢复底图
  const restoreBaseMap = () => {
    if (!mapInstanceRef.current) return;

    // 检查是否已有底图
    const currentLayers = mapInstanceRef.current.getLayers().getArray();
    const hasBaseMap = currentLayers.some(layer => 
      layer.getSource() instanceof OSM || layer.getSource() instanceof XYZ
    );

    if (hasBaseMap && currentLayers.length > 1) {
      message.info('底图已存在');
      return;
    }

    // 添加底图
    const baseLayer = new TileLayer({
      source: BASE_MAPS[baseMapType].source()
    });
    
    // 将底图插入到最底层
    mapInstanceRef.current.getLayers().insertAt(0, baseLayer);
    
    // 恢复白色背景
    const mapElement = mapInstanceRef.current.getTargetElement();
    if (mapElement) {
      (mapElement as HTMLElement).style.backgroundColor = '#ffffff';
      console.log('🎨 恢复地图背景为白色');
    }

    message.success(`已恢复${BASE_MAPS[baseMapType].name}底图`);
    console.log(`恢复底图: ${BASE_MAPS[baseMapType].name}`);
  };

  // 使用ArcGIS REST源加载 (简化方法)
  const loadArcGISRestLayer = async () => {
    if (!mapInstanceRef.current) {
      message.error('地图未初始化');
      return;
    }

    setIsLoading(true);
    console.log('🚀 使用ArcGIS REST源加载瓦片');

    try {
      // 清除所有现有图层
      const currentLayers = mapInstanceRef.current.getLayers().getArray();
      console.log(`🧹 清除现有图层数量: ${currentLayers.length}`);
      currentLayers.forEach(layer => {
        mapInstanceRef.current!.removeLayer(layer);
      });

      // 创建ArcGIS REST瓦片图层
      const arcgisLayer = new TileLayer({
        source: new TileArcGISRest({
          url: PRECISE_CONFIG.tileServiceUrl,
          crossOrigin: 'anonymous'
        }),
        opacity: 1.0,
        visible: true
      });

      // 添加事件监听
      const source = arcgisLayer.getSource();
      if (source) {
        source.on('tileloadstart', () => {
          console.log('📡 ArcGIS REST源开始加载瓦片');
        });

        source.on('tileloadend', () => {
          console.log('✅ ArcGIS REST源瓦片加载完成');
        });

        source.on('tileloaderror', (event: any) => {
          console.error('❌ ArcGIS REST源瓦片加载错误:', event);
        });
      }

      // 添加到地图
      console.log('添加ArcGIS REST图层到地图');
      mapInstanceRef.current.addLayer(arcgisLayer);
      setRemoteSensingLayer(arcgisLayer as any);

      // 设置地图背景为黑色
      const mapElement = mapInstanceRef.current.getTargetElement();
      if (mapElement) {
        (mapElement as HTMLElement).style.backgroundColor = '#000000';
        console.log('🎨 设置地图背景为黑色');
      }

      // 缩放到服务范围
      const view = mapInstanceRef.current.getView();
      view.fit([
        PRECISE_CONFIG.webMercatorExtent.xmin,
        PRECISE_CONFIG.webMercatorExtent.ymin,
        PRECISE_CONFIG.webMercatorExtent.xmax,
        PRECISE_CONFIG.webMercatorExtent.ymax
      ], {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 15
      });

      message.success('ArcGIS REST源瓦片图层加载完成！');
      console.log('🎉 ArcGIS REST源瓦片图层添加成功');

    } catch (error: any) {
      console.error('ArcGIS REST源加载失败:', error);
      message.error(`ArcGIS REST源加载失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 地图容器 */}
      <div
        ref={mapRef}
        style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          minHeight: '400px'
        }}
      />

      {/* 控制按钮区域 - 放置在地图容器下侧 */}
      <div style={{ 
        padding: '10px', 
        borderTop: '1px solid #e8e8e8', 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: '#fafafa',
        minHeight: '60px'
      }}>
        <span style={{ fontWeight: 'bold', color: '#333' }}>底图:</span>
        <Select value={baseMapType} onChange={switchBaseMap} style={{ width: 120 }}>
          {Object.keys(BASE_MAPS).map((key) => (
            <Option key={key} value={key}>
              {BASE_MAPS[key as keyof typeof BASE_MAPS].name}
            </Option>
          ))}
        </Select>

        <Button
          onClick={testServiceConnection}
          loading={isLoading}
          size="small"
        >
          测试服务连接
        </Button>

        <Button
          type="primary"
          onClick={loadPreciseTileLayer}
          loading={isLoading}
          size="small"
          style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
        >
          渲染修复加载遥感数据
        </Button>

        <Button
          onClick={loadArcGISRestLayer}
          loading={isLoading}
          size="small"
          style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }}
        >
          ArcGIS REST源
        </Button>

        <Button onClick={clearRemoteSensingLayer} size="small">
          清除遥感图层
        </Button>

        <Button onClick={restoreBaseMap} size="small">
          恢复底图
        </Button>

        <Button onClick={resetToServiceExtent} size="small">
          重置到服务范围
        </Button>
      </div>

      {/* 精确配置信息面板 */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        maxWidth: '380px',
        fontSize: '12px',
        lineHeight: '1.4'
      }}>
        <p><strong>精确服务配置 (无底图模式)</strong></p>
        
        <div style={{ marginBottom: '8px' }}>
          <strong>地理范围:</strong><br/>
          <span style={{ color: '#666', fontSize: '11px' }}>
            经度: {PRECISE_CONFIG.geoExtent.xmin.toFixed(3)}° - {PRECISE_CONFIG.geoExtent.xmax.toFixed(3)}°<br/>
            纬度: {PRECISE_CONFIG.geoExtent.ymin.toFixed(3)}° - {PRECISE_CONFIG.geoExtent.ymax.toFixed(3)}°
          </span>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <strong>缩放级别:</strong> 
          <span style={{ marginLeft: '5px', color: '#1890ff' }}>
            {PRECISE_CONFIG.zoomLevels.minLOD} - {PRECISE_CONFIG.zoomLevels.maxLOD}
          </span>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <strong>瓦片网格:</strong> 
          <span style={{ 
            color: tileGrid ? '#52c41a' : '#ff4d4f',
            marginLeft: '5px'
          }}>
            {tileGrid ? '✅ 已创建' : '❌ 未创建'}
          </span>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <strong>遥感图层:</strong> 
          <span style={{ 
            color: remoteSensingLayer ? '#52c41a' : '#999',
            marginLeft: '5px'
          }}>
            {remoteSensingLayer ? '✅ 已加载' : '⏳ 未加载'}
          </span>
        </div>
        
        <div style={{ 
          borderTop: '1px solid #eee', 
          paddingTop: '8px', 
          marginTop: '8px' 
        }}>
          <p style={{ color: '#52c41a', fontSize: '11px', margin: '2px 0' }}>
            ✅ 使用服务JSON元数据
          </p>
          <p style={{ color: '#1890ff', fontSize: '11px', margin: '2px 0' }}>
            🔧 使用XML配置的瓦片网格
          </p>
          <p style={{ color: '#722ed1', fontSize: '11px', margin: '2px 0' }}>
            📏 精确的地理范围和缩放级别
          </p>
          <p style={{ color: '#f5222d', fontSize: '11px', margin: '2px 0' }}>
            🎯 24级LOD分辨率支持
          </p>
          <p style={{ color: '#fa8c16', fontSize: '11px', margin: '2px 0' }}>
            🖤 无底图模式 - 纯遥感数据显示
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeoScenePreciseLayer;
