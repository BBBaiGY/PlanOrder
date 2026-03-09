# 供需检查系统

基于 React + TypeScript + Ant Design 构建的供需检查系统，提供物料供需情况的概览和详细管理功能。

## 功能特性

- 📊 **物料供需概览**：展示物料的即时库存、缺料数量、供应商等信息
- 📅 **时间维度分析**：支持按日期查看物料的需求、供给和结存变化
- 📋 **供需明细**：详细展示导致物料需求/供给变化的具体单据信息
- 🔍 **筛选功能**：支持按截止日期、供需情况、商品类别进行筛选
- 📤 **数据导出**：支持导出物料供需数据
- ⚙️ **操作功能**：缺料投放、供需设置等管理功能

## 技术栈

- React 18
- TypeScript
- Ant Design 5
- Vite
- React Router
- Day.js

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

详见 [docs/STRUCTURE.md](./docs/STRUCTURE.md) 和 [docs/PROJECT_FILES.md](./docs/PROJECT_FILES.md)，当前概要：

```
src/
├── components/           # 公共组件
│   ├── Layout/          # 布局（侧栏 + 顶栏 + 内容区）
│   └── common/          # 通用 UI（如 ResizableTitle）
├── pages/               # 页面组件
│   ├── MaterialControlWorkbench/  # 供需检查
│   ├── PlanOrder/                # 需求建议
│   ├── DemandCalculation/         # 需求计算
│   ├── SalesOrder/               # 销售订单
│   └── SalesDetail/              # 销售明细
├── types/               # 公共类型（supply-demand 等）
├── constants/           # 常量（routes 等）
├── routes/              # 路由配置
├── App.tsx              # 根组件
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

### 文档说明

- **README.md**：项目说明和使用指南（根目录）
- **docs/STRUCTURE.md**：详细的目录结构说明
- **docs/NAVIGATION_SPEC.md**：导航栏样式和配置规范
- **docs/PROJECT_FILES.md**：完整的项目文件清单
- **docs/FILE_TREE.txt**：文件树视图

## 主要功能说明

### 供需检查

供需检查是系统的核心功能模块，提供以下功能：

1. **物料供需概览表格**
   - 显示物料基本信息（编码、名称、规格、单位等）
   - 显示库存信息（安全库存、即时库存、缺料数量）
   - 显示供应商和生产车间信息
   - 支持展开查看时间维度的详细数据（需求、供给、结存）

2. **供需明细表格**
   - 显示选中物料的详细供需单据信息
   - 包含单据类型、日期、编号、状态等信息
   - 显示数量执行情况

3. **筛选功能**
   - 截止日期筛选
   - 供需情况筛选（全部/缺料/充足）
   - 商品类别筛选

4. **操作功能**
   - 缺料投放：处理缺料物料的投放
   - 供需设置：配置供需相关参数
   - 引出：导出数据
   - 刷新：刷新当前数据

## 开发说明

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 React Hooks 最佳实践
- 使用 Ant Design 组件库
- 遵循 ESLint 代码规范

### 样式规范

- 使用 CSS Modules 或独立的 CSS 文件
- 遵循 Ant Design 设计规范
- 响应式设计，支持不同屏幕尺寸

## 许可证

MIT
