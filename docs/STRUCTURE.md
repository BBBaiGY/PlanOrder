# 项目目录结构说明

## 一、当前结构总览

```
004_PlanOrder/
├── 📄 配置文件
│   ├── .eslintrc.cjs          # ESLint 代码规范配置
│   ├── .gitignore             # Git 忽略文件配置
│   ├── package.json           # 项目依赖和脚本配置
│   ├── package-lock.json      # 依赖版本锁定文件
│   ├── tsconfig.json          # TypeScript 编译配置
│   ├── tsconfig.node.json     # TypeScript Node 环境配置
│   └── vite.config.ts         # Vite 构建工具配置
│
├── 📄 入口文件
│   └── index.html             # 应用入口 HTML 文件
│
├── 📄 根目录说明与脚本
│   ├── CACHE_FIX.md           # 缓存与浏览器看到最新内容的说明
│   ├── LIVE_SERVER_GUIDE.md   # Live Server 预览构建产物的使用指南
│   └── stop-servers.sh        # 停止本地开发/预览服务的脚本
│
├── 📚 文档文件
│   ├── README.md              # 项目说明和使用指南（根目录）
│   └── docs/                  # 文档目录
│       ├── STRUCTURE.md        # 本文件：目录结构说明
│       ├── NAVIGATION_SPEC.md  # 导航栏样式和配置规范
│       ├── PROJECT_FILES.md    # 项目文件清单
│       └── FILE_TREE.txt       # 文件树视图
│
└── 📂 src/                   # 源代码目录
    ├── App.tsx            # 根组件、路由挂载
    ├── main.tsx           # 应用入口文件
    ├── index.css          # 全局样式
    ├── components/        # 公共组件
    │   ├── Layout/       # 布局组件（侧边栏 + 顶栏 + 内容区）
    │   │   ├── index.tsx
    │   │   └── index.css
    │   └── common/        # 通用 UI 组件
    │       └── ResizableTitle.tsx  # 可调整大小的表头组件
    ├── pages/             # 页面组件
    │   ├── MaterialControlWorkbench/   # 供需检查页面
    │   │   ├── index.tsx
    │   │   └── index.css
    │   ├── PlanOrder/                  # 需求建议页面
    │   │   ├── index.tsx
    │   │   └── index.css
    │   ├── DemandCalculation/          # 需求计算页面
    │   │   ├── index.tsx
    │   │   └── index.css
    │   ├── SalesOrder/                 # 销售订单页面
    │   │   ├── index.tsx
    │   │   └── index.css
│   └── SalesDetail/                # 销售明细页面
│       ├── index.tsx
│       ├── index.css
│       └── DemandCalcDrawer.tsx    # 需求计算抽屉（页面子组件）
    ├── types/             # TypeScript 类型定义
    │   └── supply-demand.ts  # 供需相关类型
    ├── constants/         # 常量定义
    │   └── routes.ts      # 路由路径常量
    └── routes/            # 路由配置
        └── index.tsx      # 路由定义和 Router 配置
```

## 二、目录职责

| 目录/文件 | 职责 | 说明 |
|-----------|------|------|
| **根目录配置文件** | | |
| `.eslintrc.cjs` | ESLint 代码规范配置 | 定义代码检查规则 |
| `.gitignore` | Git 忽略文件配置 | 指定不纳入版本控制的文件 |
| `package.json` | 项目依赖和脚本配置 | 管理依赖包和 npm 脚本 |
| `tsconfig.json` | TypeScript 编译配置 | TypeScript 编译选项 |
| `vite.config.ts` | Vite 构建工具配置 | 构建工具配置（端口、别名等） |
| **文档文件** | | |
| `README.md` | 项目说明和使用指南 | 项目介绍、快速开始（根目录） |
| `docs/STRUCTURE.md` | 目录结构说明 | 本文件 |
| `docs/NAVIGATION_SPEC.md` | 导航栏规范文档 | 导航栏样式和配置规范 |
| `docs/PROJECT_FILES.md` | 项目文件清单 | 详细文件列表和说明 |
| `docs/FILE_TREE.txt` | 文件树视图 | 可视化文件结构 |
| **根目录说明与脚本** | | |
| `CACHE_FIX.md` | 缓存问题说明 | 浏览器/Vite 缓存与看到最新内容的解决方案 |
| `LIVE_SERVER_GUIDE.md` | Live Server 使用指南 | 使用 Live Server 预览构建产物的步骤 |
| `stop-servers.sh` | 停止服务脚本 | 停止本地开发/预览端口上的进程 |
| **源代码目录** | | |
| `src/**` | 前端源码根目录 | 所有源代码文件 |
| `src/components/**` | 公共组件目录 | 可在多页面复用的 UI 组件 |
| `src/components/Layout/**` | 布局组件 | 整体布局（侧栏、顶栏、面包屑、菜单） |
| `src/components/common/**` | 通用组件 | 通用小组件（如可拖拽表头等） |
| `src/pages/**` | 页面组件目录 | 按业务划分的页面，每页一个文件夹；复杂页可有子组件（如 SalesDetail/DemandCalcDrawer.tsx） |
| `src/types/**` | 类型定义目录 | 全局或跨页面共享的 TypeScript 类型 |
| `src/constants/**` | 常量定义目录 | 路由路径、菜单 key 等常量 |
| `src/routes/**` | 路由配置目录 | 路由配置与 `<Router>` 挂载 |
| `src/index.css` | 全局样式文件 | 全局样式、设计 token、Ant Design 覆盖 |
| `src/main.tsx` | 应用入口文件 | React 应用入口，配置主题 |
| `src/App.tsx` | 根组件 | 挂载路由组件 |

## 三、页面目录规范

每个页面单独成目录，建议结构：

```
pages/PageName/
├── index.tsx    # 页面组件入口
├── index.css    # 页面专属样式
└── (可选)       # 若页面复杂，可再拆子组件、hooks 等
    ├── components/
    ├── hooks/
    └── utils/
```

- **index.tsx**：默认导出页面组件，供路由引用。
- **index.css**：只写该页用到的样式，避免影响其他页面。

## 四、命名与引用规范

- **组件/页面**：PascalCase（如 `MaterialControlWorkbench`、`PlanOrder`）。
- **路由路径**：kebab-case（如 `/material-control`、`/plan/order`）。
- **类型文件**：kebab-case 或与领域相关（如 `supply-demand.ts`）。
- **路径别名**：`@/` 指向 `src/`，例如 `import X from '@/types/supply-demand'`。

## 五、优化点小结

1. **types/**：抽出供需相关类型，避免在多个页面重复定义。
2. **components/common/**：抽出 `ResizableTitle` 等通用组件，减少重复实现。
3. **constants/routes.ts**：集中管理路径、菜单 key，方便维护与复用。
4. **routes/index.tsx**：路由配置与 Router 集中管理，`App.tsx` 只负责挂载。
5. **STRUCTURE.md**：固化目录约定，便于新人上手与后续扩展。

## 六、文件统计

### 源代码文件
- **页面组件**：5 个（MaterialControlWorkbench、PlanOrder、DemandCalculation、SalesOrder、SalesDetail）
- **页面子组件**：1 个（SalesDetail/DemandCalcDrawer.tsx）
- **公共组件**：2 个（Layout、ResizableTitle）
- **类型定义**：1 个（supply-demand.ts）
- **路由配置**：1 个（routes/index.tsx）
- **常量定义**：1 个（routes.ts）
- **核心文件**：3 个（main.tsx、App.tsx、index.css）
- **总计**：19 个源代码文件（.tsx/.ts/.css）

### 配置文件
- **构建配置**：3 个（vite.config.ts、tsconfig.json、tsconfig.node.json）
- **代码规范**：1 个（.eslintrc.cjs）
- **依赖管理**：2 个（package.json、package-lock.json）
- **版本控制**：1 个（.gitignore）
- **总计**：7 个配置文件

### 文档文件
- **项目文档**：5 个
  - README.md（根目录）
  - docs/STRUCTURE.md
  - docs/NAVIGATION_SPEC.md
  - docs/PROJECT_FILES.md
  - docs/FILE_TREE.txt
- **根目录说明与脚本**：3 个（CACHE_FIX.md、LIVE_SERVER_GUIDE.md、stop-servers.sh）
- **入口文件**：1 个（index.html）
- **总计**：9 个文档/说明/入口文件

### 项目总计
- **源代码文件**：19 个
- **配置文件**：7 个
- **文档与说明**：9 个（含入口 index.html）
- **总计**：约 35 个文件（不包括 node_modules 和 dist）

## 七、后续可扩展目录

- **api/**：封装接口请求（如 `fetch`、`axios`）。
- **hooks/**：通用自定义 Hooks（如 `useTableResize`、`useSupplyDemand`）。
- **utils/**：纯函数工具（如日期、格式化、权限校验）。
- **styles/**：若样式增多，可拆 `variables.css`、`reset.css` 等。
- **assets/**：图片、字体等静态资源。
- **store/**：状态管理（如 Redux、Zustand）。
- **services/**：业务逻辑服务层。
