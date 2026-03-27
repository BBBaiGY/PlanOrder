import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Input,
  message,
  Dropdown,
  Modal,
  Form,
  DatePicker,
} from 'antd'
import {
  ReloadOutlined,
  SettingOutlined,
  ColumnHeightOutlined,
  SortAscendingOutlined,
  SearchOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PlanOrderItem, PlanStatus } from '@/types/supply-demand'
import ResizableTitle from '@/components/common/ResizableTitle'
import EditDrawer from './EditDrawer'
import SplitModal from './SplitModal'
import dayjs from 'dayjs'
import { useLocation } from 'react-router-dom'
import './index.css'

const getApprovalStatusStyle = (status: string) => {
  const map: Record<string, { color: string; background: string }> = {
    已审批: { color: '#389e0d', background: '#f6ffed' },
    待审批: { color: '#d46b08', background: '#fff7e6' },
  }
  return map[status] || { color: '#595959', background: '#fafafa' }
}

const getReleaseStatusStyle = (status: string) => {
  const map: Record<string, { color: string; background: string }> = {
    已下发: { color: '#389e0d', background: '#f6ffed' },
    未下发: { color: '#8c8c8c', background: '#f5f5f5' },
  }
  return map[status] || { color: '#595959', background: '#fafafa' }
}

const getPlanStatusStyle = (status: PlanStatus) => {
  const map: Record<PlanStatus, { color: string; background: string }> = {
    待审批: { color: '#d46b08', background: '#fff7e6' },
    待下发: { color: '#1677ff', background: '#e6f4ff' },
    已下发: { color: '#389e0d', background: '#f6ffed' },
  }
  return map[status]
}

const getPlanStatusFromLegacy = (item: Pick<PlanOrderItem, 'approvalStatus' | 'releaseStatus'>): PlanStatus => {
  if (item.releaseStatus === '已下发') return '已下发'
  if (item.approvalStatus === '已审批') return '待下发'
  return '待审批'
}

const initialPlanOrderData: PlanOrderItem[] = [
  {
    key: '1',
    planNo: 'XQJH202601001',
    planDate: '2026-01-25',
    productCode: 'BB00001',
    productName: '成品A',
    specification: '100*50*30mm',
    suggestedQty: 100,
    planQty: 100,
    unit: '件',
    demandDate: '2026-01-28',
    planExecDate: '2026-01-29',
    planStartDate: '2026-01-25',
    planEndDate: '2026-02-10',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商A',
    calcRecord: 'MRP-20260125-001',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202601001',
    sourceDocDetail: '行号1',
    sourceDemandDate: '2026-01-24',
    sourceCustomer: '华东客户A',
    bomParentProduct: '-',
    sourceDocProduct: 'BB00001 / 成品A',
    remark: '-',
    generatedDoc: 'CGDD-202601-001',
    actualIssueQty: 100,
    createBy: '张三',
    createTime: '2026-01-25 09:00:00',
    updateBy: '李四',
    updateTime: '2026-01-25 14:30:00',
    approver: '王五',
    approvalTime: '2026-01-25 11:00:00',
  },
  {
    key: '2',
    planNo: 'XQJH202601002',
    planDate: '2026-01-26',
    productCode: 'BB00002',
    productName: '成品B',
    specification: '120*60*40mm',
    suggestedQty: 80,
    planQty: 80,
    unit: '件',
    demandDate: '2026-01-30',
    planExecDate: '2026-01-31',
    planStartDate: '2026-01-26',
    planEndDate: '2026-02-12',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '供应商B',
    calcRecord: 'MRP-20260126-002',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202601002',
    sourceDocDetail: '行号2',
    sourceDemandDate: '2026-01-25',
    sourceCustomer: '华南客户B',
    bomParentProduct: '-',
    sourceDocProduct: 'BB00002 / 成品B',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '张三',
    createTime: '2026-01-26 10:00:00',
    updateBy: '张三',
    updateTime: '2026-01-26 10:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '3',
    planNo: 'XQJH202601003',
    planDate: '2026-01-25',
    productCode: 'BB00003',
    productName: '半成品01',
    specification: '80*40*20mm',
    suggestedQty: 385,
    planQty: 400,
    unit: '件',
    demandDate: '2026-01-28',
    planExecDate: '2026-01-28',
    planStartDate: '2026-01-25',
    planEndDate: '2026-01-30',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '委外',
    supplier: '供应商C',
    calcRecord: 'MRP-20260125-003',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202601001',
    sourceDocDetail: '',
    sourceDemandDate: '2026-01-24',
    sourceCustomer: '华东客户A',
    bomParentProduct: 'BB00001 / 成品A',
    sourceDocProduct: 'BB00001 / 成品A',
    remark: '需补货',
    generatedDoc: 'WWDD-202601-001',
    actualIssueQty: 400,
    createBy: '李四',
    createTime: '2026-01-25 08:30:00',
    updateBy: '王五',
    updateTime: '2026-01-25 16:00:00',
    approver: '王五',
    approvalTime: '2026-01-25 12:00:00',
  },
  {
    key: '4',
    planNo: 'XQJH202601004',
    planDate: '2026-01-27',
    productCode: 'BB00004',
    productName: '半成品02',
    specification: '90*45*25mm',
    suggestedQty: 50,
    planQty: 50,
    unit: '件',
    demandDate: '2026-01-30',
    planExecDate: '2026-01-31',
    planStartDate: '2026-01-27',
    planEndDate: '2026-02-05',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商D',
    calcRecord: 'MRP-20260127-004',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202601002',
    sourceDocDetail: '',
    sourceDemandDate: '2026-01-26',
    sourceCustomer: '华南客户B',
    bomParentProduct: 'BB00002 / 成品B',
    sourceDocProduct: 'BB00002 / 成品B',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '张三',
    createTime: '2026-01-27 09:15:00',
    updateBy: '李四',
    updateTime: '2026-01-27 11:20:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '5',
    planNo: 'XQJH202601005',
    planDate: '2026-01-28',
    productCode: 'BB00005',
    productName: '原材料01',
    specification: 'Q235钢材',
    suggestedQty: 200,
    planQty: 200,
    unit: 'kg',
    demandDate: '2026-02-05',
    planExecDate: '2026-02-06',
    planStartDate: '2026-01-28',
    planEndDate: '2026-02-15',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商E',
    calcRecord: 'MRP-20260128-005',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202601003',
    sourceDocDetail: '行号3',
    sourceDemandDate: '2026-01-27',
    sourceCustomer: '西北客户C',
    bomParentProduct: 'BB00003 / 半成品01',
    sourceDocProduct: 'BB00001 / 成品A',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-01-28 14:00:00',
    updateBy: '李四',
    updateTime: '2026-01-28 14:00:00',
    approver: '王五',
    approvalTime: '2026-01-28 15:00:00',
  },
  {
    key: '6',
    planNo: 'XQJH202602001',
    planDate: '2026-02-01',
    productCode: 'BB00006',
    productName: '原材料02',
    specification: '铝板 2mm',
    suggestedQty: 320,
    planQty: 300,
    unit: 'kg',
    demandDate: '2026-02-08',
    planExecDate: '2026-02-09',
    planStartDate: '2026-02-01',
    planEndDate: '2026-02-16',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商F',
    calcRecord: 'MRP-20260201-001',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202602001',
    sourceDocDetail: '行号1',
    sourceDemandDate: '2026-01-31',
    sourceCustomer: '华北客户D',
    bomParentProduct: 'BB00010 / 成品C',
    sourceDocProduct: 'BB00006 / 原材料02',
    remark: '优先到货',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-02-01 09:20:00',
    updateBy: '赵六',
    updateTime: '2026-02-01 09:20:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '7',
    planNo: 'XQJH202602002',
    planDate: '2026-02-02',
    productCode: 'BB00007',
    productName: '原材料03',
    specification: 'ABS粒料',
    suggestedQty: 500,
    planQty: 520,
    unit: 'kg',
    demandDate: '2026-02-10',
    planExecDate: '2026-02-11',
    planStartDate: '2026-02-02',
    planEndDate: '2026-02-18',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商G',
    calcRecord: 'MRP-20260202-002',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202602002',
    sourceDocDetail: '行号2',
    sourceDemandDate: '2026-02-01',
    sourceCustomer: '华中客户E',
    bomParentProduct: 'BB00011 / 成品D',
    sourceDocProduct: 'BB00007 / 原材料03',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-02-02 10:10:00',
    updateBy: '王五',
    updateTime: '2026-02-02 14:40:00',
    approver: '王五',
    approvalTime: '2026-02-02 13:30:00',
  },
  {
    key: '8',
    planNo: 'XQJH202602003',
    planDate: '2026-02-03',
    productCode: 'BB00008',
    productName: '半成品03',
    specification: '150*80*40mm',
    suggestedQty: 120,
    planQty: 120,
    unit: '件',
    demandDate: '2026-02-12',
    planExecDate: '2026-02-12',
    planStartDate: '2026-02-03',
    planEndDate: '2026-02-14',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260203-003',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202602001',
    sourceDocDetail: '工序10',
    sourceDemandDate: '2026-02-02',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB00012 / 成品E',
    sourceDocProduct: 'BB00008 / 半成品03',
    remark: '优先排产',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-02-03 08:50:00',
    updateBy: '李四',
    updateTime: '2026-02-03 08:50:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '9',
    planNo: 'XQJH202602004',
    planDate: '2026-02-04',
    productCode: 'BB00009',
    productName: '半成品04',
    specification: '200*100*60mm',
    suggestedQty: 60,
    planQty: 60,
    unit: '件',
    demandDate: '2026-02-15',
    planExecDate: '2026-02-16',
    planStartDate: '2026-02-04',
    planEndDate: '2026-02-20',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260204-004',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202602002',
    sourceDocDetail: '工序20',
    sourceDemandDate: '2026-02-03',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB00013 / 成品F',
    sourceDocProduct: 'BB00009 / 半成品04',
    remark: '-',
    generatedDoc: 'SCDD-202602-001',
    actualIssueQty: 60,
    createBy: '张三',
    createTime: '2026-02-04 09:30:00',
    updateBy: '王五',
    updateTime: '2026-02-04 16:20:00',
    approver: '王五',
    approvalTime: '2026-02-04 11:00:00',
  },
  {
    key: '10',
    planNo: 'XQJH202602005',
    planDate: '2026-02-05',
    productCode: 'BB00014',
    productName: '原材料04',
    specification: '不锈钢板 1.5mm',
    suggestedQty: 180,
    planQty: 200,
    unit: 'kg',
    demandDate: '2026-02-18',
    planExecDate: '2026-02-19',
    planStartDate: '2026-02-05',
    planEndDate: '2026-02-22',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商H',
    calcRecord: 'MRP-20260205-005',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202602003',
    sourceDocDetail: '行号3',
    sourceDemandDate: '2026-02-04',
    sourceCustomer: '华东客户F',
    bomParentProduct: 'BB00014 / 原材料04',
    sourceDocProduct: 'BB00014 / 原材料04',
    remark: '分批到货',
    generatedDoc: 'CGDD-202602-010',
    actualIssueQty: 200,
    createBy: '赵六',
    createTime: '2026-02-05 10:00:00',
    updateBy: '王五',
    updateTime: '2026-02-05 17:10:00',
    approver: '王五',
    approvalTime: '2026-02-05 13:15:00',
  },
  {
    key: '11',
    planNo: 'XQJH202602006',
    planDate: '2026-02-06',
    productCode: 'BB00015',
    productName: '原材料05',
    specification: '铜排 10mm',
    suggestedQty: 90,
    planQty: 88,
    unit: 'kg',
    demandDate: '2026-02-20',
    planExecDate: '2026-02-21',
    planStartDate: '2026-02-06',
    planEndDate: '2026-02-24',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商I',
    calcRecord: 'MRP-20260206-006',
    sourceDocType: '销售预测',
    sourceDocNo: 'XSYC202602001',
    sourceDocDetail: '周期W7',
    sourceDemandDate: '2026-02-05',
    sourceCustomer: '预测需求',
    bomParentProduct: 'BB00020 / 成品G',
    sourceDocProduct: 'BB00015 / 原材料05',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '张三',
    createTime: '2026-02-06 09:05:00',
    updateBy: '张三',
    updateTime: '2026-02-06 09:05:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '12',
    planNo: 'XQJH202602007',
    planDate: '2026-02-07',
    productCode: 'BB00016',
    productName: '半成品05',
    specification: '220*90*45mm',
    suggestedQty: 140,
    planQty: 150,
    unit: '件',
    demandDate: '2026-02-22',
    planExecDate: '2026-02-23',
    planStartDate: '2026-02-07',
    planEndDate: '2026-02-25',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260207-007',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202602001',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-02-06',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB00021 / 成品H',
    sourceDocProduct: 'BB00016 / 半成品05',
    remark: '优先线体A',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-02-07 08:30:00',
    updateBy: '王五',
    updateTime: '2026-02-07 15:25:00',
    approver: '王五',
    approvalTime: '2026-02-07 10:40:00',
  },
  {
    key: '13',
    planNo: 'XQJH202602008',
    planDate: '2026-02-08',
    productCode: 'BB00017',
    productName: '半成品06',
    specification: '180*75*35mm',
    suggestedQty: 75,
    planQty: 75,
    unit: '件',
    demandDate: '2026-02-24',
    planExecDate: '2026-02-24',
    planStartDate: '2026-02-08',
    planEndDate: '2026-02-26',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260208-008',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202602003',
    sourceDocDetail: '工序30',
    sourceDemandDate: '2026-02-07',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB00022 / 成品I',
    sourceDocProduct: 'BB00017 / 半成品06',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-02-08 09:40:00',
    updateBy: '李四',
    updateTime: '2026-02-08 09:40:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '14',
    planNo: 'XQJH202602009',
    planDate: '2026-02-09',
    productCode: 'BB00018',
    productName: '原材料06',
    specification: 'PET薄膜',
    suggestedQty: 260,
    planQty: 250,
    unit: 'kg',
    demandDate: '2026-02-26',
    planExecDate: '2026-02-27',
    planStartDate: '2026-02-09',
    planEndDate: '2026-02-28',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商J',
    calcRecord: 'MRP-20260209-009',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202602004',
    sourceDocDetail: '行号4',
    sourceDemandDate: '2026-02-08',
    sourceCustomer: '西南客户G',
    bomParentProduct: 'BB00023 / 成品J',
    sourceDocProduct: 'BB00018 / 原材料06',
    remark: '需送检',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-02-09 10:35:00',
    updateBy: '王五',
    updateTime: '2026-02-09 14:10:00',
    approver: '王五',
    approvalTime: '2026-02-09 11:50:00',
  },
  {
    key: '15',
    planNo: 'XQJH202602010',
    planDate: '2026-02-10',
    productCode: 'BB00019',
    productName: '半成品07',
    specification: '95*50*28mm',
    suggestedQty: 210,
    planQty: 220,
    unit: '件',
    demandDate: '2026-02-28',
    planExecDate: '2026-03-01',
    planStartDate: '2026-02-10',
    planEndDate: '2026-03-03',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260210-010',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202602002',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-02-09',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB00024 / 成品K',
    sourceDocProduct: 'BB00019 / 半成品07',
    remark: '夜班生产',
    generatedDoc: 'SCDD-202602-002',
    actualIssueQty: 220,
    createBy: '张三',
    createTime: '2026-02-10 08:15:00',
    updateBy: '王五',
    updateTime: '2026-02-10 18:00:00',
    approver: '王五',
    approvalTime: '2026-02-10 10:05:00',
  },
  {
    key: '16',
    planNo: 'XQJH202603001',
    planDate: '2026-03-01',
    productCode: 'BB00100',
    productName: '原材料07',
    specification: '冷轧钢卷',
    suggestedQty: 120,
    planQty: 120,
    unit: 'kg',
    demandDate: '2026-03-08',
    planExecDate: '2026-03-09',
    planStartDate: '2026-03-01',
    planEndDate: '2026-03-12',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商K',
    calcRecord: 'MRP-20260301-001',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603001',
    sourceDocDetail: '行号1',
    sourceDemandDate: '2026-02-28',
    sourceCustomer: '华东客户A',
    bomParentProduct: 'BB01000 / 成品L',
    sourceDocProduct: 'BB00100 / 原材料07',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-01 09:00:00',
    updateBy: '赵六',
    updateTime: '2026-03-01 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '17',
    planNo: 'XQJH202603002',
    planDate: '2026-03-02',
    productCode: 'BB00101',
    productName: '半成品08',
    specification: '100*60*35mm',
    suggestedQty: 135,
    planQty: 140,
    unit: '件',
    demandDate: '2026-03-09',
    planExecDate: '2026-03-10',
    planStartDate: '2026-03-02',
    planEndDate: '2026-03-13',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260302-002',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603001',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-01',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01001 / 成品M',
    sourceDocProduct: 'BB00101 / 半成品08',
    remark: '优先产线A',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-02 09:10:00',
    updateBy: '王五',
    updateTime: '2026-03-02 11:30:00',
    approver: '王五',
    approvalTime: '2026-03-02 10:40:00',
  },
  {
    key: '18',
    planNo: 'XQJH202603003',
    planDate: '2026-03-03',
    productCode: 'BB00102',
    productName: '原材料08',
    specification: 'PC粒料',
    suggestedQty: 150,
    planQty: 160,
    unit: 'kg',
    demandDate: '2026-03-10',
    planExecDate: '2026-03-11',
    planStartDate: '2026-03-03',
    planEndDate: '2026-03-14',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商L',
    calcRecord: 'MRP-20260303-003',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603002',
    sourceDocDetail: '行号2',
    sourceDemandDate: '2026-03-02',
    sourceCustomer: '华南客户B',
    bomParentProduct: 'BB01002 / 成品N',
    sourceDocProduct: 'BB00102 / 原材料08',
    remark: '-',
    generatedDoc: 'CGDD-202603-001',
    actualIssueQty: 160,
    createBy: '赵六',
    createTime: '2026-03-03 08:45:00',
    updateBy: '王五',
    updateTime: '2026-03-03 15:20:00',
    approver: '王五',
    approvalTime: '2026-03-03 09:30:00',
  },
  {
    key: '19',
    planNo: 'XQJH202603004',
    planDate: '2026-03-04',
    productCode: 'BB00103',
    productName: '半成品09',
    specification: '110*62*36mm',
    suggestedQty: 165,
    planQty: 165,
    unit: '件',
    demandDate: '2026-03-11',
    planExecDate: '2026-03-12',
    planStartDate: '2026-03-04',
    planEndDate: '2026-03-15',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260304-004',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603001',
    sourceDocDetail: '工序10',
    sourceDemandDate: '2026-03-03',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01003 / 成品O',
    sourceDocProduct: 'BB00103 / 半成品09',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-04 09:00:00',
    updateBy: '李四',
    updateTime: '2026-03-04 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '20',
    planNo: 'XQJH202603005',
    planDate: '2026-03-05',
    productCode: 'BB00104',
    productName: '原材料09',
    specification: '镀锌板 1.0mm',
    suggestedQty: 180,
    planQty: 185,
    unit: 'kg',
    demandDate: '2026-03-12',
    planExecDate: '2026-03-13',
    planStartDate: '2026-03-05',
    planEndDate: '2026-03-16',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商M',
    calcRecord: 'MRP-20260305-005',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603003',
    sourceDocDetail: '行号3',
    sourceDemandDate: '2026-03-04',
    sourceCustomer: '西北客户C',
    bomParentProduct: 'BB01004 / 成品P',
    sourceDocProduct: 'BB00104 / 原材料09',
    remark: '急料',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-05 09:15:00',
    updateBy: '王五',
    updateTime: '2026-03-05 10:50:00',
    approver: '王五',
    approvalTime: '2026-03-05 10:20:00',
  },
  {
    key: '21',
    planNo: 'XQJH202603006',
    planDate: '2026-03-06',
    productCode: 'BB00105',
    productName: '半成品10',
    specification: '120*64*37mm',
    suggestedQty: 195,
    planQty: 200,
    unit: '件',
    demandDate: '2026-03-13',
    planExecDate: '2026-03-14',
    planStartDate: '2026-03-06',
    planEndDate: '2026-03-17',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260306-006',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603002',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-05',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01005 / 成品Q',
    sourceDocProduct: 'BB00105 / 半成品10',
    remark: '-',
    generatedDoc: 'SCDD-202603-001',
    actualIssueQty: 200,
    createBy: '张三',
    createTime: '2026-03-06 08:40:00',
    updateBy: '王五',
    updateTime: '2026-03-06 16:10:00',
    approver: '王五',
    approvalTime: '2026-03-06 09:40:00',
  },
  {
    key: '22',
    planNo: 'XQJH202603007',
    planDate: '2026-03-07',
    productCode: 'BB00106',
    productName: '原材料10',
    specification: '铜箔 0.3mm',
    suggestedQty: 210,
    planQty: 205,
    unit: 'kg',
    demandDate: '2026-03-14',
    planExecDate: '2026-03-15',
    planStartDate: '2026-03-07',
    planEndDate: '2026-03-18',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商N',
    calcRecord: 'MRP-20260307-007',
    sourceDocType: '销售预测',
    sourceDocNo: 'XSYC202603001',
    sourceDocDetail: '周期W10',
    sourceDemandDate: '2026-03-06',
    sourceCustomer: '预测需求',
    bomParentProduct: 'BB01006 / 成品R',
    sourceDocProduct: 'BB00106 / 原材料10',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-07 09:00:00',
    updateBy: '赵六',
    updateTime: '2026-03-07 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '23',
    planNo: 'XQJH202603008',
    planDate: '2026-03-08',
    productCode: 'BB00107',
    productName: '半成品11',
    specification: '130*66*38mm',
    suggestedQty: 225,
    planQty: 230,
    unit: '件',
    demandDate: '2026-03-15',
    planExecDate: '2026-03-16',
    planStartDate: '2026-03-08',
    planEndDate: '2026-03-19',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260308-008',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603002',
    sourceDocDetail: '工序20',
    sourceDemandDate: '2026-03-07',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01007 / 成品S',
    sourceDocProduct: 'BB00107 / 半成品11',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-08 09:30:00',
    updateBy: '王五',
    updateTime: '2026-03-08 11:20:00',
    approver: '王五',
    approvalTime: '2026-03-08 10:10:00',
  },
  {
    key: '24',
    planNo: 'XQJH202603009',
    planDate: '2026-03-09',
    productCode: 'BB00108',
    productName: '原材料11',
    specification: 'PA66粒料',
    suggestedQty: 240,
    planQty: 245,
    unit: 'kg',
    demandDate: '2026-03-16',
    planExecDate: '2026-03-17',
    planStartDate: '2026-03-09',
    planEndDate: '2026-03-20',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商O',
    calcRecord: 'MRP-20260309-009',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603004',
    sourceDocDetail: '行号4',
    sourceDemandDate: '2026-03-08',
    sourceCustomer: '华中客户D',
    bomParentProduct: 'BB01008 / 成品T',
    sourceDocProduct: 'BB00108 / 原材料11',
    remark: '-',
    generatedDoc: 'CGDD-202603-002',
    actualIssueQty: 245,
    createBy: '赵六',
    createTime: '2026-03-09 08:50:00',
    updateBy: '王五',
    updateTime: '2026-03-09 15:00:00',
    approver: '王五',
    approvalTime: '2026-03-09 09:40:00',
  },
  {
    key: '25',
    planNo: 'XQJH202603010',
    planDate: '2026-03-10',
    productCode: 'BB00109',
    productName: '半成品12',
    specification: '140*68*39mm',
    suggestedQty: 255,
    planQty: 260,
    unit: '件',
    demandDate: '2026-03-17',
    planExecDate: '2026-03-18',
    planStartDate: '2026-03-10',
    planEndDate: '2026-03-21',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260310-010',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603003',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-09',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01009 / 成品U',
    sourceDocProduct: 'BB00109 / 半成品12',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-10 09:00:00',
    updateBy: '李四',
    updateTime: '2026-03-10 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '26',
    planNo: 'XQJH202603011',
    planDate: '2026-03-11',
    productCode: 'BB00110',
    productName: '原材料12',
    specification: '硅胶 50A',
    suggestedQty: 270,
    planQty: 265,
    unit: 'kg',
    demandDate: '2026-03-18',
    planExecDate: '2026-03-19',
    planStartDate: '2026-03-11',
    planEndDate: '2026-03-22',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商P',
    calcRecord: 'MRP-20260311-011',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603005',
    sourceDocDetail: '行号5',
    sourceDemandDate: '2026-03-10',
    sourceCustomer: '西南客户E',
    bomParentProduct: 'BB01010 / 成品V',
    sourceDocProduct: 'BB00110 / 原材料12',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-11 09:20:00',
    updateBy: '王五',
    updateTime: '2026-03-11 11:00:00',
    approver: '王五',
    approvalTime: '2026-03-11 10:20:00',
  },
  {
    key: '27',
    planNo: 'XQJH202603012',
    planDate: '2026-03-12',
    productCode: 'BB00111',
    productName: '半成品13',
    specification: '150*70*40mm',
    suggestedQty: 285,
    planQty: 290,
    unit: '件',
    demandDate: '2026-03-19',
    planExecDate: '2026-03-20',
    planStartDate: '2026-03-12',
    planEndDate: '2026-03-23',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260312-012',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603003',
    sourceDocDetail: '工序30',
    sourceDemandDate: '2026-03-11',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01011 / 成品W',
    sourceDocProduct: 'BB00111 / 半成品13',
    remark: '-',
    generatedDoc: 'SCDD-202603-002',
    actualIssueQty: 290,
    createBy: '张三',
    createTime: '2026-03-12 08:30:00',
    updateBy: '王五',
    updateTime: '2026-03-12 16:30:00',
    approver: '王五',
    approvalTime: '2026-03-12 09:20:00',
  },
  {
    key: '28',
    planNo: 'XQJH202603013',
    planDate: '2026-03-13',
    productCode: 'BB00112',
    productName: '原材料13',
    specification: '铝棒 10mm',
    suggestedQty: 300,
    planQty: 300,
    unit: 'kg',
    demandDate: '2026-03-20',
    planExecDate: '2026-03-21',
    planStartDate: '2026-03-13',
    planEndDate: '2026-03-24',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商Q',
    calcRecord: 'MRP-20260313-013',
    sourceDocType: '销售预测',
    sourceDocNo: 'XSYC202603002',
    sourceDocDetail: '周期W11',
    sourceDemandDate: '2026-03-12',
    sourceCustomer: '预测需求',
    bomParentProduct: 'BB01012 / 成品X',
    sourceDocProduct: 'BB00112 / 原材料13',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-13 09:10:00',
    updateBy: '赵六',
    updateTime: '2026-03-13 09:10:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '29',
    planNo: 'XQJH202603014',
    planDate: '2026-03-14',
    productCode: 'BB00113',
    productName: '半成品14',
    specification: '160*72*41mm',
    suggestedQty: 315,
    planQty: 320,
    unit: '件',
    demandDate: '2026-03-21',
    planExecDate: '2026-03-22',
    planStartDate: '2026-03-14',
    planEndDate: '2026-03-25',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260314-014',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603004',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-13',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01013 / 成品Y',
    sourceDocProduct: 'BB00113 / 半成品14',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-14 09:40:00',
    updateBy: '王五',
    updateTime: '2026-03-14 10:50:00',
    approver: '王五',
    approvalTime: '2026-03-14 10:15:00',
  },
  {
    key: '30',
    planNo: 'XQJH202603015',
    planDate: '2026-03-15',
    productCode: 'BB00114',
    productName: '原材料14',
    specification: 'EVA粒料',
    suggestedQty: 330,
    planQty: 335,
    unit: 'kg',
    demandDate: '2026-03-22',
    planExecDate: '2026-03-23',
    planStartDate: '2026-03-15',
    planEndDate: '2026-03-26',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商R',
    calcRecord: 'MRP-20260315-015',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603006',
    sourceDocDetail: '行号6',
    sourceDemandDate: '2026-03-14',
    sourceCustomer: '华东客户F',
    bomParentProduct: 'BB01014 / 成品Z',
    sourceDocProduct: 'BB00114 / 原材料14',
    remark: '-',
    generatedDoc: 'CGDD-202603-003',
    actualIssueQty: 335,
    createBy: '赵六',
    createTime: '2026-03-15 08:40:00',
    updateBy: '王五',
    updateTime: '2026-03-15 16:00:00',
    approver: '王五',
    approvalTime: '2026-03-15 09:20:00',
  },
  {
    key: '31',
    planNo: 'XQJH202603016',
    planDate: '2026-03-16',
    productCode: 'BB00115',
    productName: '半成品15',
    specification: '170*74*42mm',
    suggestedQty: 345,
    planQty: 350,
    unit: '件',
    demandDate: '2026-03-23',
    planExecDate: '2026-03-24',
    planStartDate: '2026-03-16',
    planEndDate: '2026-03-27',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260316-016',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603004',
    sourceDocDetail: '工序40',
    sourceDemandDate: '2026-03-15',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01015 / 成品AA',
    sourceDocProduct: 'BB00115 / 半成品15',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-16 09:00:00',
    updateBy: '李四',
    updateTime: '2026-03-16 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '32',
    planNo: 'XQJH202603017',
    planDate: '2026-03-17',
    productCode: 'BB00116',
    productName: '原材料15',
    specification: '不锈钢丝',
    suggestedQty: 360,
    planQty: 365,
    unit: 'kg',
    demandDate: '2026-03-24',
    planExecDate: '2026-03-25',
    planStartDate: '2026-03-17',
    planEndDate: '2026-03-28',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商S',
    calcRecord: 'MRP-20260317-017',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603007',
    sourceDocDetail: '行号7',
    sourceDemandDate: '2026-03-16',
    sourceCustomer: '华南客户G',
    bomParentProduct: 'BB01016 / 成品AB',
    sourceDocProduct: 'BB00116 / 原材料15',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-17 09:20:00',
    updateBy: '王五',
    updateTime: '2026-03-17 10:40:00',
    approver: '王五',
    approvalTime: '2026-03-17 10:00:00',
  },
  {
    key: '33',
    planNo: 'XQJH202603018',
    planDate: '2026-03-18',
    productCode: 'BB00117',
    productName: '半成品16',
    specification: '180*76*43mm',
    suggestedQty: 375,
    planQty: 380,
    unit: '件',
    demandDate: '2026-03-25',
    planExecDate: '2026-03-26',
    planStartDate: '2026-03-18',
    planEndDate: '2026-03-29',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260318-018',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603005',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-17',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01017 / 成品AC',
    sourceDocProduct: 'BB00117 / 半成品16',
    remark: '-',
    generatedDoc: 'SCDD-202603-003',
    actualIssueQty: 380,
    createBy: '张三',
    createTime: '2026-03-18 08:50:00',
    updateBy: '王五',
    updateTime: '2026-03-18 16:20:00',
    approver: '王五',
    approvalTime: '2026-03-18 09:20:00',
  },
  {
    key: '34',
    planNo: 'XQJH202603019',
    planDate: '2026-03-19',
    productCode: 'BB00118',
    productName: '原材料16',
    specification: '尼龙棒',
    suggestedQty: 390,
    planQty: 395,
    unit: 'kg',
    demandDate: '2026-03-26',
    planExecDate: '2026-03-27',
    planStartDate: '2026-03-19',
    planEndDate: '2026-03-30',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商T',
    calcRecord: 'MRP-20260319-019',
    sourceDocType: '销售预测',
    sourceDocNo: 'XSYC202603003',
    sourceDocDetail: '周期W12',
    sourceDemandDate: '2026-03-18',
    sourceCustomer: '预测需求',
    bomParentProduct: 'BB01018 / 成品AD',
    sourceDocProduct: 'BB00118 / 原材料16',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-19 09:10:00',
    updateBy: '赵六',
    updateTime: '2026-03-19 09:10:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '35',
    planNo: 'XQJH202603020',
    planDate: '2026-03-20',
    productCode: 'BB00119',
    productName: '半成品17',
    specification: '190*78*44mm',
    suggestedQty: 405,
    planQty: 410,
    unit: '件',
    demandDate: '2026-03-27',
    planExecDate: '2026-03-28',
    planStartDate: '2026-03-20',
    planEndDate: '2026-03-31',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260320-020',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603005',
    sourceDocDetail: '工序50',
    sourceDemandDate: '2026-03-19',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01019 / 成品AE',
    sourceDocProduct: 'BB00119 / 半成品17',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-20 09:30:00',
    updateBy: '王五',
    updateTime: '2026-03-20 11:00:00',
    approver: '王五',
    approvalTime: '2026-03-20 10:20:00',
  },
  {
    key: '36',
    planNo: 'XQJH202603021',
    planDate: '2026-03-21',
    productCode: 'BB00120',
    productName: '原材料17',
    specification: '镁合金板',
    suggestedQty: 420,
    planQty: 425,
    unit: 'kg',
    demandDate: '2026-03-28',
    planExecDate: '2026-03-29',
    planStartDate: '2026-03-21',
    planEndDate: '2026-04-01',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商U',
    calcRecord: 'MRP-20260321-021',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603008',
    sourceDocDetail: '行号8',
    sourceDemandDate: '2026-03-20',
    sourceCustomer: '华北客户H',
    bomParentProduct: 'BB01020 / 成品AF',
    sourceDocProduct: 'BB00120 / 原材料17',
    remark: '-',
    generatedDoc: 'CGDD-202603-004',
    actualIssueQty: 425,
    createBy: '赵六',
    createTime: '2026-03-21 08:45:00',
    updateBy: '王五',
    updateTime: '2026-03-21 15:30:00',
    approver: '王五',
    approvalTime: '2026-03-21 09:30:00',
  },
  {
    key: '37',
    planNo: 'XQJH202603022',
    planDate: '2026-03-22',
    productCode: 'BB00121',
    productName: '半成品18',
    specification: '200*80*45mm',
    suggestedQty: 435,
    planQty: 440,
    unit: '件',
    demandDate: '2026-03-29',
    planExecDate: '2026-03-30',
    planStartDate: '2026-03-22',
    planEndDate: '2026-04-02',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260322-022',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603006',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-21',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01021 / 成品AG',
    sourceDocProduct: 'BB00121 / 半成品18',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-22 09:00:00',
    updateBy: '李四',
    updateTime: '2026-03-22 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '38',
    planNo: 'XQJH202603023',
    planDate: '2026-03-23',
    productCode: 'BB00122',
    productName: '原材料18',
    specification: '导电布',
    suggestedQty: 450,
    planQty: 455,
    unit: 'kg',
    demandDate: '2026-03-30',
    planExecDate: '2026-03-31',
    planStartDate: '2026-03-23',
    planEndDate: '2026-04-03',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商V',
    calcRecord: 'MRP-20260323-023',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603009',
    sourceDocDetail: '行号9',
    sourceDemandDate: '2026-03-22',
    sourceCustomer: '华东客户I',
    bomParentProduct: 'BB01022 / 成品AH',
    sourceDocProduct: 'BB00122 / 原材料18',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-23 09:20:00',
    updateBy: '王五',
    updateTime: '2026-03-23 10:50:00',
    approver: '王五',
    approvalTime: '2026-03-23 10:10:00',
  },
  {
    key: '39',
    planNo: 'XQJH202603024',
    planDate: '2026-03-24',
    productCode: 'BB00123',
    productName: '半成品19',
    specification: '210*82*46mm',
    suggestedQty: 465,
    planQty: 470,
    unit: '件',
    demandDate: '2026-03-31',
    planExecDate: '2026-04-01',
    planStartDate: '2026-03-24',
    planEndDate: '2026-04-04',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260324-024',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603006',
    sourceDocDetail: '工序60',
    sourceDemandDate: '2026-03-23',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01023 / 成品AI',
    sourceDocProduct: 'BB00123 / 半成品19',
    remark: '-',
    generatedDoc: 'SCDD-202603-004',
    actualIssueQty: 470,
    createBy: '张三',
    createTime: '2026-03-24 08:40:00',
    updateBy: '王五',
    updateTime: '2026-03-24 16:10:00',
    approver: '王五',
    approvalTime: '2026-03-24 09:20:00',
  },
  {
    key: '40',
    planNo: 'XQJH202603025',
    planDate: '2026-03-25',
    productCode: 'BB00124',
    productName: '原材料19',
    specification: '特氟龙片',
    suggestedQty: 480,
    planQty: 485,
    unit: 'kg',
    demandDate: '2026-04-01',
    planExecDate: '2026-04-02',
    planStartDate: '2026-03-25',
    planEndDate: '2026-04-05',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商W',
    calcRecord: 'MRP-20260325-025',
    sourceDocType: '销售预测',
    sourceDocNo: 'XSYC202603004',
    sourceDocDetail: '周期W13',
    sourceDemandDate: '2026-03-24',
    sourceCustomer: '预测需求',
    bomParentProduct: 'BB01024 / 成品AJ',
    sourceDocProduct: 'BB00124 / 原材料19',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-25 09:00:00',
    updateBy: '赵六',
    updateTime: '2026-03-25 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '41',
    planNo: 'XQJH202603026',
    planDate: '2026-03-26',
    productCode: 'BB00125',
    productName: '半成品20',
    specification: '220*84*47mm',
    suggestedQty: 495,
    planQty: 500,
    unit: '件',
    demandDate: '2026-04-02',
    planExecDate: '2026-04-03',
    planStartDate: '2026-03-26',
    planEndDate: '2026-04-06',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260326-026',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603007',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-25',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01025 / 成品AK',
    sourceDocProduct: 'BB00125 / 半成品20',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-26 09:20:00',
    updateBy: '王五',
    updateTime: '2026-03-26 10:40:00',
    approver: '王五',
    approvalTime: '2026-03-26 10:00:00',
  },
  {
    key: '42',
    planNo: 'XQJH202603027',
    planDate: '2026-03-27',
    productCode: 'BB00126',
    productName: '原材料20',
    specification: '碳纤维布',
    suggestedQty: 510,
    planQty: 515,
    unit: 'kg',
    demandDate: '2026-04-03',
    planExecDate: '2026-04-04',
    planStartDate: '2026-03-27',
    planEndDate: '2026-04-07',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商X',
    calcRecord: 'MRP-20260327-027',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603010',
    sourceDocDetail: '行号10',
    sourceDemandDate: '2026-03-26',
    sourceCustomer: '华中客户J',
    bomParentProduct: 'BB01026 / 成品AL',
    sourceDocProduct: 'BB00126 / 原材料20',
    remark: '-',
    generatedDoc: 'CGDD-202603-005',
    actualIssueQty: 515,
    createBy: '赵六',
    createTime: '2026-03-27 08:50:00',
    updateBy: '王五',
    updateTime: '2026-03-27 15:20:00',
    approver: '王五',
    approvalTime: '2026-03-27 09:30:00',
  },
  {
    key: '43',
    planNo: 'XQJH202603028',
    planDate: '2026-03-28',
    productCode: 'BB00127',
    productName: '半成品21',
    specification: '230*86*48mm',
    suggestedQty: 525,
    planQty: 530,
    unit: '件',
    demandDate: '2026-04-04',
    planExecDate: '2026-04-05',
    planStartDate: '2026-03-28',
    planEndDate: '2026-04-08',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260328-028',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202603007',
    sourceDocDetail: '工序70',
    sourceDemandDate: '2026-03-27',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01027 / 成品AM',
    sourceDocProduct: 'BB00127 / 半成品21',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-03-28 09:00:00',
    updateBy: '李四',
    updateTime: '2026-03-28 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '44',
    planNo: 'XQJH202603029',
    planDate: '2026-03-29',
    productCode: 'BB00128',
    productName: '原材料21',
    specification: '导热胶',
    suggestedQty: 540,
    planQty: 545,
    unit: 'kg',
    demandDate: '2026-04-05',
    planExecDate: '2026-04-06',
    planStartDate: '2026-03-29',
    planEndDate: '2026-04-09',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商Y',
    calcRecord: 'MRP-20260329-029',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202603011',
    sourceDocDetail: '行号11',
    sourceDemandDate: '2026-03-28',
    sourceCustomer: '西南客户K',
    bomParentProduct: 'BB01028 / 成品AN',
    sourceDocProduct: 'BB00128 / 原材料21',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-29 09:20:00',
    updateBy: '王五',
    updateTime: '2026-03-29 10:40:00',
    approver: '王五',
    approvalTime: '2026-03-29 10:00:00',
  },
  {
    key: '45',
    planNo: 'XQJH202603030',
    planDate: '2026-03-30',
    productCode: 'BB00129',
    productName: '半成品22',
    specification: '240*88*49mm',
    suggestedQty: 555,
    planQty: 560,
    unit: '件',
    demandDate: '2026-04-06',
    planExecDate: '2026-04-07',
    planStartDate: '2026-03-30',
    planEndDate: '2026-04-10',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260330-030',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202603008',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-03-29',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01029 / 成品AO',
    sourceDocProduct: 'BB00129 / 半成品22',
    remark: '-',
    generatedDoc: 'SCDD-202603-005',
    actualIssueQty: 560,
    createBy: '张三',
    createTime: '2026-03-30 08:40:00',
    updateBy: '王五',
    updateTime: '2026-03-30 16:10:00',
    approver: '王五',
    approvalTime: '2026-03-30 09:20:00',
  },
  {
    key: '46',
    planNo: 'XQJH202603031',
    planDate: '2026-03-31',
    productCode: 'BB00130',
    productName: '原材料22',
    specification: '高强度纤维',
    suggestedQty: 570,
    planQty: 575,
    unit: 'kg',
    demandDate: '2026-04-07',
    planExecDate: '2026-04-08',
    planStartDate: '2026-03-31',
    planEndDate: '2026-04-11',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商Z',
    calcRecord: 'MRP-20260331-031',
    sourceDocType: '销售预测',
    sourceDocNo: 'XSYC202603005',
    sourceDocDetail: '周期W14',
    sourceDemandDate: '2026-03-30',
    sourceCustomer: '预测需求',
    bomParentProduct: 'BB01030 / 成品AP',
    sourceDocProduct: 'BB00130 / 原材料22',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-03-31 09:00:00',
    updateBy: '赵六',
    updateTime: '2026-03-31 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '47',
    planNo: 'XQJH202604001',
    planDate: '2026-04-01',
    productCode: 'BB00131',
    productName: '半成品23',
    specification: '250*90*50mm',
    suggestedQty: 585,
    planQty: 590,
    unit: '件',
    demandDate: '2026-04-08',
    planExecDate: '2026-04-09',
    planStartDate: '2026-04-01',
    planEndDate: '2026-04-12',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产一车间',
    calcRecord: 'MRP-20260401-001',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202604001',
    sourceDocDetail: '工序80',
    sourceDemandDate: '2026-03-31',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01031 / 成品AQ',
    sourceDocProduct: 'BB00131 / 半成品23',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-04-01 09:20:00',
    updateBy: '王五',
    updateTime: '2026-04-01 10:40:00',
    approver: '王五',
    approvalTime: '2026-04-01 10:00:00',
  },
  {
    key: '48',
    planNo: 'XQJH202604002',
    planDate: '2026-04-02',
    productCode: 'BB00132',
    productName: '原材料23',
    specification: '改性PP',
    suggestedQty: 600,
    planQty: 605,
    unit: 'kg',
    demandDate: '2026-04-09',
    planExecDate: '2026-04-10',
    planStartDate: '2026-04-02',
    planEndDate: '2026-04-13',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商AA',
    calcRecord: 'MRP-20260402-002',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202604001',
    sourceDocDetail: '行号1',
    sourceDemandDate: '2026-04-01',
    sourceCustomer: '华东客户L',
    bomParentProduct: 'BB01032 / 成品AR',
    sourceDocProduct: 'BB00132 / 原材料23',
    remark: '-',
    generatedDoc: 'CGDD-202604-001',
    actualIssueQty: 605,
    createBy: '赵六',
    createTime: '2026-04-02 08:50:00',
    updateBy: '王五',
    updateTime: '2026-04-02 15:20:00',
    approver: '王五',
    approvalTime: '2026-04-02 09:30:00',
  },
  {
    key: '49',
    planNo: 'XQJH202604003',
    planDate: '2026-04-03',
    productCode: 'BB00133',
    productName: '半成品24',
    specification: '260*92*51mm',
    suggestedQty: 615,
    planQty: 620,
    unit: '件',
    demandDate: '2026-04-10',
    planExecDate: '2026-04-11',
    planStartDate: '2026-04-03',
    planEndDate: '2026-04-14',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: '生产二车间',
    calcRecord: 'MRP-20260403-003',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202604001',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-04-02',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01033 / 成品AS',
    sourceDocProduct: 'BB00133 / 半成品24',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-04-03 09:00:00',
    updateBy: '李四',
    updateTime: '2026-04-03 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '50',
    planNo: 'XQJH202604004',
    planDate: '2026-04-04',
    productCode: 'BB00134',
    productName: '原材料24',
    specification: '导热硅脂',
    suggestedQty: 630,
    planQty: 635,
    unit: 'kg',
    demandDate: '2026-04-11',
    planExecDate: '2026-04-12',
    planStartDate: '2026-04-04',
    planEndDate: '2026-04-15',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商AB',
    calcRecord: 'MRP-20260404-004',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202604002',
    sourceDocDetail: '行号2',
    sourceDemandDate: '2026-04-03',
    sourceCustomer: '华南客户M',
    bomParentProduct: 'BB01034 / 成品AT',
    sourceDocProduct: 'BB00134 / 原材料24',
    remark: '-',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-04-04 09:20:00',
    updateBy: '王五',
    updateTime: '2026-04-04 10:40:00',
    approver: '王五',
    approvalTime: '2026-04-04 10:00:00',
  },
  {
    key: '51',
    planNo: 'XQJH202604005',
    planDate: '2026-04-05',
    productCode: 'BB00135',
    productName: '半成品25',
    specification: '270*94*52mm',
    suggestedQty: 645,
    planQty: 650,
    unit: '件',
    demandDate: '2026-04-12',
    planExecDate: '2026-04-13',
    planStartDate: '2026-04-05',
    planEndDate: '2026-04-16',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: '生产三车间',
    calcRecord: 'MRP-20260405-005',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202604002',
    sourceDocDetail: '工序90',
    sourceDemandDate: '2026-04-04',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01035 / 成品AU',
    sourceDocProduct: 'BB00135 / 半成品25',
    remark: '-',
    generatedDoc: 'SCDD-202604-001',
    actualIssueQty: 650,
    createBy: '张三',
    createTime: '2026-04-05 08:40:00',
    updateBy: '王五',
    updateTime: '2026-04-05 16:10:00',
    approver: '王五',
    approvalTime: '2026-04-05 09:20:00',
  },
  {
    key: '52',
    planNo: 'XQJH202604006',
    planDate: '2026-04-06',
    productCode: 'BB00136',
    productName: '本周采购-待审批',
    specification: '测试规格A',
    suggestedQty: 80,
    planQty: 80,
    unit: 'kg',
    demandDate: '2026-04-08',
    planExecDate: '2026-04-08',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-10',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商AC',
    calcRecord: 'MRP-20260406-006',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202604003',
    sourceDocDetail: '行号3',
    sourceDemandDate: '2026-04-05',
    sourceCustomer: '测试客户A',
    bomParentProduct: 'BB01036 / 成品AV',
    sourceDocProduct: 'BB00136 / 本周采购-待审批',
    remark: '本周计划示例',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-04-06 09:00:00',
    updateBy: '赵六',
    updateTime: '2026-04-06 09:00:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '53',
    planNo: 'XQJH202604007',
    planDate: '2026-04-06',
    productCode: 'BB00137',
    productName: '本周采购-待下发',
    specification: '测试规格B',
    suggestedQty: 95,
    planQty: 100,
    unit: 'kg',
    demandDate: '2026-04-09',
    planExecDate: '2026-04-09',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-10',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '采购',
    supplier: '供应商AD',
    calcRecord: 'MRP-20260406-007',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202604004',
    sourceDocDetail: '行号4',
    sourceDemandDate: '2026-04-05',
    sourceCustomer: '测试客户B',
    bomParentProduct: 'BB01037 / 成品AW',
    sourceDocProduct: 'BB00137 / 本周采购-待下发',
    remark: '本周计划示例',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '赵六',
    createTime: '2026-04-06 09:20:00',
    updateBy: '王五',
    updateTime: '2026-04-06 10:00:00',
    approver: '王五',
    approvalTime: '2026-04-06 09:45:00',
  },
  {
    key: '54',
    planNo: 'XQJH202604008',
    planDate: '2026-04-06',
    productCode: 'BB00138',
    productName: '本周采购-已下发',
    specification: '测试规格C',
    suggestedQty: 110,
    planQty: 110,
    unit: 'kg',
    demandDate: '2026-04-10',
    planExecDate: '2026-04-10',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-11',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '采购',
    supplier: '供应商AE',
    calcRecord: 'MRP-20260406-008',
    sourceDocType: '销售订单',
    sourceDocNo: 'XSDD202604005',
    sourceDocDetail: '行号5',
    sourceDemandDate: '2026-04-05',
    sourceCustomer: '测试客户C',
    bomParentProduct: 'BB01038 / 成品AX',
    sourceDocProduct: 'BB00138 / 本周采购-已下发',
    remark: '本周计划示例',
    generatedDoc: 'CGDD-202604-002',
    actualIssueQty: 110,
    createBy: '赵六',
    createTime: '2026-04-06 09:40:00',
    updateBy: '王五',
    updateTime: '2026-04-06 11:00:00',
    approver: '王五',
    approvalTime: '2026-04-06 10:10:00',
  },
  {
    key: '55',
    planNo: 'XQJH202604009',
    planDate: '2026-04-06',
    productCode: 'BB00139',
    productName: '本周生产-待审批',
    specification: '测试规格D',
    suggestedQty: 60,
    planQty: 60,
    unit: '件',
    demandDate: '2026-04-08',
    planExecDate: '2026-04-08',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-09',
    planStatus: '待审批',
    approvalStatus: '待审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: 'B 车间',
    calcRecord: 'MRP-20260406-009',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202604002',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-04-05',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01039 / 成品AY',
    sourceDocProduct: 'BB00139 / 本周生产-待审批',
    remark: '本周计划示例',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-04-06 09:10:00',
    updateBy: '李四',
    updateTime: '2026-04-06 09:10:00',
    approver: '',
    approvalTime: '',
  },
  {
    key: '56',
    planNo: 'XQJH202604010',
    planDate: '2026-04-06',
    productCode: 'BB00140',
    productName: '本周生产-待下发',
    specification: '测试规格E',
    suggestedQty: 72,
    planQty: 75,
    unit: '件',
    demandDate: '2026-04-09',
    planExecDate: '2026-04-09',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-10',
    planStatus: '待下发',
    approvalStatus: '已审批',
    releaseStatus: '未下发',
    releaseType: '自制',
    supplier: 'B 车间',
    calcRecord: 'MRP-20260406-010',
    sourceDocType: '生产工单',
    sourceDocNo: 'SCGD202604003',
    sourceDocDetail: '工序10',
    sourceDemandDate: '2026-04-05',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01040 / 成品AZ',
    sourceDocProduct: 'BB00140 / 本周生产-待下发',
    remark: '本周计划示例',
    generatedDoc: '-',
    actualIssueQty: 0,
    createBy: '李四',
    createTime: '2026-04-06 09:30:00',
    updateBy: '王五',
    updateTime: '2026-04-06 10:10:00',
    approver: '王五',
    approvalTime: '2026-04-06 09:55:00',
  },
  {
    key: '57',
    planNo: 'XQJH202604011',
    planDate: '2026-04-06',
    productCode: 'BB00141',
    productName: '本周生产-已下发',
    specification: '测试规格F',
    suggestedQty: 88,
    planQty: 90,
    unit: '件',
    demandDate: '2026-04-10',
    planExecDate: '2026-04-10',
    planStartDate: '2026-04-06',
    planEndDate: '2026-04-11',
    planStatus: '已下发',
    approvalStatus: '已审批',
    releaseStatus: '已下发',
    releaseType: '自制',
    supplier: 'B 车间',
    calcRecord: 'MRP-20260406-011',
    sourceDocType: '主生产计划',
    sourceDocNo: 'MPS202604003',
    sourceDocDetail: '周计划',
    sourceDemandDate: '2026-04-05',
    sourceCustomer: '内部需求',
    bomParentProduct: 'BB01041 / 成品BA',
    sourceDocProduct: 'BB00141 / 本周生产-已下发',
    remark: '本周计划示例',
    generatedDoc: 'SCDD-202604-002',
    actualIssueQty: 90,
    createBy: '张三',
    createTime: '2026-04-06 09:50:00',
    updateBy: '王五',
    updateTime: '2026-04-06 11:20:00',
    approver: '王五',
    approvalTime: '2026-04-06 10:15:00',
  },
]

const normalizedPlanOrderData: PlanOrderItem[] = initialPlanOrderData.map((item, idx) => {
  const lineNo = String(item.sourceDocDetail || '').match(/\d+/)?.[0] || String((idx % 20) + 1)
  const demandDate = dayjs(item.demandDate)
  const releaseDateRaw = item.planReleaseDate || item.planExecDate
  const releaseDate = releaseDateRaw ? dayjs(releaseDateRaw) : null
  const normalizedReleaseDate = releaseDate && !releaseDate.isBefore(demandDate, 'day')
    ? demandDate.subtract(1, 'day').format('YYYY-MM-DD')
    : (releaseDateRaw || '')
  return {
    ...item,
    sourceDocDetail: lineNo,
    planReleaseDate: normalizedReleaseDate,
    planExecDate: normalizedReleaseDate || item.planExecDate,
  }
})

export type PlanType = 'purchase' | 'production' | 'outsource'

interface PlanOrderProps {
  planType: PlanType
}

type PurchaseViewKey = 'pending-release' | 'a-product' | 'x-supplier'

interface PurchaseViewConfig {
  key: PurchaseViewKey
  label: string
  count: number
}

type GroupCountMap = Record<string, number>

const PLAN_TYPE_RELEASE_MAP: Record<PlanType, string> = {
  purchase: '采购',
  production: '自制',
  outsource: '委外',
}

const RELEASE_LABEL_MAP: Record<PlanType, string> = {
  purchase: '下发采购',
  production: '下发生产',
  outsource: '下发委外',
}

const PlanOrder: React.FC<PlanOrderProps> = ({ planType }) => {
  const location = useLocation()
  const releaseType = PLAN_TYPE_RELEASE_MAP[planType]
  const releaseLabel = RELEASE_LABEL_MAP[planType]
  const useAdvancedViews = planType === 'purchase' || planType === 'production'
  const useMergedPlanStatus = planType === 'purchase' || planType === 'production'
  const supplierViewLabel = planType === 'production' ? 'B 车间' : 'X 供应商'
  const isSupplierViewMatch = useCallback(
    (item: PlanOrderItem) =>
      planType === 'production'
        ? item.supplier === 'B 车间' || item.supplier.includes('一车间')
        : item.supplier === 'X 供应商',
    [planType],
  )
  const getRowPlanStatus = useCallback(
    (item: PlanOrderItem): PlanStatus => item.planStatus || getPlanStatusFromLegacy(item),
    [],
  )

  // --- 数据层 ---
  const [planOrderData, setPlanOrderData] = useState<PlanOrderItem[]>(
    () => normalizedPlanOrderData.filter((item) => item.releaseType === releaseType),
  )

  // --- 页面状态 ---
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [planNo, setPlanNo] = useState('')
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('全部')
  const [planStatusFilter, setPlanStatusFilter] = useState<string>('全部')
  const [selectedPurchaseView, setSelectedPurchaseView] = useState<PurchaseViewKey>('pending-release')
  const [selectedPurchaseSubGroup, setSelectedPurchaseSubGroup] = useState<string>(
    () => (useAdvancedViews ? '全部' : '全部'),
  )
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})

  // --- 编辑抽屉 ---
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PlanOrderItem | null>(null)

  // --- 拆分弹窗 ---
  const [splitModalOpen, setSplitModalOpen] = useState(false)
  const [splittingRecord, setSplittingRecord] = useState<PlanOrderItem | null>(null)

  // --- 批量编辑弹窗 ---
  const [batchEditModalOpen, setBatchEditModalOpen] = useState(false)
  const [batchEditForm] = Form.useForm()

  // ========== 筛选逻辑 ==========

  const purchaseViews = useMemo<PurchaseViewConfig[]>(() => {
    const pendingReleaseCount = planOrderData.length
    const aProductCount = planOrderData.filter((item) => item.productName.includes('A')).length
    const xSupplierCount = planOrderData.filter((item) => isSupplierViewMatch(item)).length
    return [
      { key: 'pending-release', label: '本周计划', count: pendingReleaseCount },
      { key: 'a-product', label: 'A 类产品', count: aProductCount },
      { key: 'x-supplier', label: supplierViewLabel, count: xSupplierCount },
    ]
  }, [planOrderData, isSupplierViewMatch, supplierViewLabel])

  const purchaseSubGroupCounts = useMemo<{
    pendingRelease: GroupCountMap
    approved?: GroupCountMap
    aProduct: GroupCountMap
    xSupplier: GroupCountMap
  }>(() => {
    if (useMergedPlanStatus) {
      const statusValues: PlanStatus[] = ['待审批', '待下发', '已下发']
      const getCounts = (items: PlanOrderItem[]): GroupCountMap =>
        statusValues.reduce(
          (acc, status) => ({ ...acc, [status]: items.filter((item) => getRowPlanStatus(item) === status).length }),
          { 待审批: 0, 待下发: 0, 已下发: 0 } as Record<PlanStatus, number>,
        )
      const pendingReleaseData = planOrderData
      const aProductData = planOrderData.filter((item) => item.productName.includes('A'))
      const xSupplierData = planOrderData.filter((item) => isSupplierViewMatch(item))
      return {
        pendingRelease: getCounts(pendingReleaseData),
        aProduct: { 全部: aProductData.length, ...getCounts(aProductData) } as GroupCountMap,
        xSupplier: { 全部: xSupplierData.length, ...getCounts(xSupplierData) } as GroupCountMap,
      }
    }

    const pendingApproval = planOrderData.filter(
      (item) => item.releaseStatus === '未下发' && item.approvalStatus === '待审批',
    ).length
    const approvedForPendingRelease = planOrderData.filter(
      (item) => item.releaseStatus === '未下发' && item.approvalStatus === '已审批',
    ).length
    const approvedNotReleased = planOrderData.filter(
      (item) => item.approvalStatus === '已审批' && item.releaseStatus === '未下发',
    ).length
    const approvedReleased = planOrderData.filter(
      (item) => item.approvalStatus === '已审批' && item.releaseStatus === '已下发',
    ).length
    const aProductAll = planOrderData.filter((item) => item.productName.includes('A')).length
    const aProductNotReleased = planOrderData.filter(
      (item) => item.productName.includes('A') && item.releaseStatus === '未下发',
    ).length
    const aProductReleased = planOrderData.filter(
      (item) => item.productName.includes('A') && item.releaseStatus === '已下发',
    ).length
    const xSupplierAll = planOrderData.filter((item) => isSupplierViewMatch(item)).length
    const xSupplierNotReleased = planOrderData.filter(
      (item) => isSupplierViewMatch(item) && item.releaseStatus === '未下发',
    ).length
    const xSupplierReleased = planOrderData.filter(
      (item) => isSupplierViewMatch(item) && item.releaseStatus === '已下发',
    ).length
    return {
      pendingRelease: { '待审批': pendingApproval, '已审批': approvedForPendingRelease } as GroupCountMap,
      approved: { '未下发': approvedNotReleased, '已下发': approvedReleased } as GroupCountMap,
      aProduct: { '全部': aProductAll, '未下发': aProductNotReleased, '已下发': aProductReleased } as GroupCountMap,
      xSupplier: { '全部': xSupplierAll, '未下发': xSupplierNotReleased, '已下发': xSupplierReleased } as GroupCountMap,
    }
  }, [planOrderData, useMergedPlanStatus, getRowPlanStatus, isSupplierViewMatch])

  const releaseStatusCounts = useMemo(() => {
    const all = planOrderData.length
    const released = planOrderData.filter((item) => item.releaseStatus === '已下发').length
    const notReleased = planOrderData.filter((item) => item.releaseStatus === '未下发').length
    return { 全部: all, 已下发: released, 未下发: notReleased }
  }, [planOrderData])

  const filteredPlanOrderData = useMemo(() => {
    let data = planOrderData

    if (useAdvancedViews) {
      if (selectedPurchaseView === 'pending-release') {
        data = useMergedPlanStatus
          ? data
          : data.filter((item) => item.releaseStatus === '未下发')
        if (useMergedPlanStatus && selectedPurchaseSubGroup !== '全部') {
          data = data.filter((item) => getRowPlanStatus(item) === selectedPurchaseSubGroup)
        } else if (!useMergedPlanStatus && selectedPurchaseSubGroup === '待审批') {
          data = data.filter((item) => item.approvalStatus === '待审批')
        } else if (!useMergedPlanStatus && selectedPurchaseSubGroup === '已审批') {
          data = data.filter((item) => item.approvalStatus === '已审批')
        }
      } else if (selectedPurchaseView === 'a-product') {
        data = data.filter((item) => item.productName.includes('A'))
        if (useMergedPlanStatus && selectedPurchaseSubGroup !== '全部') {
          data = data.filter((item) => getRowPlanStatus(item) === selectedPurchaseSubGroup)
        } else if (selectedPurchaseSubGroup === '未下发') {
          data = data.filter((item) => item.releaseStatus === '未下发')
        } else if (selectedPurchaseSubGroup === '已下发') {
          data = data.filter((item) => item.releaseStatus === '已下发')
        }
      } else if (selectedPurchaseView === 'x-supplier') {
        data = data.filter((item) => isSupplierViewMatch(item))
        if (useMergedPlanStatus && selectedPurchaseSubGroup !== '全部') {
          data = data.filter((item) => getRowPlanStatus(item) === selectedPurchaseSubGroup)
        } else if (selectedPurchaseSubGroup === '未下发') {
          data = data.filter((item) => item.releaseStatus === '未下发')
        } else if (selectedPurchaseSubGroup === '已下发') {
          data = data.filter((item) => item.releaseStatus === '已下发')
        }
      }
    } else {
      data = selectedPurchaseSubGroup === '全部'
        ? planOrderData
        : planOrderData.filter((item) => item.releaseStatus === selectedPurchaseSubGroup)
    }

    if (planNo.trim()) data = data.filter((item) => item.planNo.includes(planNo.trim()))
    if (productCode.trim()) data = data.filter((item) => item.productCode.includes(productCode.trim()))
    if (productName.trim()) data = data.filter((item) => item.productName.includes(productName.trim()))
    if (useMergedPlanStatus) {
      if (planStatusFilter !== '全部') data = data.filter((item) => getRowPlanStatus(item) === planStatusFilter)
    } else if (approvalStatusFilter !== '全部') {
      data = data.filter((item) => item.approvalStatus === approvalStatusFilter)
    }
    return data
  }, [
    planOrderData,
    selectedPurchaseView,
    selectedPurchaseSubGroup,
    planNo,
    productCode,
    productName,
    approvalStatusFilter,
    planStatusFilter,
    useAdvancedViews,
    useMergedPlanStatus,
    getRowPlanStatus,
    isSupplierViewMatch,
  ])

  const transformedPlanOrderData = useMemo(() => {
    return filteredPlanOrderData.map((item) => ({
      ...item,
      planReleaseDate: item.planReleaseDate || item.planExecDate,
      rowKey: item.key,
    }))
  }, [filteredPlanOrderData])

  const highlightDocNo = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('highlightDocNo')?.trim() || ''
  }, [location.search])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return transformedPlanOrderData.slice(start, start + pageSize)
  }, [transformedPlanOrderData, currentPage, pageSize])

  const columnTotals = useMemo(() => {
    const suggestedQty = transformedPlanOrderData.reduce((sum, row) => sum + (Number(row.suggestedQty) || 0), 0)
    const planQty = transformedPlanOrderData.reduce((sum, row) => sum + (Number(row.planQty) || 0), 0)
    return { suggestedQty, planQty }
  }, [transformedPlanOrderData])

  useEffect(() => {
    if (!highlightDocNo) return
    const matchedIndex = transformedPlanOrderData.findIndex(
      (item) => item.planNo === highlightDocNo || item.generatedDoc === highlightDocNo,
    )
    if (matchedIndex < 0) return
    setCurrentPage(Math.floor(matchedIndex / pageSize) + 1)
  }, [highlightDocNo, transformedPlanOrderData, pageSize])

  // ========== 列宽与工具函数 ==========

  const handleMainResize = (key: string) => (_e: unknown, { size }: { size: { width: number } }) => {
    setMainColumnWidths((prev) => ({ ...prev, [key]: size.width }))
  }

  const getColumnWidth = (key: string | undefined, defaultWidth: number, widths: Record<string, number>) => {
    if (!key) return defaultWidth
    return widths[key] || defaultWidth
  }

  const handleNumberFieldClick = useCallback((field: string, record: PlanOrderItem) => {
    const value = record[field]
    if (!value) return
    if (field === 'planNo') message.info(`查看计划：${value}`)
    else if (field === 'sourceDocNo') message.info(`查看来源单据：${value}`)
    else if (field === 'calcRecord') message.info(`查看需求计算编号：${value}`)
  }, [])

  // ========== 单行操作处理函数 ==========

  const handleEdit = useCallback((record: PlanOrderItem) => {
    setEditingRecord(record)
    setEditDrawerOpen(true)
  }, [])

  const handleEditSave = useCallback((updated: PlanOrderItem) => {
    setPlanOrderData((prev) => prev.map((item) => (item.key === updated.key ? updated : item)))
    setEditDrawerOpen(false)
    setEditingRecord(null)
    message.success(`计划 ${updated.planNo} 修改成功`)
  }, [])

  const handleSplit = useCallback((record: PlanOrderItem) => {
    setSplittingRecord(record)
    setSplitModalOpen(true)
  }, [])

  const handleSplitConfirm = useCallback((original: PlanOrderItem, newItems: Partial<PlanOrderItem>[]) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    setPlanOrderData((prev) => {
      const filtered = prev.filter((item) => item.key !== original.key)
      const newRecords = newItems.map((item, idx) => ({
        ...original,
        ...item,
        key: `${original.key}_s${idx + 1}`,
        planNo: `${original.planNo}-${idx + 1}`,
        createTime: now,
        updateTime: now,
      }))
      return [...filtered, ...newRecords]
    })
    setSplitModalOpen(false)
    setSplittingRecord(null)
    message.success(`计划 ${original.planNo} 已拆分为 ${newItems.length} 条`)
  }, [])

  const handleApprove = useCallback((record: PlanOrderItem) => {
    Modal.confirm({
      title: '审批确认',
      icon: <ExclamationCircleOutlined />,
      content: `确认审批计划 ${record.planNo}？`,
      okText: '确认审批',
      cancelText: '取消',
      onOk: () => {
        setPlanOrderData((prev) =>
          prev.map((item) =>
            item.key === record.key
              ? {
                  ...item,
                  planStatus: useMergedPlanStatus ? '待下发' : item.planStatus,
                  approvalStatus: '已审批',
                  releaseStatus: useMergedPlanStatus ? '未下发' : item.releaseStatus,
                  approver: '当前用户',
                  approvalTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : item,
          ),
        )
        message.success(`计划 ${record.planNo} 审批成功`)
      },
    })
  }, [useMergedPlanStatus])

  const handleSendPurchase = useCallback((record: PlanOrderItem) => {
    Modal.confirm({
      title: `${releaseLabel}确认`,
      icon: <ExclamationCircleOutlined />,
      content: `确认将计划 ${record.planNo} ${releaseLabel}？`,
      okText: '确认下发',
      cancelText: '取消',
      onOk: () => {
        setPlanOrderData((prev) =>
          prev.map((item) =>
            item.key === record.key
              ? {
                  ...item,
                  planStatus: useMergedPlanStatus ? '已下发' : item.planStatus,
                  approvalStatus: useMergedPlanStatus ? '已审批' : item.approvalStatus,
                  releaseStatus: '已下发',
                  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : item,
          ),
        )
        message.success(`计划 ${record.planNo} 已${releaseLabel}`)
      },
    })
  }, [releaseLabel, useMergedPlanStatus])

  const handleRevokeApproval = useCallback((record: PlanOrderItem) => {
    const isReleased = useMergedPlanStatus
      ? getRowPlanStatus(record) === '已下发'
      : record.releaseStatus === '已下发'
    if (isReleased) {
      message.warning('已下发计划不支持撤销审批')
      return
    }
    Modal.confirm({
      title: '撤销审批确认',
      icon: <ExclamationCircleOutlined />,
      content: `确认撤销计划 ${record.planNo} 的审批？撤销后需重新审批。`,
      okText: '确认撤销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setPlanOrderData((prev) =>
          prev.map((item) =>
            item.key === record.key
              ? {
                  ...item,
                  planStatus: useMergedPlanStatus ? '待审批' : item.planStatus,
                  approvalStatus: '待审批',
                  releaseStatus: useMergedPlanStatus ? '未下发' : item.releaseStatus,
                  approver: '',
                  approvalTime: '',
                  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : item,
          ),
        )
        message.success(`计划 ${record.planNo} 审批已撤销`)
      },
    })
  }, [getRowPlanStatus, useMergedPlanStatus])

  const handleDelete = useCallback((record: PlanOrderItem) => {
    Modal.confirm({
      title: '删除确认',
      icon: <ExclamationCircleOutlined />,
      content: `确认删除计划 ${record.planNo}？删除后不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setPlanOrderData((prev) => prev.filter((item) => item.key !== record.key))
        setSelectedRowKeys((prev) => prev.filter((k) => k !== record.key))
        message.success(`计划 ${record.planNo} 已删除`)
      },
    })
  }, [])

  // ========== 批量操作 ==========

  const getSelectedRecords = useCallback(() => {
    return planOrderData.filter((item) => selectedRowKeys.includes(item.key))
  }, [planOrderData, selectedRowKeys])

  const canBatchRevokeApproval = useMemo(() => {
    const records = getSelectedRecords()
    const hasReleased = records.some((r) =>
      useMergedPlanStatus ? getRowPlanStatus(r) === '已下发' : r.releaseStatus === '已下发',
    )
    if (hasReleased) return false
    if (useMergedPlanStatus) return records.some((r) => getRowPlanStatus(r) === '待下发')
    return records.some((r) => r.approvalStatus === '已审批' && r.releaseStatus === '未下发')
  }, [getSelectedRecords, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchEdit = useCallback(() => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择要操作的行'); return }
    const records = getSelectedRecords()
    const eligible = records.filter((r) =>
      useMergedPlanStatus
        ? getRowPlanStatus(r) === '待审批'
        : r.approvalStatus === '待审批' && r.releaseStatus === '未下发',
    )
    if (eligible.length === 0) { message.warning('选中的计划中没有可修改的记录（需待审批且未下发）'); return }
    batchEditForm.resetFields()
    setBatchEditModalOpen(true)
  }, [selectedRowKeys, getSelectedRecords, batchEditForm, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchEditSubmit = useCallback(() => {
    batchEditForm.validateFields().then((values) => {
      const hasValue = Object.values(values).some((v) => v !== undefined && v !== null && v !== '')
      if (!hasValue) { message.warning('请至少填写一项修改内容'); return }
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const updates: Partial<PlanOrderItem> = {}
      if (values.demandDate) updates.demandDate = values.demandDate.format('YYYY-MM-DD')
      if (values.planReleaseDate) {
        updates.planReleaseDate = values.planReleaseDate.format('YYYY-MM-DD')
        updates.planExecDate = values.planReleaseDate.format('YYYY-MM-DD')
      }
      if (values.demandDate && values.planReleaseDate && !values.planReleaseDate.isBefore(values.demandDate, 'day')) {
        message.warning('计划下发日期必须早于需求日期')
        return
      }
      if (values.supplier) updates.supplier = values.supplier
      if (values.remark) updates.remark = values.remark
      const eligibleRows = getSelectedRecords().filter((r) =>
        useMergedPlanStatus
          ? getRowPlanStatus(r) === '待审批'
          : r.approvalStatus === '待审批' && r.releaseStatus === '未下发',
      )
      const validRows = eligibleRows.filter((r) => {
        if (!values.planReleaseDate) return true
        const targetDemand = values.demandDate || dayjs(r.demandDate)
        return values.planReleaseDate.isBefore(targetDemand, 'day')
      })
      const eligibleKeys = new Set(validRows.map((r) => r.key))
      const skipped = selectedRowKeys.length - eligibleKeys.size
      setPlanOrderData((prev) =>
        prev.map((item) => (eligibleKeys.has(item.key) ? { ...item, ...updates, updateTime: now } : item)),
      )
      message.success(`已批量修改 ${eligibleKeys.size} 条计划${skipped > 0 ? `，跳过 ${skipped} 条不符合条件的记录` : ''}`)
      setBatchEditModalOpen(false)
      batchEditForm.resetFields()
      setSelectedRowKeys([])
    })
  }, [batchEditForm, selectedRowKeys, getSelectedRecords, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchApprove = useCallback(() => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择要操作的行'); return }
    const records = getSelectedRecords()
    const pending = records.filter((r) =>
      useMergedPlanStatus ? getRowPlanStatus(r) === '待审批' : r.approvalStatus === '待审批',
    )
    if (pending.length === 0) { message.warning('选中的计划均已审批，无需操作'); return }
    const skipped = records.length - pending.length
    Modal.confirm({
      title: '批量审批确认',
      icon: <ExclamationCircleOutlined />,
      content: `将审批 ${pending.length} 条计划${skipped > 0 ? `（跳过 ${skipped} 条已审批）` : ''}，确认？`,
      okText: '确认审批',
      cancelText: '取消',
      onOk: () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const pendingKeys = new Set(pending.map((r) => r.key))
        setPlanOrderData((prev) =>
          prev.map((item) =>
            pendingKeys.has(item.key)
              ? {
                  ...item,
                  planStatus: useMergedPlanStatus ? '待下发' : item.planStatus,
                  approvalStatus: '已审批',
                  releaseStatus: useMergedPlanStatus ? '未下发' : item.releaseStatus,
                  approver: '当前用户',
                  approvalTime: now,
                  updateTime: now,
                }
              : item,
          ),
        )
        message.success(`已批量审批 ${pending.length} 条计划`)
        setSelectedRowKeys([])
      },
    })
  }, [selectedRowKeys, getSelectedRecords, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchRevokeApproval = useCallback(() => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择要操作的行'); return }
    const records = getSelectedRecords()
    const released = records.filter((r) =>
      useMergedPlanStatus ? getRowPlanStatus(r) === '已下发' : r.releaseStatus === '已下发',
    )
    if (released.length > 0) {
      message.warning('已下发计划不支持撤销审批，请取消后重试')
      return
    }
    const eligible = records.filter((r) =>
      useMergedPlanStatus
        ? getRowPlanStatus(r) === '待下发'
        : r.approvalStatus === '已审批' && r.releaseStatus === '未下发',
    )
    if (eligible.length === 0) { message.warning('选中的计划中没有可撤销审批的记录（需已审批且未下发）'); return }
    const skipped = records.length - eligible.length
    Modal.confirm({
      title: '批量撤销审批确认',
      icon: <ExclamationCircleOutlined />,
      content: `将撤销 ${eligible.length} 条计划的审批${skipped > 0 ? `（跳过 ${skipped} 条不符合条件）` : ''}，确认？`,
      okText: '确认撤销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const eligibleKeys = new Set(eligible.map((r) => r.key))
        setPlanOrderData((prev) =>
          prev.map((item) =>
            eligibleKeys.has(item.key)
              ? {
                  ...item,
                  planStatus: useMergedPlanStatus ? '待审批' : item.planStatus,
                  approvalStatus: '待审批',
                  releaseStatus: useMergedPlanStatus ? '未下发' : item.releaseStatus,
                  approver: '',
                  approvalTime: '',
                  updateTime: now,
                }
              : item,
          ),
        )
        message.success(`已批量撤销 ${eligible.length} 条计划的审批`)
        setSelectedRowKeys([])
      },
    })
  }, [selectedRowKeys, getSelectedRecords, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchSendPurchase = useCallback(() => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择要操作的行'); return }
    const records = getSelectedRecords()
    const eligible = records.filter((r) =>
      useMergedPlanStatus
        ? getRowPlanStatus(r) === '待下发'
        : r.approvalStatus === '已审批' && r.releaseStatus === '未下发',
    )
    if (eligible.length === 0) { message.warning(`选中的计划中没有可${releaseLabel}的记录（需已审批且未下发）`); return }
    const skipped = records.length - eligible.length
    Modal.confirm({
      title: `批量${releaseLabel}确认`,
      icon: <ExclamationCircleOutlined />,
      content: `将${releaseLabel} ${eligible.length} 条计划${skipped > 0 ? `（跳过 ${skipped} 条不符合条件）` : ''}，确认？`,
      okText: '确认下发',
      cancelText: '取消',
      onOk: () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const eligibleKeys = new Set(eligible.map((r) => r.key))
        setPlanOrderData((prev) =>
          prev.map((item) =>
            eligibleKeys.has(item.key)
              ? {
                  ...item,
                  planStatus: useMergedPlanStatus ? '已下发' : item.planStatus,
                  approvalStatus: useMergedPlanStatus ? '已审批' : item.approvalStatus,
                  releaseStatus: '已下发',
                  updateTime: now,
                }
              : item,
          ),
        )
        message.success(`已批量${releaseLabel} ${eligible.length} 条计划`)
        setSelectedRowKeys([])
      },
    })
  }, [selectedRowKeys, getSelectedRecords, releaseLabel, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择要操作的行'); return }
    const records = getSelectedRecords()
    const eligible = records.filter((r) =>
      useMergedPlanStatus
        ? getRowPlanStatus(r) === '待审批'
        : r.approvalStatus === '待审批' && r.releaseStatus === '未下发',
    )
    if (eligible.length === 0) { message.warning('选中的计划中没有可删除的记录（需待审批且未下发）'); return }
    const skipped = records.length - eligible.length
    Modal.confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: `将删除 ${eligible.length} 条计划${skipped > 0 ? `（跳过 ${skipped} 条不符合条件）` : ''}，删除后不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const eligibleKeys = new Set(eligible.map((r) => r.key))
        setPlanOrderData((prev) => prev.filter((item) => !eligibleKeys.has(item.key)))
        setSelectedRowKeys([])
        message.success(`已删除 ${eligible.length} 条计划`)
      },
    })
  }, [selectedRowKeys, getSelectedRecords, getRowPlanStatus, useMergedPlanStatus])

  const handleBatchExport = useCallback(() => {
    const selectedKeys = new Set(selectedRowKeys.map(String))
    const exportRows = selectedKeys.size > 0
      ? transformedPlanOrderData.filter((item) => selectedKeys.has(String(item.rowKey)))
      : transformedPlanOrderData

    if (exportRows.length === 0) {
      message.warning('暂无可导出的计划数据')
      return
    }

    if (selectedKeys.size > 0) {
      message.success(`已导出 ${exportRows.length} 条已选计划`)
      return
    }

    message.success(`已导出全部 ${exportRows.length} 条计划`)
  }, [selectedRowKeys, transformedPlanOrderData])

  // ========== 表格列定义 ==========

  const baseMainColumns: ColumnsType<PlanOrderItem> = useMemo(() => {
    return [
      {
        title: '计划编号',
        dataIndex: 'planNo',
        key: 'planNo',
        width: getColumnWidth('planNo', 150, mainColumnWidths),
        fixed: 'left',
        render: (text: string, record: PlanOrderItem) =>
          text ? (
            <span className="plan-order-number-link" onClick={(e) => { e.stopPropagation(); handleNumberFieldClick('planNo', record) }}>
              {text}
            </span>
          ) : null,
      },
      { title: '计划日期', dataIndex: 'planDate', key: 'planDate', width: getColumnWidth('planDate', 110, mainColumnWidths) },
      { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: getColumnWidth('productCode', 100, mainColumnWidths), fixed: 'left' },
      { title: '产品名称', dataIndex: 'productName', key: 'productName', width: getColumnWidth('productName', 150, mainColumnWidths) },
      { title: '产品规格', dataIndex: 'specification', key: 'specification', width: getColumnWidth('specification', 140, mainColumnWidths) },
      { title: '建议数量', dataIndex: 'suggestedQty', key: 'suggestedQty', width: getColumnWidth('suggestedQty', 95, mainColumnWidths), align: 'right' as const },
      { title: '计划数量', dataIndex: 'planQty', key: 'planQty', width: getColumnWidth('planQty', 95, mainColumnWidths), align: 'right' as const },
      { title: '单位', dataIndex: 'unit', key: 'unit', width: getColumnWidth('unit', 56, mainColumnWidths) },
      { title: '需求日期', dataIndex: 'demandDate', key: 'demandDate', width: getColumnWidth('demandDate', 110, mainColumnWidths) },
      { title: '计划下发日期', dataIndex: 'planReleaseDate', key: 'planReleaseDate', width: getColumnWidth('planReleaseDate', 118, mainColumnWidths) },
      ...(useMergedPlanStatus
        ? [{
            title: '计划状态',
            dataIndex: 'planStatus',
            key: 'planStatus',
            width: getColumnWidth('planStatus', 96, mainColumnWidths),
            render: (_text: string, record: PlanOrderItem) => {
              const status = getRowPlanStatus(record)
              const style = getPlanStatusStyle(status)
              return (
                <span style={{ color: style.color, background: style.background, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                  {status}
                </span>
              )
            },
          }]
        : [
            {
              title: '审批状态',
              dataIndex: 'approvalStatus',
              key: 'approvalStatus',
              width: getColumnWidth('approvalStatus', 96, mainColumnWidths),
              render: (text: string) => {
                const style = getApprovalStatusStyle(text)
                return text ? (
                  <span style={{ color: style.color, background: style.background, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{text}</span>
                ) : null
              },
            },
            {
              title: '下发状态',
              dataIndex: 'releaseStatus',
              key: 'releaseStatus',
              width: getColumnWidth('releaseStatus', 96, mainColumnWidths),
              render: (text: string) => {
                const style = getReleaseStatusStyle(text)
                return text ? (
                  <span style={{ color: style.color, background: style.background, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{text}</span>
                ) : null
              },
            },
          ]),
      { title: '默认供应商', dataIndex: 'supplier', key: 'supplier', width: getColumnWidth('supplier', 110, mainColumnWidths) },
      { title: '审批人', dataIndex: 'approver', key: 'approver', width: getColumnWidth('approver', 80, mainColumnWidths) },
      { title: '审批时间', dataIndex: 'approvalTime', key: 'approvalTime', width: getColumnWidth('approvalTime', 172, mainColumnWidths) },
      { title: '备注', dataIndex: 'remark', key: 'remark', width: getColumnWidth('remark', 120, mainColumnWidths) },
      { title: '来源需求日期', dataIndex: 'sourceDemandDate', key: 'sourceDemandDate', width: getColumnWidth('sourceDemandDate', 118, mainColumnWidths) },
      { title: '来源单据类型', dataIndex: 'sourceDocType', key: 'sourceDocType', width: getColumnWidth('sourceDocType', 100, mainColumnWidths) },
      {
        title: '来源单据',
        dataIndex: 'sourceDocNo',
        key: 'sourceDocNo',
        width: getColumnWidth('sourceDocNo', 140, mainColumnWidths),
        render: (text: string, record: PlanOrderItem) =>
          text ? (
            <span className="plan-order-number-link" onClick={(e) => { e.stopPropagation(); handleNumberFieldClick('sourceDocNo', record) }}>
              {text}
            </span>
          ) : null,
      },
      { title: '来源单据行号', dataIndex: 'sourceDocDetail', key: 'sourceDocDetail', width: getColumnWidth('sourceDocDetail', 88, mainColumnWidths) },
      { title: '来源客户', dataIndex: 'sourceCustomer', key: 'sourceCustomer', width: getColumnWidth('sourceCustomer', 110, mainColumnWidths) },
      { title: 'BOM父项产品', dataIndex: 'bomParentProduct', key: 'bomParentProduct', width: getColumnWidth('bomParentProduct', 180, mainColumnWidths), ellipsis: true },
      { title: '来源单据产品', dataIndex: 'sourceDocProduct', key: 'sourceDocProduct', width: getColumnWidth('sourceDocProduct', 180, mainColumnWidths), ellipsis: true },
      { title: '创建人', dataIndex: 'createBy', key: 'createBy', width: getColumnWidth('createBy', 80, mainColumnWidths) },
      { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: getColumnWidth('createTime', 172, mainColumnWidths) },
      { title: '更新人', dataIndex: 'updateBy', key: 'updateBy', width: getColumnWidth('updateBy', 80, mainColumnWidths) },
      { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: getColumnWidth('updateTime', 172, mainColumnWidths) },
      {
        title: '需求计算编号',
        dataIndex: 'calcRecord',
        key: 'calcRecord',
        width: getColumnWidth('calcRecord', 168, mainColumnWidths),
        render: (text: string, record: PlanOrderItem) =>
          text ? (
            <span className="plan-order-number-link" onClick={(e) => { e.stopPropagation(); handleNumberFieldClick('calcRecord', record) }}>
              {text}
            </span>
          ) : null,
      },
      {
        title: '关联下发单据',
        dataIndex: 'generatedDoc',
        key: 'generatedDoc',
        width: getColumnWidth('generatedDoc', 150, mainColumnWidths),
        render: (text: string, record: PlanOrderItem) =>
          text && text !== '-' ? (
            <span className="plan-order-number-link" onClick={(e) => { e.stopPropagation(); handleNumberFieldClick('generatedDoc', record) }}>
              {text}
            </span>
          ) : (text || '-'),
      },
      { title: '实际下发数量', dataIndex: 'actualIssueQty', key: 'actualIssueQty', width: getColumnWidth('actualIssueQty', 118, mainColumnWidths), align: 'right' as const },
      {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right' as const,
        render: (_: unknown, record: PlanOrderItem) => {
          const planStatus = getRowPlanStatus(record)
          const isPending = useMergedPlanStatus ? planStatus === '待审批' : record.approvalStatus === '待审批'
          const isApproved = useMergedPlanStatus ? planStatus === '待下发' : record.approvalStatus === '已审批'
          const isReleased = useMergedPlanStatus ? planStatus === '已下发' : record.releaseStatus === '已下发'
          const canEdit = isPending && !isReleased
          const canSplit = !isReleased
          return (
            <Space size={4} className="row-actions">
              <Button type="link" size="small" disabled={!canEdit} onClick={(e) => { e.stopPropagation(); handleEdit(record) }}>
                修改
              </Button>
              <Button type="link" size="small" disabled={!canSplit} onClick={(e) => { e.stopPropagation(); handleSplit(record) }}>
                拆分
              </Button>
              <Dropdown
                menu={{
                  items: [
                    { key: 'approve', label: '审批', disabled: !isPending },
                    { key: 'sendPurchase', label: releaseLabel, disabled: !isApproved || isReleased },
                    { type: 'divider' },
                    { key: 'revokeApproval', label: '撤销审批', disabled: !isApproved || isReleased },
                    { key: 'delete', label: '删除', danger: true, disabled: !isPending || isReleased },
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation()
                    if (key === 'approve') handleApprove(record)
                    else if (key === 'sendPurchase') handleSendPurchase(record)
                    else if (key === 'revokeApproval') handleRevokeApproval(record)
                    else if (key === 'delete') handleDelete(record)
                  },
                }}
                trigger={['click']}
              >
                <Button type="link" size="small" onClick={(e) => e.stopPropagation()}>
                  操作 <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          )
        },
      },
    ]
  }, [mainColumnWidths, handleNumberFieldClick, handleEdit, handleSplit, handleApprove, handleSendPurchase, handleRevokeApproval, handleDelete, releaseLabel, useMergedPlanStatus, getRowPlanStatus])

  const mainColumns = useMemo(() => {
    return baseMainColumns.map((col) => {
      const colKey = col.key as string
      const defaultWidth = (col.width as number) || 100
      return {
        ...col,
        width: getColumnWidth(colKey, defaultWidth, mainColumnWidths),
        onHeaderCell: () => ({
          width: getColumnWidth(colKey, defaultWidth, mainColumnWidths),
          onResize: handleMainResize(colKey),
        }),
      }
    })
  }, [baseMainColumns, mainColumnWidths])

  const mainTableWidth = useMemo(() => {
    return mainColumns.reduce((sum, col) => sum + (Number(col.width) || 100), 0)
  }, [mainColumns])

  // ========== 搜索 ==========

  const handleRefresh = () => { message.success('查询成功') }

  const handleReset = () => {
    setPlanNo('')
    setProductCode('')
    setProductName('')
    setApprovalStatusFilter('全部')
    setPlanStatusFilter('全部')
    if (useAdvancedViews) {
      setSelectedPurchaseView('pending-release')
      setSelectedPurchaseSubGroup('全部')
    } else {
      setSelectedPurchaseSubGroup('全部')
    }
    setCurrentPage(1)
    message.success('已重置筛选条件')
  }

  const handleFieldSettings = () => { message.info('字段配置') }

  // ========== 渲染 ==========

  return (
    <div className="plan-order">
          <div className="category-filter-bar">
            {useAdvancedViews && (
              <div className="view-tabs">
                <Space size="middle">
                  {purchaseViews.map((view) => (
                    <span
                      key={view.key}
                      className={`view-tab ${selectedPurchaseView === view.key ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPurchaseView(view.key)
                        if (view.key === 'pending-release') setSelectedPurchaseSubGroup('全部')
                        else if (view.key === 'a-product' || view.key === 'x-supplier') setSelectedPurchaseSubGroup('全部')
                        else setSelectedPurchaseSubGroup('')
                        setCurrentPage(1)
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                      <FileTextOutlined style={{ color: selectedPurchaseView === view.key ? '#02b980' : '#666' }} />
                      <span>{view.label}</span>
                    </span>
                  ))}
                </Space>
              </div>
            )}
            <div className="category-tabs">
              <Space size="middle">
                {useAdvancedViews && selectedPurchaseView === 'pending-release'
                  ? (useMergedPlanStatus ? ['全部', '待审批', '待下发', '已下发'] : ['全部', '未下发', '已下发']).map((sub) => (
                    <span
                      key={sub}
                      className={`category-tab ${selectedPurchaseSubGroup === sub ? 'active' : ''}`}
                      onClick={() => { setSelectedPurchaseSubGroup(sub); setCurrentPage(1) }}
                      style={{ cursor: 'pointer' }}
                    >
                      {sub}{' '}
                      {sub === '全部'
                        ? purchaseViews.find((view) => view.key === 'pending-release')?.count ?? 0
                        : purchaseSubGroupCounts.pendingRelease[sub] ?? 0}
                    </span>
                  ))
                  : useAdvancedViews && (selectedPurchaseView === 'a-product' || selectedPurchaseView === 'x-supplier')
                    ? (useMergedPlanStatus ? ['全部', '待审批', '待下发', '已下发'] : ['全部', '未下发', '已下发']).map((sub) => (
                      <span
                        key={sub}
                        className={`category-tab ${selectedPurchaseSubGroup === sub ? 'active' : ''}`}
                        onClick={() => { setSelectedPurchaseSubGroup(sub); setCurrentPage(1) }}
                        style={{ cursor: 'pointer' }}
                      >
                        {sub}{' '}
                        {selectedPurchaseView === 'a-product'
                          ? purchaseSubGroupCounts.aProduct[sub] ?? 0
                          : purchaseSubGroupCounts.xSupplier[sub] ?? 0}
                      </span>
                    ))
                  : (['全部', '已下发', '未下发'] as const).map((status) => (
                    <span
                      key={status}
                      className={`category-tab ${selectedPurchaseSubGroup === status ? 'active' : ''}`}
                      onClick={() => { setSelectedPurchaseSubGroup(status); setCurrentPage(1) }}
                      style={{ cursor: 'pointer' }}
                    >
                      {status} {releaseStatusCounts[status]}
                    </span>
                  ))}
              </Space>
            </div>
          </div>

          <div className="search-filter-bar">
            <div className="search-filter-items">
              <label className="search-filter-item">
                <span className="search-filter-label">计划编号</span>
                <span className="search-filter-input-wrap">
                  <Input value={planNo} onChange={(e) => setPlanNo(e.target.value)} placeholder="请输入" size="small" allowClear style={{ width: '100%' }} />
                </span>
              </label>
              <label className="search-filter-item">
                <span className="search-filter-label">产品编号</span>
                <span className="search-filter-input-wrap">
                  <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="请输入" size="small" allowClear style={{ width: '100%' }} />
                </span>
              </label>
              <label className="search-filter-item">
                <span className="search-filter-label">产品名称</span>
                <span className="search-filter-input-wrap">
                  <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="请输入" size="small" allowClear style={{ width: '100%' }} />
                </span>
              </label>
              <label className="search-filter-item">
                <span className="search-filter-label">{useMergedPlanStatus ? '计划状态' : '审批状态'}</span>
                <span className="search-filter-select-wrap">
                  <Select
                    value={useMergedPlanStatus ? planStatusFilter : approvalStatusFilter}
                    onChange={useMergedPlanStatus ? setPlanStatusFilter : setApprovalStatusFilter}
                    size="small"
                    style={{ width: '100%' }}
                    options={[
                      { value: '全部', label: '全部' },
                      ...(useMergedPlanStatus
                        ? [
                            { value: '待审批', label: '待审批' },
                            { value: '待下发', label: '待下发' },
                            { value: '已下发', label: '已下发' },
                          ]
                        : [
                            { value: '待审批', label: '待审批' },
                            { value: '已审批', label: '已审批' },
                          ]),
                    ]}
                  />
                </span>
              </label>
            </div>
            <span className="search-filter-actions">
              <Button type="primary" icon={<SearchOutlined />} onClick={handleRefresh} size="small">查询</Button>
              <Button type="text" icon={<ReloadOutlined />} onClick={handleReset} title="重置" size="small" />
              <Button type="text" icon={<SettingOutlined />} title="字段配置" size="small" />
            </span>
          </div>

          <div className="table-toolbar">
            <div className="toolbar-buttons">
              {selectedRowKeys.length > 0 ? (
                <>
                  <div className="toolbar-batch-left">
                    <span className="selected-count">已选择 {selectedRowKeys.length} 条计划</span>
                    <Button onClick={handleBatchExport}>导出</Button>
                    <Button icon={<EditOutlined />} onClick={handleBatchEdit}>修改</Button>
                    <Space.Compact className="toolbar-approval-group">
                      <Button onClick={handleBatchApprove}>审批</Button>
                      <Dropdown
                        menu={{
                          items: [{ key: 'revokeApproval', label: '撤销审批', disabled: !canBatchRevokeApproval }],
                          onClick: ({ key }) => {
                            if (key === 'revokeApproval' && canBatchRevokeApproval) handleBatchRevokeApproval()
                          },
                        }}
                        trigger={['click']}
                      >
                        <Button icon={<DownOutlined />} title="更多审批操作" />
                      </Dropdown>
                    </Space.Compact>
                    <Button onClick={handleBatchSendPurchase}>{releaseLabel}</Button>
                    <Button danger onClick={handleBatchDelete}>删除</Button>
                  </div>
                  <Button type="text" className="toolbar-cancel-select" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleBatchExport}>导出</Button>
                  <Button type="text" icon={<SettingOutlined />} onClick={handleFieldSettings}>字段配置</Button>
                  <Button type="text" icon={<SortAscendingOutlined />}>排序</Button>
                  <Button type="text" icon={<ColumnHeightOutlined />}>行高</Button>
                </>
              )}
            </div>
          </div>

          <Card className="main-table-card" ref={mainTableCardRef} id="plan-order-table-card">
            <Table
              columns={mainColumns}
              dataSource={paginatedData}
              rowKey="rowKey"
              rowClassName={(record) =>
                highlightDocNo && (record.planNo === highlightDocNo || record.generatedDoc === highlightDocNo)
                  ? 'plan-order-highlight-row'
                  : ''
              }
              scroll={{ x: mainTableWidth || 1500, y: 'calc(100vh - 340px)' }}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: transformedPlanOrderData.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, size) => { setCurrentPage(page); setPageSize(size || 20) },
                onShowSizeChange: (_current, size) => { setCurrentPage(1); setPageSize(size) },
              }}
              size="small"
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
                onSelectAll: (selected) => {
                  if (selected) {
                    setSelectedRowKeys(paginatedData.map((item) => item.rowKey || '').filter(Boolean))
                  } else {
                    setSelectedRowKeys([])
                  }
                },
              }}
              summary={() => (
                <Table.Summary fixed="bottom">
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} />
                    <Table.Summary.Cell index={1} colSpan={5} align="left">合计</Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">{columnTotals.suggestedQty}</Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">{columnTotals.planQty}</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} colSpan={26} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
              components={{ header: { cell: ResizableTitle } }}
              onRow={() => ({ style: { cursor: 'default' }, onClick: undefined })}
            />
          </Card>

          {/* 编辑抽屉 */}
          <EditDrawer
            open={editDrawerOpen}
            record={editingRecord}
            showSupplier={planType !== 'production'}
            onClose={() => { setEditDrawerOpen(false); setEditingRecord(null) }}
            onSave={handleEditSave}
          />

          {/* 拆分弹窗 */}
          <SplitModal
            open={splitModalOpen}
            record={splittingRecord}
            showSupplier={planType !== 'production'}
            onClose={() => { setSplitModalOpen(false); setSplittingRecord(null) }}
            onSplit={handleSplitConfirm}
          />

          {/* 批量编辑弹窗 */}
          <Modal
            title={`批量修改 - 已选 ${selectedRowKeys.length} 条计划`}
            open={batchEditModalOpen}
            onOk={handleBatchEditSubmit}
            onCancel={() => { setBatchEditModalOpen(false); batchEditForm.resetFields() }}
            okText="保存"
            cancelText="取消"
            width={520}
            destroyOnClose
          >
            <div className="batch-edit-tip">仅填写需要修改的字段，空字段将保持不变。</div>
            <Form form={batchEditForm} layout="vertical" style={{ marginTop: 12 }}>
              <Form.Item label="需求日期" name="demandDate">
                <DatePicker style={{ width: '100%' }} placeholder="留空则不修改" />
              </Form.Item>
              <Form.Item label="计划下发日期" name="planReleaseDate">
                <DatePicker style={{ width: '100%' }} placeholder="留空则不修改" />
              </Form.Item>
              <Form.Item label="默认供应商" name="supplier">
                <Input placeholder="留空则不修改" />
              </Form.Item>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={2} placeholder="留空则不修改" />
              </Form.Item>
            </Form>
          </Modal>
    </div>
  )
}

export default PlanOrder
