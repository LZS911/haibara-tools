# Build Resources

本目录包含 Electron 应用构建所需的资源文件。

## 应用图标

需要准备以下格式的图标文件：

### macOS

- **文件名**: `icon.icns`
- **尺寸**: 1024x1024 像素
- **工具**: 可使用 [CloudConvert](https://cloudconvert.com/png-to-icns) 在线转换

### Windows

- **文件名**: `icon.ico`
- **尺寸**: 256x256 像素
- **工具**: 可使用 [CloudConvert](https://cloudconvert.com/png-to-ico) 在线转换

### Linux

- **文件名**: `icon.png`
- **尺寸**: 512x512 像素
- **格式**: PNG 格式即可

## 使用 electron-icon-builder（推荐）

如果你有一张高分辨率的 PNG 图标（建议 1024x1024），可以使用工具自动生成所有平台的图标：

```bash
# 安装工具
pnpm add -D electron-icon-builder

# 生成图标（需要一张 icon.png 在项目根目录）
npx electron-icon-builder --input=./icon.png --output=./build --flatten
```

## 权限配置

### macOS Entitlements

`entitlements.mac.plist` 文件定义了应用在 macOS 上的权限：

- 网络访问
- 文件系统访问
- 音视频设备访问
- JIT 编译支持

如需修改权限，请编辑此文件。更多信息请参考 [Apple 官方文档](https://developer.apple.com/documentation/bundleresources/entitlements)。

## 注意事项

1. **图标文件不在版本控制中**：由于图标文件通常较大，建议将其添加到 `.gitignore`，但在构建时确保文件存在。

2. **代码签名**：
   - macOS 和 Windows 发布到应用商店时需要代码签名
   - 开发和测试阶段可以跳过签名

3. **文件路径**：所有路径都是相对于项目根目录。
