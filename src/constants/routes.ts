/**
 * 路由路径常量
 */

export const ROUTES = {
  HOME: '/',
  MATERIAL_CONTROL: '/material-control',
  PLAN_ORDER_PURCHASE: '/plan/order/purchase',
  PLAN_ORDER_PRODUCTION: '/plan/order/production',
  PLAN_ORDER_OUTSOURCE: '/plan/order/outsource',
  PLAN_DEMAND_CALCULATION: '/plan/demand-calculation',
  SALES_ORDER: '/sales/order',
  SALES_DETAIL: '/sales/detail',
} as const

/** 带路由的菜单 key（供 Layout 导航使用） */
export const ROUTE_MENU_KEYS = [
  ROUTES.PLAN_DEMAND_CALCULATION,
  ROUTES.PLAN_ORDER_PURCHASE,
  ROUTES.PLAN_ORDER_PRODUCTION,
  ROUTES.PLAN_ORDER_OUTSOURCE,
  ROUTES.MATERIAL_CONTROL,
  ROUTES.SALES_ORDER,
  ROUTES.SALES_DETAIL,
] as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
