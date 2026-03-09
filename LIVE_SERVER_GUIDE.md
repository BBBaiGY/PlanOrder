# Live Server 使用指南

## ⚠️ 重要说明

**Live Server 无法直接预览开发中的项目**，因为：
- 项目使用 TypeScript (.tsx) 文件，需要编译
- 项目使用 React JSX，需要转换
- 项目使用 ES 模块和路径别名，需要打包

## 📋 使用 Live Server 预览的步骤

如果你想使用 Live Server 预览，需要先构建项目：

### 步骤 1：构建项目

```bash
npm run build
```

这会在 `dist/` 目录生成编译后的静态文件。

### 步骤 2：使用 Live Server 预览

1. 在 VS Code/Cursor 中右键点击 `dist/index.html`
2. 选择 "Open with Live Server"
3. 或者使用 Live Server 扩展的 "Go Live" 按钮

### ⚠️ 注意事项

- **每次修改代码后都需要重新构建** (`npm run build`)
- Live Server 预览的是**生产版本**，不是开发版本
- 生产版本**没有热更新**，修改代码后需要手动刷新页面

## ✅ 推荐方式：使用 Vite 开发服务器

**强烈建议使用 Vite 开发服务器**，这是正确的方式：

```bash
npm run dev
```

然后访问：http://localhost:5500/

### Vite 的优势

- ✅ 自动编译 TypeScript/JSX
- ✅ 热模块替换（HMR）- 修改代码自动刷新
- ✅ 更快的编译速度
- ✅ 更好的错误提示
- ✅ 支持源码映射调试

## 🔄 快速对比

| 特性 | Live Server | Vite Dev Server |
|------|-------------|-----------------|
| 预览开发代码 | ❌ 不支持 | ✅ 支持 |
| 预览构建代码 | ✅ 支持 | ✅ 支持 |
| 热更新 | ❌ 无 | ✅ 有 |
| TypeScript 支持 | ❌ 无 | ✅ 有 |
| 需要构建 | ✅ 需要 | ❌ 不需要 |
| 开发体验 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## 💡 建议

**开发时使用 Vite** (`npm run dev`)，**部署时使用构建版本** (`npm run build`)。
