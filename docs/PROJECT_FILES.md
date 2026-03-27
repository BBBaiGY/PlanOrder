# 项目文件清单

## 📁 根目录文件

| 文件名 | 说明 | 状态 |
|--------|------|------|
| `.eslintrc.cjs` | ESLint 代码规范配置 | ✅ |
| `.gitignore` | Git 版本控制忽略文件配置 | ✅ |
| `index.html` | 应用入口 HTML 文件 | ✅ |
| `package.json` | 项目依赖和脚本配置 | ✅ |
| `package-lock.json` | 依赖版本锁定文件 | ✅ |
| `tsconfig.json` | TypeScript 编译配置 | ✅ |
| `tsconfig.node.json` | TypeScript Node 环境配置 | ✅ |
| `vite.config.ts` | Vite 构建工具配置 | ✅ |

## 📄 根目录说明与脚本

| 文件名 | 说明 | 状态 |
|--------|------|------|
| `CACHE_FIX.md` | 缓存与浏览器看到最新内容的解决方案 | ✅ |
| `LIVE_SERVER_GUIDE.md` | Live Server 预览构建产物的使用指南 | ✅ |
| `stop-servers.sh` | 停止本地开发/预览服务的脚本 | ✅ |

## 📚 文档文件

| 文件名 | 说明 | 位置 |
|--------|------|------|
| `README.md` | 项目说明和使用指南 | 根目录 |
| `docs/STRUCTURE.md` | 项目目录结构说明 | docs/ |
| `docs/NAVIGATION_SPEC.md` | 导航栏样式和配置规范 | docs/ |
| `docs/PROJECT_FILES.md` | 本文件：项目文件清单 | docs/ |
| `docs/FILE_TREE.txt` | 文件树视图 | docs/ |

## 📂 src/ 源代码目录

### 核心文件
- `main.tsx` - React 应用入口，配置 Ant Design 主题
- `App.tsx` - 根组件，挂载路由
- `index.css` - 全局样式，包含主题色配置

### components/ 公共组件
- `Layout/index.tsx` - 布局组件（侧边栏、顶栏、内容区）
- `Layout/index.css` - 布局样式
- `common/ResizableTitle.tsx` - 可调整大小的表格列头组件

### pages/ 页面组件
- `MaterialControlWorkbench/` - 供需检查页面
- `PlanOrder/` - 需求建议页面
- `DemandCalculation/` - 需求计算页面
- `SalesOrder/` - 销售订单页面
- `SalesDetail/` - 销售明细页面（含子组件 `DemandCalcDrawer.tsx`，需求计算抽屉）

每个页面目录包含：
- `index.tsx` - 页面组件
- `index.css` - 页面样式
- （可选）页面专属子组件，如 `SalesDetail/DemandCalcDrawer.tsx`

### types/ 类型定义
- `supply-demand.ts` - 供需相关的 TypeScript 类型定义

### constants/ 常量
- `routes.ts` - 路由路径常量定义

### routes/ 路由配置
- `index.tsx` - React Router 路由配置

## 🗂️ 构建产物（已忽略）

以下目录和文件由构建工具自动生成，不应提交到版本控制：
- `dist/` - 生产构建输出
- `node_modules/` - 依赖包目录
- `.vite/` - Vite 缓存目录

## 📊 文件统计

### 源代码文件（19 个）
- **页面组件**：5 个
  - MaterialControlWorkbench（供需检查）
  - PlanOrder（需求建议）
  - DemandCalculation（需求计算）
  - SalesOrder（销售订单）
  - SalesDetail（销售明细）
- **页面子组件**：1 个（SalesDetail/DemandCalcDrawer.tsx，需求计算抽屉）
- **公共组件**：2 个
  - Layout（布局组件）
  - ResizableTitle（可调整大小的表头）
- **类型定义文件**：1 个（supply-demand.ts）
- **路由配置**：1 个（routes/index.tsx）
- **常量定义**：1 个（routes.ts）
- **核心文件**：3 个（main.tsx、App.tsx、index.css）

### 配置文件（7 个）
- **构建配置**：3 个（vite.config.ts、tsconfig.json、tsconfig.node.json）
- **代码规范**：1 个（.eslintrc.cjs）
- **依赖管理**：2 个（package.json、package-lock.json）
- **版本控制**：1 个（.gitignore）

### 文档文件（5 个）
- README.md（根目录）
- docs/STRUCTURE.md
- docs/NAVIGATION_SPEC.md
- docs/PROJECT_FILES.md
- docs/FILE_TREE.txt

### 根目录说明与脚本（3 个）
- CACHE_FIX.md、LIVE_SERVER_GUIDE.md、stop-servers.sh

### 入口文件（1 个）
- index.html

### 总计
- **源代码文件**：19 个
- **配置文件**：7 个
- **文档文件**：5 个
- **根目录说明与脚本**：3 个
- **入口文件**：1 个
- **总计**：约 35 个文件（不包括 node_modules 和 dist）

## 🔍 文件组织原则

1. **按功能模块划分**：每个页面独立目录
2. **公共代码复用**：组件、类型、常量统一管理
3. **样式隔离**：每个页面和组件有独立的 CSS 文件
4. **类型安全**：使用 TypeScript 进行类型检查
5. **配置集中**：路由、常量统一管理

## 📝 维护说明

- 新增页面时，在 `src/pages/` 下创建新目录
- 新增公共组件时，放在 `src/components/common/` 或创建新的子目录
- 新增类型定义时，放在 `src/types/` 目录
- 新增路由时，更新 `src/constants/routes.ts` 和 `src/routes/index.tsx`
