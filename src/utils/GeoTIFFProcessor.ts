import { fromLonLat } from 'ol/proj'

export interface GeoTIFFData {
  imageData: ImageData
  extent: number[]
  projection: string
  width: number
  height: number
}

export class GeoTIFFProcessor {
  /**
   * 加载并解析GeoTIFF文件
   */
  static async loadGeoTIFF(url: string): Promise<GeoTIFFData | null> {
    try {
      console.log('开始加载GeoTIFF文件:', url)
      
      // 动态导入geotiff库
      const geotiff = await import('geotiff')
      
      // 从GeoTIFF文件创建数据源
      const dataSource = await geotiff.fromUrl(url)
      const image = await dataSource.getImage()
      
      // 检查image对象的方法
      console.log('Image对象方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(image)))
      console.log('Image对象属性:', Object.keys(image))
      
      console.log('GeoTIFF文件信息:', {
        width: image.getWidth(),
        height: image.getHeight(),
        bands: image.getSamplesPerPixel(),
        bbox: image.getBoundingBox()
      })
      
      // 获取地理范围
      const bbox = image.getBoundingBox()
      const [minX, minY, maxX, maxY] = bbox
      
      // 转换为Web Mercator投影
      const extent = [
        fromLonLat([minX, minY])[0], // 西南角
        fromLonLat([minX, minY])[1],
        fromLonLat([maxX, maxY])[0], // 东北角
        fromLonLat([maxX, maxY])[1]
      ]
      
      // 获取图像数据 - 使用正确的API
      const width = image.getWidth()
      const height = image.getHeight()
      
      // 如果图像太大，进行缩放
      const maxSize = 2048
      let targetWidth = width
      let targetHeight = height
      let scaleFactor = 1
      
      if (width > maxSize || height > maxSize) {
        scaleFactor = Math.min(maxSize / width, maxSize / height)
        targetWidth = Math.floor(width * scaleFactor)
        targetHeight = Math.floor(height * scaleFactor)
        console.log(`图像太大，缩放 ${scaleFactor.toFixed(3)} 倍: ${width}x${height} -> ${targetWidth}x${targetHeight}`)
      }
      
      // 分块读取栅格数据
      const window = scaleFactor < 1 ? {
        left: 0,
        top: 0,
        width: targetWidth,
        height: targetHeight
      } : undefined
      
      console.log('开始读取栅格数据...')
      console.log('读取参数:', { window, scaleFactor })
      
      // 尝试不同的读取方式
      let rasters
      try {
        // 直接使用小块读取，避免内存问题
        console.log('使用小块读取避免内存问题...')
        const smallWindow = {
          left: 0,
          top: 0,
          width: Math.min(512, width),
          height: Math.min(512, height)
        }
        
        console.log('小块读取参数:', smallWindow)
        rasters = await image.readRasters({ window: smallWindow })
        targetWidth = smallWindow.width
        targetHeight = smallWindow.height
        
        console.log('小块读取结果:', {
          rastersLength: rasters.length,
          firstBandLength: rasters[0]?.length,
          expectedLength: smallWindow.width * smallWindow.height
        })
        
      } catch (error) {
        console.warn('readRGB失败，尝试readRasters:', error)
        try {
          // 先尝试直接读取原始数据（不缩放）
          console.log('尝试直接读取原始数据...')
          rasters = await image.readRasters()
          targetWidth = width
          targetHeight = height
          
          console.log('直接读取结果:', {
            rastersLength: rasters.length,
            firstBandLength: rasters[0]?.length,
            expectedLength: width * height
          })
          
          // 如果数据太大，再尝试缩放
          if (rasters[0] && rasters[0].length > 1000000) { // 超过100万像素
            console.log('数据太大，尝试缩放读取...')
            const smallWindow = {
              left: 0,
              top: 0,
              width: Math.min(512, width),
              height: Math.min(512, height)
            }
            
            rasters = await image.readRasters({ window: smallWindow })
            targetWidth = smallWindow.width
            targetHeight = smallWindow.height
            
            console.log('缩放读取结果:', {
              rastersLength: rasters.length,
              firstBandLength: rasters[0]?.length,
              expectedLength: smallWindow.width * smallWindow.height
            })
          }
          
        } catch (rasterError) {
          console.warn('readRasters失败，尝试小块读取:', rasterError)
          try {
            const smallWindow = {
              left: 0,
              top: 0,
              width: Math.min(512, width),
              height: Math.min(512, height)
            }
            
            rasters = await image.readRasters({ window: smallWindow })
            targetWidth = smallWindow.width
            targetHeight = smallWindow.height
            
            console.log('小块读取结果:', {
              rastersLength: rasters.length,
              firstBandLength: rasters[0]?.length,
              expectedLength: smallWindow.width * smallWindow.height
            })
            
          } catch (fullError) {
            console.error('所有读取方式都失败:', fullError)
            throw fullError
          }
        }
      }
      
      console.log('读取到的栅格数据:', {
        originalSize: `${width}x${height}`,
        targetSize: `${targetWidth}x${targetHeight}`,
        scaleFactor,
        bands: rasters.length,
        firstBandLength: rasters[0]?.length
      })
      
        // 验证数据
        if (!rasters || rasters.length === 0) {
          throw new Error('栅格数据为空或无效')
        }
        
        // 检查第一个波段的数据
        if (!rasters[0] || rasters[0].length === 0) {
          console.warn('第一个波段数据为空，尝试其他波段...')
          // 尝试找到有数据的波段
          let validBand = -1
          for (let i = 0; i < rasters.length; i++) {
            if (rasters[i] && rasters[i].length > 0) {
              validBand = i
              break
            }
          }
          
          if (validBand === -1) {
            throw new Error('所有波段数据都为空')
          }
          
          console.log(`使用第${validBand + 1}个波段的数据`)
        }
      
      // 检查数据长度是否匹配
      const expectedLength = targetWidth * targetHeight
      if (rasters[0].length !== expectedLength) {
        console.warn(`数据长度不匹配: 期望 ${expectedLength}, 实际 ${rasters[0].length}`)
        // 调整目标尺寸以匹配实际数据
        const actualWidth = Math.floor(Math.sqrt(rasters[0].length))
        const actualHeight = Math.floor(rasters[0].length / actualWidth)
        if (actualWidth * actualHeight === rasters[0].length) {
          targetWidth = actualWidth
          targetHeight = actualHeight
          console.log('调整目标尺寸为:', { targetWidth, targetHeight })
        }
      }
      
      // 创建ImageData对象
      const imageData = new ImageData(targetWidth, targetHeight)
      const data = imageData.data
      
      // 处理多波段数据（假设是RGB或RGBA）
      if (rasters.length >= 3) {
        // RGB合成
        for (let i = 0; i < targetWidth * targetHeight; i++) {
          data[i * 4] = rasters[0][i]     // R
          data[i * 4 + 1] = rasters[1][i] // G
          data[i * 4 + 2] = rasters[2][i] // B
          data[i * 4 + 3] = 255           // A
        }
      } else if (rasters.length === 1) {
        // 单波段灰度
        for (let i = 0; i < targetWidth * targetHeight; i++) {
          const value = rasters[0][i]
          data[i * 4] = value     // R
          data[i * 4 + 1] = value // G
          data[i * 4 + 2] = value // B
          data[i * 4 + 3] = 255   // A
        }
      }
      
      console.log('GeoTIFF加载成功:', {
        originalSize: `${width}x${height}`,
        targetSize: `${targetWidth}x${targetHeight}`,
        extent,
        bands: rasters.length
      })
      
      return {
        imageData,
        extent,
        projection: 'EPSG:3857',
        width: targetWidth,
        height: targetHeight
      }
      
    } catch (error) {
      console.error('GeoTIFF加载失败:', error)
      return null
    }
  }
  
  /**
   * 将ImageData转换为Canvas
   */
  static imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
    }
    return canvas
  }
  
  /**
   * 将Canvas转换为DataURL
   */
  static canvasToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png')
  }
  
  /**
   * 创建GeoTIFF的静态图像源
   */
  static async createGeoTIFFSource(url: string): Promise<{
    url: string
    extent: number[]
    projection: string
  } | null> {
    const geoTIFFData = await this.loadGeoTIFF(url)
    if (!geoTIFFData) return null
    
    const canvas = this.imageDataToCanvas(geoTIFFData.imageData)
    const dataURL = this.canvasToDataURL(canvas)
    
    return {
      url: dataURL,
      extent: geoTIFFData.extent,
      projection: geoTIFFData.projection
    }
  }
}

export default GeoTIFFProcessor
