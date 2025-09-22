// 蒿坪镇数据路径配置
const HAOPING_DATA_CONFIG = {
  2003: {
    path: "F:/01_Master/02_AnKangProject/各年份安康蒿坪融合数据/2003配准 融合/2003按shp裁剪/ETMMulti_Spot5_GS_subset.dat",
    resolution: 10,
    acquisitionDate: "2003-06-15",
    bands: ['B1', 'B2', 'B3', 'B4'],
    sensor: "SPOT-5"
  },
  2013: {
    path: "F:/01_Master/02_AnKangProject/各年份安康蒿坪融合数据/Processing13_end/Mosaicking_Msked.dat",
    resolution: 10,
    acquisitionDate: "2013-06-15",
    bands: ['B1', 'B2', 'B3', 'B4'],
    sensor: "Landsat-8"
  },
  2016: {
    path: "F:/01_Master/02_AnKangProject/各年份安康蒿坪融合数据/2016-2018/GF2_32.6/GF2_32.6/2016-32.6-按shp裁剪/GF2_PMS1_E108.7_N32.6_20160402_L1A0001501541-NND1_subset.dat",
    resolution: 4,
    acquisitionDate: "2016-04-02",
    bands: ['B1', 'B2', 'B3', 'B4'],
    sensor: "GF-2"
  }
}

export interface ImageData {
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

class DataProcessor {
  /**
   * 加载蒿坪镇遥感数据
   */
  static async loadHaopingData(): Promise<ImageData[]> {
    const data: ImageData[] = []
    
    // 加载实际数据文件
    for (const [yearStr, config] of Object.entries(HAOPING_DATA_CONFIG)) {
      const year = parseInt(yearStr)
      const imageData: ImageData = {
        year,
        path: config.path,
        thumbnail: this.createImagePreviewUrl(year), // 使用预览图
        ndvi: this.calculateMockNDVI(year),
        metadata: {
          resolution: config.resolution,
          acquisitionDate: config.acquisitionDate,
          bands: config.bands,
          sensor: config.sensor
        }
      }
      
      data.push(imageData)
    }
    
    return data
  }

  /**
   * 计算模拟NDVI值
   */
  private static calculateMockNDVI(year: number): number {
    // 基于不同年份和传感器的NDVI值
    const ndviValues = {
      2003: 0.65, // SPOT-5数据
      2013: 0.68, // Landsat-8数据
      2016: 0.72  // GF-2高分辨率数据
    }
    
    const baseNDVI = ndviValues[year as keyof typeof ndviValues] || 0.65
    const randomFactor = (Math.random() - 0.5) * 0.05 // 减少随机性
    return Math.max(0, Math.min(1, baseNDVI + randomFactor))
  }

  /**
   * 处理单张影像
   */
  static async processImage(imagePath: string): Promise<ImageData | null> {
    try {
      console.log('Processing image:', imagePath)
      
      // 检查文件是否存在
      const response = await fetch(`file://${imagePath}`)
      if (!response.ok) {
        console.warn('File not accessible via web:', imagePath)
        return null
      }
      
      // 这里应该添加实际的遥感数据处理逻辑
      // 由于浏览器安全限制，无法直接读取本地文件
      // 建议将数据文件放到public目录下或使用服务器端处理
      
      return null
    } catch (error) {
      console.error('Error processing image:', error)
      return null
    }
  }

  /**
   * 创建遥感数据的预览图像URL
   */
  static createImagePreviewUrl(year: number): string {
    // 优先使用GeoTIFF文件（通过geotiff.js解析）
    const geoTIFFImages = {
      2003: '/images/2003/ETMMulti_Spot5_GS_subset.tif',  // 2003年SPOT-5数据
      2013: '/images/2013/Mosaicking_Msked.tif',          // 2013年Landsat-8数据
      2016: '/images/2016/GF2_PMS1_E108.7_N32.6_20160402_L1A0001501541-NND1_subset.tif'  // 2016年GF-2数据
    }
    
    // 备选方案: 使用PNG格式图像文件
    const pngImages = {
      2003: '/images/2003/ETMMulti_Spot5_GS_subset.png',
      2013: '/images/2013/Mosaicking_Msked.png',
      2016: '/images/2016/GF2_PMS1_E108.7_N32.6_20160402_L1A0001501541-NND1_subset.png'
    }
    
    // 最后备选: 使用在线的测试图像
    const testImages = {
      2003: 'https://via.placeholder.com/800x600/008000/FFFFFF?text=2003+SPOT-5+蒿坪镇遥感影像',
      2013: 'https://via.placeholder.com/800x600/0066CC/FFFFFF?text=2013+Landsat-8+蒿坪镇遥感影像', 
      2016: 'https://via.placeholder.com/800x600/CC6600/FFFFFF?text=2016+GF-2+蒿坪镇遥感影像'
    }
    
    // 优先使用GeoTIFF文件
    return geoTIFFImages[year as keyof typeof geoTIFFImages] || 
           pngImages[year as keyof typeof pngImages] || 
           testImages[year as keyof typeof testImages] || 
           testImages[2016]
  }

  /**
   * 检查本地遥感图像文件是否存在
   */
  static async checkLocalImageExists(year: number): Promise<boolean> {
    try {
      const imageUrl = this.createImagePreviewUrl(year)
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 计算NDVI
   */
  static calculateNDVI(redBand: number[], nirBand: number[]): number[] {
    const ndvi: number[] = []
    for (let i = 0; i < redBand.length; i++) {
      const ndviValue = (nirBand[i] - redBand[i]) / (nirBand[i] + redBand[i])
      ndvi.push(isNaN(ndviValue) ? 0 : ndviValue)
    }
    return ndvi
  }
}

export default DataProcessor