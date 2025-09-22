#!/usr/bin/env python3
"""
转换GeoScene Pro生成的GF2_data_0917_Tiles瓦片缓存为OpenLayers标准格式
"""

import os
import shutil
import json
from pathlib import Path

def convert_geoscene_tiles():
    """转换GeoScene Pro瓦片为OpenLayers格式"""
    
    # 源目录和目标目录
    source_dir = Path("public/images/2016/GF2_data_0917_Tiles/_alllayers")
    target_dir = Path("public/tiles/2016_geoscene_0917")
    
    # 创建目标目录
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # 瓦片转换映射
    converted_tiles = []
    
    # 遍历所有级别目录
    for level_dir in source_dir.glob("L*"):
        if not level_dir.is_dir():
            continue
            
        # 提取级别号 (L06 -> 6)
        level_str = level_dir.name[1:]  # 去掉 'L'
        zoom_level = int(level_str)
        
        print(f"处理缩放级别 {zoom_level} ({level_dir.name})")
        
        # 创建目标级别目录
        target_level_dir = target_dir / str(zoom_level)
        target_level_dir.mkdir(parents=True, exist_ok=True)
        
        # 遍历行目录
        for row_dir in level_dir.glob("R*"):
            if not row_dir.is_dir():
                continue
                
            # 提取行号 (R002be57f -> 46028671)
            row_hex = row_dir.name[1:]  # 去掉 'R'
            row_num = int(row_hex, 16)  # 十六进制转十进制
            
            # 遍历列文件
            for col_file in row_dir.glob("C*.png"):
                # 提取列号 (C00000066.png -> 102)
                col_hex = col_file.stem[1:]  # 去掉 'C' 和 '.png'
                col_num = int(col_hex, 16)  # 十六进制转十进制
                
                # 计算OpenLayers瓦片坐标
                # 根据Web Mercator瓦片网格计算
                tile_size = 2 ** zoom_level
                
                # 使用地理范围计算瓦片索引
                # Web Mercator范围: X: 12084408.66 到 12108427.13, Y: 3826328.42 到 3848548.72
                x_min, x_max = 12084408.66, 12108427.13
                y_min, y_max = 3826328.42, 3848548.72
                
                # Web Mercator全球范围
                world_min_x, world_max_x = -20037508.34, 20037508.34
                world_min_y, world_max_y = -20037508.34, 20037508.34
                
                # 计算相对位置并映射到瓦片网格
                x_ratio = (x_min - world_min_x) / (world_max_x - world_min_x)
                y_ratio = (world_max_y - y_max) / (world_max_y - world_min_y)  # Y轴翻转
                
                # 计算OpenLayers瓦片坐标
                ol_x = int(x_ratio * tile_size)
                ol_y = int(y_ratio * tile_size)
                
                # 创建目标X目录
                target_x_dir = target_level_dir / str(ol_x)
                target_x_dir.mkdir(parents=True, exist_ok=True)
                
                # 目标文件路径
                target_file = target_x_dir / f"{ol_y}.png"
                
                # 复制瓦片文件
                shutil.copy2(col_file, target_file)
                
                converted_tiles.append({
                    'source': str(col_file),
                    'target': str(target_file),
                    'zoom': zoom_level,
                    'source_coords': {'row': row_num, 'col': col_num},
                    'target_coords': {'x': ol_x, 'y': ol_y}
                })
                
                print(f"  转换: {level_dir.name}/{row_dir.name}/{col_file.name} -> {zoom_level}/{ol_x}/{ol_y}.png")
    
    # 保存转换信息
    conversion_info = {
        'total_tiles': len(converted_tiles),
        'zoom_levels': list(range(6, 11)),  # L06-L10 对应 6-10
        'geographic_bounds': {
            'xMin': 12084408.66,
            'yMin': 3826328.42,
            'xMax': 12108427.13,
            'yMax': 3848548.72,
            'projection': 'EPSG:3857'
        },
        'tile_info': {
            'format': 'PNG',
            'size': '256x256',
            'dpi': 96
        },
        'converted_tiles': converted_tiles
    }
    
    info_file = target_dir / 'conversion_info.json'
    with open(info_file, 'w', encoding='utf-8') as f:
        json.dump(conversion_info, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ 转换完成!")
    print(f"📊 总共转换了 {len(converted_tiles)} 个瓦片")
    print(f"📂 目标目录: {target_dir}")
    print(f"🔍 缩放级别: 6-10")
    print(f"📄 转换信息保存在: {info_file}")

if __name__ == "__main__":
    convert_geoscene_tiles()
