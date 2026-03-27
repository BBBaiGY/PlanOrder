/**
 * 供需检查 / 需求建议 相关类型定义
 */

export interface TimeDataItem {
  date: string
  demand: number
  supply: number
  balance: number
}

export interface MaterialItem {
  key: string
  materialCode: string
  materialName: string
  specification: string
  unit: string
  safetyStock: number
  currentStock: number
  shortageQty: number
  supplier: string
  workshop: string
  expanded?: boolean
  timeData?: TimeDataItem[]
  planNew?: number
  purchaseInTransit?: number
  productionWip?: number
  salesPendingIssue?: number
  planPendingPick?: number
  productionPendingPick?: number
  expectedIn?: number
  expectedOut?: number
  availableStock?: number
  rowType?: '需求' | '供给' | '结存'
  rowKey?: string
  initialValue?: number
  dateValue?: number
  endValue?: number
  totalValue?: number
  [key: string]: any
}

export interface SupplyDemandDetail {
  key: string
  type: '需求' | '供给'
  docType: string
  docDate: string
  docNo: string
  docStatus: string
  lineNo: number
  unit: string
  qty: number
  executedQty: number
  unexecutedQty: number
  exception: string
}

export type PlanStatus = '待审批' | '待下发' | '已下发'

/** 计划用料清单行 */
export interface PlanMaterialItem {
  key: string
  productCode: string
  productName: string
  specification: string
  unitUsage: number
  demandQty: number
  issueProcess: string
  remark: string
  customField: string
  [key: string]: any
}

/** 需求计划列表项 */
export interface PlanOrderItem {
  key: string
  rowKey?: string
  planNo: string
  planDate: string
  productCode: string
  productName: string
  specification: string
  suggestedQty: number
  planQty: number
  unit: string
  demandDate: string
  planReleaseDate?: string
  planExecDate?: string
  planStartDate: string
  planEndDate: string
  planStatus?: PlanStatus
  approvalStatus: string
  releaseStatus: string
  releaseType: string
  supplier: string
  calcRecord: string
  sourceDocType: string
  sourceDocNo: string
  sourceDocDetail: string
  sourceDemandDate: string
  sourceCustomer: string
  bomParentProduct: string
  sourceDocProduct: string
  remark: string
  generatedDoc: string
  actualIssueQty: number
  createBy: string
  createTime: string
  updateBy: string
  updateTime: string
  approver: string
  approvalTime: string
  materialList?: PlanMaterialItem[]
  [key: string]: any
}
