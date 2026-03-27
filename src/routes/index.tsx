import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import MaterialControlWorkbench from '@/pages/MaterialControlWorkbench'
import PurchasePlan from '@/pages/PurchasePlan'
import ProductionPlan from '@/pages/ProductionPlan'
import OutsourcePlan from '@/pages/OutsourcePlan'
import DemandCalculation from '@/pages/DemandCalculation'
import SalesOrder from '@/pages/SalesOrder'
import SalesDetail from '@/pages/SalesDetail'
import { ROUTES } from '@/constants/routes'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.SALES_DETAIL} replace />} />
          <Route path={ROUTES.MATERIAL_CONTROL} element={<MaterialControlWorkbench />} />
          <Route path={ROUTES.PLAN_ORDER_PURCHASE} element={<PurchasePlan />} />
          <Route path={ROUTES.PLAN_ORDER_PRODUCTION} element={<ProductionPlan />} />
          <Route path={ROUTES.PLAN_ORDER_OUTSOURCE} element={<OutsourcePlan />} />
          <Route path={ROUTES.PLAN_DEMAND_CALCULATION} element={<DemandCalculation />} />
          <Route path={ROUTES.SALES_ORDER} element={<SalesOrder />} />
          <Route path={ROUTES.SALES_DETAIL} element={<SalesDetail />} />
          <Route path="*" element={<Navigate to={ROUTES.SALES_DETAIL} replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default AppRoutes
