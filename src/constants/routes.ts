/**
 * 路由路径常量
 */

export const ROUTES = {
  HOME: '/',
  MATERIAL_CONTROL: '/material-control',
  PLAN_ORDER: '/plan/order',
  PLAN_DEMAND_CALCULATION: '/plan/demand-calculation',
  SALES_ORDER: '/sales/order',
  SALES_DETAIL: '/sales/detail',
} as const

/** 带路由的菜单 key（供 Layout 导航使用） */
export const ROUTE_MENU_KEYS = [
  ROUTES.PLAN_DEMAND_CALCULATION,
  ROUTES.PLAN_ORDER,
  ROUTES.MATERIAL_CONTROL,
  ROUTES.SALES_ORDER,
  ROUTES.SALES_DETAIL,
] as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
