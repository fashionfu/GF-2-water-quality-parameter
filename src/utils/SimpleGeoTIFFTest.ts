// 简单的GeoTIFF测试
export async function testSimpleGeoTIFF() {
  try {
    console.log('开始简单GeoTIFF测试...')
    
    // 动态导入geotiff库
    const geotiff = await import('geotiff')
    console.log('GeoTIFF库导入成功')
    
    // 测试一个小的GeoTIFF文件
    const testUrl = 'https://raw.githubusercontent.com/geotiffjs/geotiff.js/main/test/data/uint16.tif'
    
    console.log('尝试加载测试文件:', testUrl)
    const dataSource = await geotiff.fromUrl(testUrl)
    console.log('数据源创建成功')
    
    const image = await dataSource.getImage()
    console.log('图像对象创建成功')
    
    // 检查可用的方法
    console.log('Image对象方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(image)))
    console.log('Image对象属性:', Object.keys(image))
    
    // 尝试获取基本信息
    const width = image.getWidth()
    const height = image.getHeight()
    const bands = image.getSamplesPerPixel()
    const bbox = image.getBoundingBox()
    
    console.log('基本信息:', { width, height, bands, bbox })
    
    // 尝试读取一小块数据
    const rasters = await image.readRasters({
      window: { left: 0, top: 0, width: 100, height: 100 }
    })
    
    console.log('栅格数据读取成功:', {
      bands: rasters.length,
      firstBandLength: rasters[0]?.length
    })
    
    return true
  } catch (error) {
    console.error('简单GeoTIFF测试失败:', error)
    return false
  }
}

export default testSimpleGeoTIFF
