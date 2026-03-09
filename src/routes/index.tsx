import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import MaterialControlWorkbench from '@/pages/MaterialControlWorkbench'
import PlanOrder from '@/pages/PlanOrder'
import DemandCalculation from '@/pages/DemandCalculation'
import SalesOrder from '@/pages/SalesOrder'
import SalesDetail from '@/pages/SalesDetail'
import { ROUTES } from '@/constants/routes'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path={ROUTES.HOME} element={<MaterialControlWorkbench />} />
          <Route path={ROUTES.MATERIAL_CONTROL} element={<MaterialControlWorkbench />} />
          <Route path={ROUTES.PLAN_ORDER} element={<PlanOrder />} />
          <Route path={ROUTES.PLAN_DEMAND_CALCULATION} element={<DemandCalculation />} />
          <Route path={ROUTES.SALES_ORDER} element={<SalesOrder />} />
          <Route path={ROUTES.SALES_DETAIL} element={<SalesDetail />} />
          <Route path="*" element={<MaterialControlWorkbench />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default AppRoutes
