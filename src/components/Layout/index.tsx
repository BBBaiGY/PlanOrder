/**
 * 导航栏组件
 * 
 * 注意：导航栏的样式和配置已固定，请参考 docs/NAVIGATION_SPEC.md 文档
 * 如需修改导航栏相关配置，请先更新规范文档
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Input, Avatar } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  HomeOutlined,
  ToolOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  InboxOutlined,
  DatabaseFilled,
  EditOutlined,
  ClockCircleOutlined,
  DesktopOutlined,
  FileSearchOutlined,
  BulbOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { ROUTES, ROUTE_MENU_KEYS } from '@/constants/routes'
import './index.css'

const { Header, Sider, Content } = AntLayout

/** 工业制造风格 Logo：齿轮图标 */
const IndustrialLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    {/* 齿轮外圆 */}
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
    {/* 八条齿线（从内到外） */}
    <line x1="12" y1="6" x2="12" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="6" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="18" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="8.49" y1="8.49" x2="6.36" y2="6.36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="15.51" y1="15.51" x2="17.64" y2="17.64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="8.49" y1="15.51" x2="6.36" y2="17.64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="15.51" y1="8.49" x2="17.64" y2="6.36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* 轴心圆 */}
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
)

interface LayoutProps {
  children: React.ReactNode
}

const BREADCRUMB_MAP: Record<string, string> = {
  [ROUTES.HOME]: '需求管理 > 供需工作台',
  [ROUTES.MATERIAL_CONTROL]: '需求管理 > 供需工作台',
  [ROUTES.PLAN_ORDER]: '需求管理 > 需求计划',
  [ROUTES.PLAN_DEMAND_CALCULATION]: '需求管理 > 需求计算',
  [ROUTES.SALES_ORDER]: '销售管理 > 销售订单',
  [ROUTES.SALES_DETAIL]: '销售管理 > 销售明细',
}

// 页面标题映射（用于浏览器标签页标题）
const PAGE_TITLE_MAP: Record<string, string> = {
  [ROUTES.HOME]: '供需工作台',
  [ROUTES.MATERIAL_CONTROL]: '供需工作台',
  [ROUTES.PLAN_ORDER]: '需求计划',
  [ROUTES.PLAN_DEMAND_CALCULATION]: '需求计算',
  [ROUTES.SALES_ORDER]: '销售订单',
  [ROUTES.SALES_DETAIL]: '销售明细',
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // 根据路由设置浏览器标签页标题
  useEffect(() => {
    const pageTitle = PAGE_TITLE_MAP[pathname] || PAGE_TITLE_MAP[ROUTES.HOME] || '供需工作台'
    document.title = `${pageTitle} - 小工单产品原型`
  }, [pathname])

  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '主页',
    },
    {
      key: 'sales',
      icon: <FileTextOutlined />,
      label: '销售管理',
      children: [
        {
          key: ROUTES.SALES_ORDER,
          label: '销售订单',
        },
        {
          key: ROUTES.SALES_DETAIL,
          label: '销售明细',
        },
      ],
    },
    {
      key: 'plan',
      icon: <DatabaseOutlined />,
      label: '需求管理',
      children: [
        {
          key: '/plan/demand-calculation',
          label: '需求计算',
        },
        {
          key: '/plan/order',
          label: '需求计划',
        },
        {
          key: '/material-control',
          label: '供需工作台',
        },
      ],
    },
    {
      key: 'purchase',
      icon: <ShoppingCartOutlined />,
      label: '采购管理',
      children: [],
    },
    {
      key: 'production',
      icon: <ToolOutlined />,
      label: '生产管理',
      children: [],
    },
    {
      key: 'outsource',
      icon: <TeamOutlined />,
      label: '委外管理',
      children: [],
    },
    {
      key: 'quality',
      icon: <CheckCircleOutlined />,
      label: '质量管理',
      children: [],
    },
    {
      key: 'upstream-downstream',
      icon: <SwapOutlined />,
      label: '上下游管理',
      children: [],
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: '库存管理',
      children: [],
    },
    {
      key: 'task',
      icon: <BarChartOutlined />,
      label: '任务管理',
      children: [],
    },
    {
      key: 'basic-data',
      icon: <DatabaseFilled />,
      label: '基础数据',
      children: [],
    },
    {
      key: 'custom-config',
      icon: <EditOutlined />,
      label: '自定义配置',
      children: [],
    },
    {
      key: 'reports',
      icon: <ClockCircleOutlined />,
      label: '报表',
      children: [],
    },
    {
      key: 'system-config',
      icon: <SettingOutlined />,
      label: '系统配置',
      children: [],
    },
    {
      key: 'workshop-dashboard',
      icon: <DesktopOutlined />,
      label: '车间看板',
      children: [],
    },
    {
      key: 'custom-reports',
      icon: <FileSearchOutlined />,
      label: '自定义报表',
      children: [],
    },
    {
      key: 'smart-dashboard',
      icon: <BulbOutlined />,
      label: '智能看板',
      children: [],
    },
    {
      key: 'plugin-market',
      icon: <AppstoreOutlined />,
      label: '插件市场',
      children: [],
    },
  ]

  return (
    <AntLayout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="app-sider"
        width={240}
      >
        <div className="sider-header">
          <div className="logo-container">
            <div className="logo-icon">
              <IndustrialLogo className="logo-icon-svg" />
            </div>
            {!collapsed && <div className="logo-text">小工单产品原型</div>}
          </div>
        </div>
        <div className="sider-search">
          <Input
            placeholder="搜索(⌘+shift+f)"
            prefix={<SearchOutlined />}
            size="small"
            className="sider-search-input"
          />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname === ROUTES.HOME ? ROUTES.MATERIAL_CONTROL : pathname]}
          defaultOpenKeys={['plan']}
          items={menuItems}
          className="sider-menu"
          onClick={({ key }) => {
            if (ROUTE_MENU_KEYS.includes(key as any)) navigate(key)
          }}
        />
        <div className="sider-footer">
          <div
            className="collapse-trigger"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
      </Sider>
      <AntLayout>
        <Header className="app-header">
          <div className="header-left">
            <div className="breadcrumb">{BREADCRUMB_MAP[pathname] ?? BREADCRUMB_MAP[ROUTES.HOME]}</div>
          </div>
          <div className="header-right">
            <Avatar icon={<UserOutlined />} className="header-avatar" />
            <span className="header-username">工厂长</span>
          </div>
        </Header>
        <Content className="app-content">{children}</Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
