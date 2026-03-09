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

/** 需求计划列表项 */
export interface PlanOrderItem {
  key: string
  rowKey?: string
  planNo: string
  productCode: string
  productName: string
  specification: string
  suggestedQty: number
  planQty: number
  unit: string
  planStartDate: string
  planEndDate: string
  approvalStatus: string
  releaseStatus: string
  releaseType: string
  supplier: string
  calcRecord: string
  sourceDocType: string
  sourceDocNo: string
  sourceDocDetail: string
  createBy: string
  createTime: string
  updateBy: string
  updateTime: string
  approver: string
  approvalTime: string
  [key: string]: any
}
