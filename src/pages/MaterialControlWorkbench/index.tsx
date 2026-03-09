import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Tag,
  Input,
  InputNumber,
  message,
} from 'antd'
import {
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined,
  CloseOutlined,
  ColumnHeightOutlined,
  SortAscendingOutlined,
  SearchOutlined,
  FileTextOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { MaterialItem, SupplyDemandDetail } from '@/types/supply-demand'
import ResizableTitle from '@/components/common/ResizableTitle'
import './index.css'

const MaterialControlWorkbench: React.FC = () => {
  const navigate = useNavigate()
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [futureDays, setFutureDays] = useState<number>(7)
  const [supplyDemandStatus, setSupplyDemandStatus] = useState('全部')
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [selectedView, setSelectedView] = useState<string>('全部')
  const [tableScrollY, setTableScrollY] = useState<number>(400)
  const [detailTableHeight, setDetailTableHeight] = useState<number>(500)
  const [mainCurrentPage, setMainCurrentPage] = useState<number>(1)
  const [mainPageSize, setMainPageSize] = useState<number>(20)
  const [detailCurrentPage, setDetailCurrentPage] = useState<number>(1)
  const [detailPageSize, setDetailPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  const detailTableCardRef = useRef<HTMLDivElement>(null)
  const resizeStartYRef = useRef<number>(0)
  const resizeStartHeightRef = useRef<number>(500)
  const isResizingRef = useRef<boolean>(false)
  
  // 列宽状态管理
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})
  const [detailColumnWidths, setDetailColumnWidths] = useState<Record<string, number>>({})
  
  // 动态计算表格滚动高度
  useEffect(() => {
    const calculateTableHeight = () => {
      if (mainTableCardRef.current) {
        const cardElement = mainTableCardRef.current
        const cardBody = cardElement.querySelector('.ant-card-body')
        if (cardBody) {
          const bodyHeight = cardBody.clientHeight
          const scrollHeight = bodyHeight - 40 - 32
          setTableScrollY(Math.max(200, scrollHeight))
        }
      }
    }
    
    const timer = setTimeout(() => {
      calculateTableHeight()
    }, 100)
    
    window.addEventListener('resize', calculateTableHeight)
    
    let resizeObserver: ResizeObserver | null = null
    if (mainTableCardRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        calculateTableHeight()
      })
      resizeObserver.observe(mainTableCardRef.current)
    }
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculateTableHeight)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [selectedMaterial, detailTableHeight])

  // 模拟物料数据
  const materialData = useMemo<MaterialItem[]>(() => {
    return [
    {
      key: '1',
      materialCode: 'BB00001',
      materialName: '成品A',
      specification: '100*50*30mm',
      unit: '件',
      safetyStock: 50,
      currentStock: 100,
      shortageQty: 0,
      supplier: '供应商A',
      workshop: '车间1',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 100 },
        { date: '2026-01-25', demand: 50, supply: 0, balance: 50 },
        { date: '2026-01-26', demand: 30, supply: 100, balance: 120 },
        { date: '2026-01-27', demand: 20, supply: 0, balance: 100 },
        { date: '2026-01-28', demand: 40, supply: 50, balance: 110 },
        { date: '2026-01-29', demand: 25, supply: 0, balance: 85 },
        { date: '2026-01-30', demand: 35, supply: 80, balance: 130 },
      ],
    },
    {
      key: '2',
      materialCode: 'BB00002',
      materialName: '成品B',
      specification: '120*60*40mm',
      unit: '件',
      safetyStock: 50,
      currentStock: 80,
      shortageQty: 0,
      supplier: '供应商B',
      workshop: '车间1',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 80 },
        { date: '2026-01-25', demand: 40, supply: 0, balance: 40 },
        { date: '2026-01-26', demand: 20, supply: 60, balance: 80 },
        { date: '2026-01-27', demand: 30, supply: 0, balance: 50 },
        { date: '2026-01-28', demand: 25, supply: 40, balance: 65 },
        { date: '2026-01-29', demand: 35, supply: 0, balance: 30 },
        { date: '2026-01-30', demand: 15, supply: 50, balance: 65 },
      ],
    },
    {
      key: '3',
      materialCode: 'BB00003',
      materialName: '半成品01',
      specification: '80*40*20mm',
      unit: '件',
      safetyStock: 100,
      currentStock: 0,
      shortageQty: 385,
      supplier: '供应商C',
      workshop: '车间2',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 0 },
        { date: '2026-01-25', demand: 385, supply: 0, balance: -385 },
        { date: '2026-01-26', demand: 200, supply: 150, balance: -435 },
        { date: '2026-01-27', demand: 150, supply: 0, balance: -585 },
        { date: '2026-01-28', demand: 100, supply: 300, balance: -385 },
        { date: '2026-01-29', demand: 80, supply: 0, balance: -465 },
        { date: '2026-01-30', demand: 120, supply: 500, balance: -85 },
      ],
    },
    {
      key: '4',
      materialCode: 'BB00004',
      materialName: '半成品02',
      specification: '90*45*25mm',
      unit: '件',
      safetyStock: 100,
      currentStock: 50,
      shortageQty: 0,
      supplier: '供应商D',
      workshop: '车间2',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 50 },
        { date: '2026-01-25', demand: 30, supply: 0, balance: 20 },
        { date: '2026-01-26', demand: 20, supply: 40, balance: 40 },
        { date: '2026-01-27', demand: 25, supply: 0, balance: 15 },
        { date: '2026-01-28', demand: 35, supply: 50, balance: 30 },
        { date: '2026-01-29', demand: 15, supply: 0, balance: 15 },
        { date: '2026-01-30', demand: 20, supply: 60, balance: 55 },
      ],
    },
    {
      key: '5',
      materialCode: 'BB00005',
      materialName: '原材料01',
      specification: 'Q235钢材',
      unit: 'kg',
      safetyStock: 200,
      currentStock: 150,
      shortageQty: 0,
      supplier: '供应商E',
      workshop: '',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 150 },
        { date: '2026-01-25', demand: 80, supply: 0, balance: 70 },
        { date: '2026-01-26', demand: 60, supply: 200, balance: 210 },
        { date: '2026-01-27', demand: 50, supply: 0, balance: 160 },
        { date: '2026-01-28', demand: 70, supply: 150, balance: 240 },
        { date: '2026-01-29', demand: 40, supply: 0, balance: 200 },
        { date: '2026-01-30', demand: 90, supply: 180, balance: 290 },
      ],
    },
    {
      key: '6',
      materialCode: 'BB00006',
      materialName: '成品C',
      specification: '150*80*50mm',
      unit: '件',
      safetyStock: 30,
      currentStock: 45,
      shortageQty: 0,
      supplier: '供应商A',
      workshop: '车间1',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 45 },
        { date: '2026-01-25', demand: 20, supply: 0, balance: 25 },
        { date: '2026-01-26', demand: 15, supply: 30, balance: 40 },
        { date: '2026-01-27', demand: 10, supply: 0, balance: 30 },
        { date: '2026-01-28', demand: 25, supply: 20, balance: 25 },
        { date: '2026-01-29', demand: 12, supply: 0, balance: 13 },
        { date: '2026-01-30', demand: 18, supply: 35, balance: 30 },
      ],
    },
    {
      key: '7',
      materialCode: 'BB00007',
      materialName: '半成品03',
      specification: '70*35*18mm',
      unit: '件',
      safetyStock: 80,
      currentStock: 120,
      shortageQty: 0,
      supplier: '供应商C',
      workshop: '车间2',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 120 },
        { date: '2026-01-25', demand: 50, supply: 0, balance: 70 },
        { date: '2026-01-26', demand: 30, supply: 80, balance: 120 },
        { date: '2026-01-27', demand: 40, supply: 0, balance: 80 },
        { date: '2026-01-28', demand: 35, supply: 60, balance: 105 },
        { date: '2026-01-29', demand: 25, supply: 0, balance: 80 },
        { date: '2026-01-30', demand: 45, supply: 70, balance: 105 },
      ],
    },
    {
      key: '8',
      materialCode: 'BB00008',
      materialName: '原材料02',
      specification: '304不锈钢',
      unit: 'kg',
      safetyStock: 150,
      currentStock: 200,
      shortageQty: 0,
      supplier: '供应商F',
      workshop: '',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 200 },
        { date: '2026-01-25', demand: 60, supply: 0, balance: 140 },
        { date: '2026-01-26', demand: 40, supply: 100, balance: 200 },
        { date: '2026-01-27', demand: 50, supply: 0, balance: 150 },
        { date: '2026-01-28', demand: 70, supply: 120, balance: 200 },
        { date: '2026-01-29', demand: 30, supply: 0, balance: 170 },
        { date: '2026-01-30', demand: 80, supply: 150, balance: 240 },
      ],
    },
    {
      key: '9',
      materialCode: 'BB00009',
      materialName: '成品D',
      specification: '200*100*60mm',
      unit: '件',
      safetyStock: 20,
      currentStock: 15,
      shortageQty: 5,
      supplier: '供应商B',
      workshop: '车间1',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 15 },
        { date: '2026-01-25', demand: 10, supply: 0, balance: 5 },
        { date: '2026-01-26', demand: 8, supply: 15, balance: 12 },
        { date: '2026-01-27', demand: 12, supply: 0, balance: 0 },
        { date: '2026-01-28', demand: 15, supply: 20, balance: 5 },
        { date: '2026-01-29', demand: 6, supply: 0, balance: -1 },
        { date: '2026-01-30', demand: 10, supply: 25, balance: 14 },
      ],
    },
    {
      key: '10',
      materialCode: 'BB00010',
      materialName: '半成品04',
      specification: '110*55*30mm',
      unit: '件',
      safetyStock: 60,
      currentStock: 30,
      shortageQty: 30,
      supplier: '供应商D',
      workshop: '车间2',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 30 },
        { date: '2026-01-25', demand: 40, supply: 0, balance: -10 },
        { date: '2026-01-26', demand: 25, supply: 30, balance: -5 },
        { date: '2026-01-27', demand: 30, supply: 0, balance: -35 },
        { date: '2026-01-28', demand: 20, supply: 50, balance: -5 },
        { date: '2026-01-29', demand: 35, supply: 0, balance: -40 },
        { date: '2026-01-30', demand: 15, supply: 60, balance: 5 },
      ],
    },
    {
      key: '11',
      materialCode: 'BB00011',
      materialName: '原材料03',
      specification: '6061铝合金',
      unit: 'kg',
      safetyStock: 100,
      currentStock: 180,
      shortageQty: 0,
      supplier: '供应商G',
      workshop: '',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 180 },
        { date: '2026-01-25', demand: 50, supply: 0, balance: 130 },
        { date: '2026-01-26', demand: 40, supply: 80, balance: 170 },
        { date: '2026-01-27', demand: 60, supply: 0, balance: 110 },
        { date: '2026-01-28', demand: 45, supply: 100, balance: 165 },
        { date: '2026-01-29', demand: 35, supply: 0, balance: 130 },
        { date: '2026-01-30', demand: 55, supply: 120, balance: 195 },
      ],
    },
    {
      key: '12',
      materialCode: 'BB00012',
      materialName: '成品E',
      specification: '180*90*55mm',
      unit: '件',
      safetyStock: 40,
      currentStock: 60,
      shortageQty: 0,
      supplier: '供应商A',
      workshop: '车间1',
      expanded: false,
      timeData: [
        { date: '期初', demand: 0, supply: 0, balance: 60 },
        { date: '2026-01-25', demand: 25, supply: 0, balance: 35 },
        { date: '2026-01-26', demand: 20, supply: 40, balance: 55 },
        { date: '2026-01-27', demand: 15, supply: 0, balance: 40 },
        { date: '2026-01-28', demand: 30, supply: 25, balance: 35 },
        { date: '2026-01-29', demand: 18, supply: 0, balance: 17 },
        { date: '2026-01-30', demand: 22, supply: 45, balance: 40 },
      ],
      },
    ]
  }, [])

  // 将物料数据转换为多行格式（需求、供给、结存分别一行）
  const transformedMaterialData = useMemo(() => materialData.flatMap((material) => {
    if (!material.timeData || material.timeData.length === 0) {
      const today = dayjs()
      const emptyDateValues: Record<string, number> = {}
      for (let i = 0; i < futureDays; i++) {
        const date = today.add(i, 'day')
        const dateKey = date.format('YYYY-MM-DD')
        emptyDateValues[`${dateKey}_demand`] = 0
        emptyDateValues[`${dateKey}_supply`] = 0
        emptyDateValues[`${dateKey}_balance`] = 0
      }
      return [{
        ...material,
        rowType: '需求' as const,
        rowKey: `${material.key}-demand`,
        initialValue: 0,
        ...emptyDateValues,
        endValue: 0,
        totalValue: 0,
      }, {
        ...material,
        rowType: '供给' as const,
        rowKey: `${material.key}-supply`,
        initialValue: 0,
        ...emptyDateValues,
        endValue: 0,
        totalValue: 0,
      }, {
        ...material,
        rowType: '结存' as const,
        rowKey: `${material.key}-balance`,
        initialValue: 0,
        ...emptyDateValues,
        endValue: 0,
        totalValue: 0,
      }]
    }

    const initialData = material.timeData.find((d) => d.date === '期初') || material.timeData[0]
    const totalDemand = material.timeData.reduce((sum, item) => sum + (item.demand || 0), 0)
    const totalSupply = material.timeData.reduce((sum, item) => sum + (item.supply || 0), 0)
    const lastBalance = material.timeData[material.timeData.length - 1]?.balance || 0
    const endData = material.timeData[material.timeData.length - 1] || initialData

    // 生成日期数据对象（根据查询天数动态生成）
    const dateValues: Record<string, number> = {}
    const today = dayjs()
    for (let i = 0; i < futureDays; i++) {
      const date = today.add(i, 'day')
      const dateKey = date.format('YYYY-MM-DD')
      const dateItem = material.timeData.find((d) => d.date === dateKey)
      if (dateItem) {
        dateValues[`${dateKey}_demand`] = dateItem.demand || 0
        dateValues[`${dateKey}_supply`] = dateItem.supply || 0
        dateValues[`${dateKey}_balance`] = dateItem.balance || 0
      } else {
        dateValues[`${dateKey}_demand`] = 0
        dateValues[`${dateKey}_supply`] = 0
        dateValues[`${dateKey}_balance`] = 0
      }
    }

    return [
      {
        ...material,
        rowType: '需求' as const,
        rowKey: `${material.key}-demand`,
        initialValue: initialData?.demand || 0,
        ...dateValues,
        endValue: endData?.demand || 0,
        totalValue: totalDemand,
      },
      {
        ...material,
        rowType: '供给' as const,
        rowKey: `${material.key}-supply`,
        initialValue: initialData?.supply || 0,
        ...dateValues,
        endValue: endData?.supply || 0,
        totalValue: totalSupply,
      },
      {
        ...material,
        rowType: '结存' as const,
        rowKey: `${material.key}-balance`,
        initialValue: initialData?.balance || 0,
        ...dateValues,
        endValue: endData?.balance || 0,
        totalValue: lastBalance,
      },
    ]
  }), [materialData, futureDays])

  // 根据选中的物料获取对应的供需明细数据
  const getDetailDataByMaterial = (materialCode: string): SupplyDemandDetail[] => {
    const detailDataMap: Record<string, SupplyDemandDetail[]> = {
      'BB00001': [
        {
          key: '1',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-25',
          docNo: 'SCRW-20260125-00001',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 50,
          executedQty: 0,
          unexecutedQty: 50,
          exception: '',
        },
        {
          key: '2',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-27',
          docNo: 'SCRW-20260127-00002',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 20,
          executedQty: 0,
          unexecutedQty: 20,
          exception: '',
        },
        {
          key: '3',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-26',
          docNo: 'CGDD-20260126-00001',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 100,
          executedQty: 0,
          unexecutedQty: 100,
          exception: '',
        },
        {
          key: '4',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-28',
          docNo: 'CGDD-20260128-00001',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 50,
          executedQty: 0,
          unexecutedQty: 50,
          exception: '',
        },
        {
          key: '5',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-30',
          docNo: 'CGDD-20260130-00001',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 80,
          executedQty: 0,
          unexecutedQty: 80,
          exception: '',
        },
      ],
      'BB00002': [
        {
          key: '6',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-25',
          docNo: 'SCRW-20260125-00003',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 40,
          executedQty: 0,
          unexecutedQty: 40,
          exception: '',
        },
        {
          key: '7',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-27',
          docNo: 'SCRW-20260127-00001',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 30,
          executedQty: 0,
          unexecutedQty: 30,
          exception: '',
        },
        {
          key: '8',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-26',
          docNo: 'CGDD-20260126-00002',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 60,
          executedQty: 0,
          unexecutedQty: 60,
          exception: '',
        },
        {
          key: '9',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-28',
          docNo: 'CGDD-20260128-00002',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 40,
          executedQty: 0,
          unexecutedQty: 40,
          exception: '',
        },
      ],
      'BB00003': [
        {
          key: '10',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-25',
          docNo: 'SCRW-20260125-00004',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 385,
          executedQty: 0,
          unexecutedQty: 385,
          exception: '',
        },
        {
          key: '11',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-26',
          docNo: 'SCRW-20260126-00001',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 200,
          executedQty: 0,
          unexecutedQty: 200,
          exception: '',
        },
        {
          key: '12',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-27',
          docNo: 'SCRW-20260127-00003',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 150,
          executedQty: 0,
          unexecutedQty: 150,
          exception: '',
        },
        {
          key: '13',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-26',
          docNo: 'CGDD-20260126-00003',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 150,
          executedQty: 0,
          unexecutedQty: 150,
          exception: '',
        },
        {
          key: '14',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-28',
          docNo: 'CGDD-20260128-00003',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 300,
          executedQty: 0,
          unexecutedQty: 300,
          exception: '',
        },
        {
          key: '15',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-30',
          docNo: 'CGDD-20260130-00002',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 500,
          executedQty: 0,
          unexecutedQty: 500,
          exception: '',
        },
      ],
      'BB00004': [
        {
          key: '16',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-25',
          docNo: 'SCRW-20260125-00005',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 30,
          executedQty: 0,
          unexecutedQty: 30,
          exception: '',
        },
        {
          key: '17',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-26',
          docNo: 'CGDD-20260126-00004',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 40,
          executedQty: 0,
          unexecutedQty: 40,
          exception: '',
        },
        {
          key: '18',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-28',
          docNo: 'CGDD-20260128-00004',
          docStatus: '已审核',
          lineNo: 1,
          unit: '件',
          qty: 50,
          executedQty: 0,
          unexecutedQty: 50,
          exception: '',
        },
      ],
      'BB00005': [
        {
          key: '19',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-25',
          docNo: 'SCRW-20260125-00006',
          docStatus: '已审核',
          lineNo: 1,
          unit: 'kg',
          qty: 80,
          executedQty: 0,
          unexecutedQty: 80,
          exception: '',
        },
        {
          key: '20',
          type: '需求',
          docType: '生产工单',
          docDate: '2026-01-27',
          docNo: 'SCRW-20260127-00004',
          docStatus: '已审核',
          lineNo: 1,
          unit: 'kg',
          qty: 50,
          executedQty: 0,
          unexecutedQty: 50,
          exception: '',
        },
        {
          key: '21',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-26',
          docNo: 'CGDD-20260126-00005',
          docStatus: '已审核',
          lineNo: 1,
          unit: 'kg',
          qty: 200,
          executedQty: 0,
          unexecutedQty: 200,
          exception: '',
        },
        {
          key: '22',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-28',
          docNo: 'CGDD-20260128-00005',
          docStatus: '已审核',
          lineNo: 1,
          unit: 'kg',
          qty: 150,
          executedQty: 0,
          unexecutedQty: 150,
          exception: '',
        },
        {
          key: '23',
          type: '供给',
          docType: '采购订单',
          docDate: '2026-01-30',
          docNo: 'CGDD-20260130-00003',
          docStatus: '已审核',
          lineNo: 1,
          unit: 'kg',
          qty: 180,
          executedQty: 0,
          unexecutedQty: 180,
          exception: '',
        },
      ],
    }
    
    return detailDataMap[materialCode] || [
      {
        key: 'default-1',
        type: '需求',
        docType: '生产工单',
        docDate: '2026-01-25',
        docNo: 'SCRW-20260125-00099',
        docStatus: '已审核',
        lineNo: 1,
        unit: '件',
        qty: 0,
        executedQty: 0,
        unexecutedQty: 0,
        exception: '',
      },
    ]
  }

  // 根据选中的物料获取明细数据
  const detailData = useMemo(() => {
    if (!selectedMaterial) return []
    return getDetailDataByMaterial(selectedMaterial)
  }, [selectedMaterial])

  // 明细分页数据
  const paginatedDetailData = useMemo(() => {
    const start = (detailCurrentPage - 1) * detailPageSize
    const end = start + detailPageSize
    return detailData.slice(start, end)
  }, [detailData, detailCurrentPage, detailPageSize])

  // 处理主表格列宽变化
  const handleMainResize = (key: string) => (_e: unknown, { size }: { size: { width: number } }) => {
    setMainColumnWidths((prev) => ({
      ...prev,
      [key]: size.width,
    }))
  }

  // 处理明细表格列宽变化
  const handleDetailResize = (key: string) => (_e: unknown, { size }: { size: { width: number } }) => {
    setDetailColumnWidths((prev) => ({
      ...prev,
      [key]: size.width,
    }))
  }

  // 获取列宽（优先使用调整后的宽度）
  const getColumnWidth = (key: string | undefined, defaultWidth: number, widths: Record<string, number>) => {
    if (!key) return defaultWidth
    return widths[key] || defaultWidth
  }

  // 基础列定义（根据查询天数动态生成日期列）
  const baseMainColumns: ColumnsType<MaterialItem> = useMemo(() => {
    const today = dayjs()
    const dateColumns = Array.from({ length: futureDays }, (_, i) => {
      const date = today.add(i, 'day')
      const dateKey = date.format('YYYY-MM-DD')
      return {
        title: dateKey,
        key: dateKey,
        align: 'right' as const,
        width: getColumnWidth(dateKey, 100, mainColumnWidths),
        render: (_text: any, record: MaterialItem) => {
          const fieldKey = record.rowType === '需求' 
            ? `${dateKey}_demand` 
            : record.rowType === '供给' 
            ? `${dateKey}_supply` 
            : `${dateKey}_balance`
          const value = record[fieldKey] ?? 0
          const isNegative = record.rowType === '结存' && value < 0
          return <span style={{ color: isNegative ? '#ff4d4f' : '#333' }}>{value}</span>
        },
      }
    })

    return [
      {
        title: '产品编号',
        dataIndex: 'materialCode',
        key: 'materialCode',
        width: getColumnWidth('materialCode', 120, mainColumnWidths),
        fixed: 'left',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '产品名称',
        dataIndex: 'materialName',
        key: 'materialName',
        width: getColumnWidth('materialName', 150, mainColumnWidths),
        fixed: 'left',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '产品规格',
        dataIndex: 'specification',
        key: 'specification',
        width: getColumnWidth('specification', 120, mainColumnWidths),
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: getColumnWidth('unit', 100, mainColumnWidths),
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '安全库存',
        dataIndex: 'safetyStock',
        key: 'safetyStock',
        width: getColumnWidth('safetyStock', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '即时库存',
        dataIndex: 'currentStock',
        key: 'currentStock',
        width: getColumnWidth('currentStock', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '缺料数量',
        dataIndex: 'shortageQty',
        key: 'shortageQty',
        width: getColumnWidth('shortageQty', 100, mainColumnWidths),
        align: 'right',
        render: (text) => (
          <span style={{ color: text > 0 ? '#ff4d4f' : '#333' }}>{text}</span>
        ),
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '默认供应商',
        dataIndex: 'supplier',
        key: 'supplier',
        width: getColumnWidth('supplier', 120, mainColumnWidths),
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return {
            rowSpan: isFirstRow ? rowCount : 0,
          }
        },
      },
      {
        title: '类型',
        key: 'rowType',
        width: getColumnWidth('rowType', 80, mainColumnWidths),
        align: 'center',
        render: (_text, record) => {
          const color = record.rowType === '需求' ? '#fa8c16' : record.rowType === '供给' ? '#02b980' : '#333'
          return <span style={{ fontWeight: 600, color }}>{record.rowType || ''}</span>
        },
      },
      {
        title: '期初',
        key: 'initial',
        align: 'right',
        width: getColumnWidth('initial', 100, mainColumnWidths),
        render: (_text, record) => {
          if (!record.initialValue && record.initialValue !== 0) return '-'
          const value = record.initialValue
          const isNegative = record.rowType === '结存' && value < 0
          return <span style={{ color: isNegative ? '#ff4d4f' : '#333' }}>{value}</span>
        },
      },
      // 动态生成日期列
      ...dateColumns,
      {
        title: '期内汇总',
        key: 'end',
        align: 'right',
        width: getColumnWidth('end', 100, mainColumnWidths),
        render: (_text, record) => {
          if (!record.endValue && record.endValue !== 0) return '-'
          const value = record.endValue
          const isNegative = record.rowType === '结存' && value < 0
          return <span style={{ color: isNegative ? '#ff4d4f' : '#333' }}>{value}</span>
        },
      },
      {
        title: '汇总',
        key: 'total',
        align: 'right',
        width: getColumnWidth('total', 100, mainColumnWidths),
        render: (_text, record) => {
          if (!record.totalValue && record.totalValue !== 0) return '-'
          const value = record.totalValue
          const isNegative = record.rowType === '结存' && value < 0
          return <span style={{ color: isNegative ? '#ff4d4f' : '#333' }}>{value}</span>
        },
      },
    ]
  }, [futureDays, mainColumnWidths, transformedMaterialData])

  // 使用 useMemo 生成带动态宽度的主表格列
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

  // 主表格总宽度，避免拖拽单列时影响其它列
  const mainTableWidth = useMemo(() => {
    return mainColumns.reduce((sum, col) => {
      const w = Number(col.width) || 100
      return sum + w
    }, 0)
  }, [mainColumns])

  // 主表分页：按“产品(物料)”数量分页，而不是按实际行数（需求/供给/结存 三行）
  const pagedMaterialCodes = useMemo(() => {
    const seen = new Set<string>()
    const codes: string[] = []
    for (const row of transformedMaterialData) {
      if (!seen.has(row.materialCode)) {
        seen.add(row.materialCode)
        codes.push(row.materialCode)
      }
    }

    const start = (mainCurrentPage - 1) * mainPageSize
    const end = start + mainPageSize
    return {
      total: codes.length,
      pageCodes: codes.slice(start, end),
    }
  }, [transformedMaterialData, mainCurrentPage, mainPageSize])

  const paginatedMainData = useMemo(() => {
    const pageSet = new Set(pagedMaterialCodes.pageCodes)
    return transformedMaterialData.filter((row) => pageSet.has(row.materialCode))
  }, [transformedMaterialData, pagedMaterialCodes.pageCodes])

  // 基础明细列定义
  const baseDetailColumns = useMemo<ColumnsType<SupplyDemandDetail>>(() => {
    return [
    {
      title: '单据日期',
      dataIndex: 'docDate',
      key: 'docDate',
      width: getColumnWidth('docDate', 120, detailColumnWidths),
    },
    {
      title: '供需类型',
      dataIndex: 'type',
      key: 'type',
      width: getColumnWidth('type', 100, detailColumnWidths),
      render: (text) => (
        <Tag color={text === '需求' ? 'orange' : 'green'}>{text}</Tag>
      ),
    },
    {
      title: '单据类型',
      dataIndex: 'docType',
      key: 'docType',
      width: getColumnWidth('docType', 120, detailColumnWidths),
    },
    {
      title: '供需日期',
      dataIndex: 'docDate',
      key: 'docDate',
      width: getColumnWidth('docDate', 120, detailColumnWidths),
    },
    {
      title: '单据编号',
      dataIndex: 'docNo',
      key: 'docNo',
      width: getColumnWidth('docNo', 180, detailColumnWidths),
      render: (text: string, record: SupplyDemandDetail) => (
        <Button
          type="link"
          onClick={() => {
            if (record.docType === '生产工单') {
              navigate(`/production/work-order/${text}`)
            } else {
              message.info(`跳转到 ${record.docType} 详情页: ${text}`)
            }
          }}
          style={{ 
            padding: 0, 
            height: 'auto',
            color: '#1890ff',
            textDecoration: 'none',
          }}
          className="doc-no-link"
        >
          {text}
        </Button>
      ),
    },
    {
      title: '单据状态',
      dataIndex: 'docStatus',
      key: 'docStatus',
      width: getColumnWidth('docStatus', 100, detailColumnWidths),
      render: (text) => (
        <Tag color={text === '已审核' ? 'success' : 'default'}>{text}</Tag>
      ),
    },
    {
      title: '单据行号',
      dataIndex: 'lineNo',
      key: 'lineNo',
      width: getColumnWidth('lineNo', 100, detailColumnWidths),
      align: 'right',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: getColumnWidth('unit', 100, detailColumnWidths),
    },
    {
      title: '单据数量',
      dataIndex: 'qty',
      key: 'qty',
      width: getColumnWidth('qty', 100, detailColumnWidths),
      align: 'right',
    },
    {
      title: '已执行数量',
      dataIndex: 'executedQty',
      key: 'executedQty',
      width: getColumnWidth('executedQty', 140, detailColumnWidths),
      align: 'right',
    },
    {
      title: '未执行数量',
      dataIndex: 'unexecutedQty',
      key: 'unexecutedQty',
      width: getColumnWidth('unexecutedQty', 140, detailColumnWidths),
      align: 'right',
      render: (text) => (
        <span style={{ color: text > 0 ? '#ff4d4f' : '#333' }}>{text}</span>
      ),
    },
    ]
  }, [detailColumnWidths, navigate])

  // 使用 useMemo 生成带动态宽度的明细表格列
  const detailColumns = useMemo(() => {
    return baseDetailColumns.map((col) => {
      const colKey = col.key as string
      const defaultWidth = (col.width as number) || 100
      return {
        ...col,
        width: getColumnWidth(colKey, defaultWidth, detailColumnWidths),
        onHeaderCell: () => ({
          width: getColumnWidth(colKey, defaultWidth, detailColumnWidths),
          onResize: handleDetailResize(colKey),
        }),
      }
    })
  }, [baseDetailColumns, detailColumnWidths])

  // 明细表格总宽度
  const detailTableWidth = useMemo(() => {
    return detailColumns.reduce((sum, col) => {
      const w = Number(col.width) || 100
      return sum + w
    }, 0)
  }, [detailColumns])

  const handleRefresh = () => {
    message.success('刷新成功')
  }

  const handleShortageRelease = () => {
    message.info('缺料下发功能')
  }

  const handleSupplyDemandSettings = () => {
    message.info('供需设置功能')
  }

  const handleSupplyDemandConfig = () => {
    message.info('供需设置配置')
  }

  const handleRowClick = (record: MaterialItem) => {
    setSelectedMaterial(record.materialCode)
  }

  // 计算选中的物料数量
  const selectedMaterialCount = useMemo(() => {
    if (selectedRowKeys.length === 0) return 0
    const selectedMaterialCodes = new Set(
      transformedMaterialData
        .filter(item => selectedRowKeys.includes(item.rowKey || ''))
        .map(item => item.materialCode)
    )
    return selectedMaterialCodes.size
  }, [selectedRowKeys, transformedMaterialData])

  // 批量操作处理
  const handleBatchOperation = useCallback((operation: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的行')
      return
    }
    const selectedMaterials = new Set(
      transformedMaterialData
        .filter(item => selectedRowKeys.includes(item.rowKey || ''))
        .map(item => item.materialCode)
    )
    message.info(`${operation}，已选择 ${selectedMaterials.size} 个物料`)
    // 这里可以添加实际的批量操作逻辑
  }, [selectedRowKeys, transformedMaterialData])

  // 处理明细表格高度拖拽
  const handleDetailResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return
    
    const deltaY = resizeStartYRef.current - e.clientY
    const newHeight = resizeStartHeightRef.current + deltaY
    const clampedHeight = Math.max(200, Math.min(800, newHeight))
    setDetailTableHeight(clampedHeight)
  }, [])

  const handleDetailResizeEnd = useCallback(() => {
    isResizingRef.current = false
    document.removeEventListener('mousemove', handleDetailResizeMove)
    document.removeEventListener('mouseup', handleDetailResizeEnd)
  }, [handleDetailResizeMove])

  const handleDetailResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizingRef.current = true
    resizeStartYRef.current = e.clientY
    resizeStartHeightRef.current = detailTableHeight
    document.addEventListener('mousemove', handleDetailResizeMove)
    document.addEventListener('mouseup', handleDetailResizeEnd)
  }, [detailTableHeight, handleDetailResizeMove, handleDetailResizeEnd])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDetailResizeMove)
      document.removeEventListener('mouseup', handleDetailResizeEnd)
    }
  }, [handleDetailResizeMove, handleDetailResizeEnd])

  return (
    <div className="material-control-workbench">
      {/* 产品分类导航和筛选 */}
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            <span 
              className={`view-tab ${selectedView === '全部' ? 'active' : ''}`}
              onClick={() => setSelectedView('全部')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <FileTextOutlined style={{ color: selectedView === '全部' ? '#02b980' : '#666' }} />
              <span>全部</span>
            </span>
            <Button type="text" size="small" style={{ padding: '2px 8px' }}>
              <PlusOutlined />
            </Button>
          </Space>
        </div>
        <div className="category-tabs">
          <Space size="middle">
            <span className="category-tab active">全部</span>
            <span className="category-tab">自制 6</span>
            <span className="category-tab">外购 4</span>
            <span className="category-tab">委外 0</span>
          </Space>
        </div>
      </div>

      {/* 搜索和筛选输入栏 */}
      <div className="search-filter-bar">
        <div className="search-filter-items">
          <span className="search-filter-item">
            <strong>查询天数</strong>
            <InputNumber
              value={futureDays}
              onChange={(value) => value !== null && setFutureDays(value)}
              min={1}
              max={60}
              size="small"
              style={{ width: 100 }}
            />
          </span>
          <span className="search-filter-item">
            <strong>供需情况</strong>
            <Select
              value={supplyDemandStatus}
              onChange={setSupplyDemandStatus}
              size="small"
              style={{ width: 120 }}
            >
              <Select.Option value="全部">全部</Select.Option>
              <Select.Option value="缺料">缺料</Select.Option>
              <Select.Option value="充足">充足</Select.Option>
            </Select>
          </span>
          <span className="search-filter-item">
            <strong>产品</strong>
            <Select
              placeholder="请选择"
              size="small"
              style={{ width: 140 }}
              allowClear
            >
              <Select.Option value="all">全部</Select.Option>
            </Select>
          </span>
          <span className="search-filter-item">
            <strong>产品编号</strong>
            <Input
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="请输入产品编号"
              size="small"
              style={{ width: 140 }}
            />
          </span>
          <span className="search-filter-item">
            <strong>产品名称</strong>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="请输入产品名称"
              size="small"
              style={{ width: 140 }}
            />
          </span>
        </div>
        <span className="search-filter-actions">
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleRefresh}
            size="small"
            className="query-button"
          >
            查询
          </Button>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            title="重置"
            size="small"
          />
          <Button
            type="text"
            icon={<SettingOutlined />}
            title="字段配置"
            size="small"
          />
        </span>
      </div>

      {/* 数据表格操作工具栏 */}
      <div className="table-toolbar">
        <div className="toolbar-buttons">
          {selectedRowKeys.length > 0 ? (
            <>
              <span className="selected-count">
                已选择 {selectedMaterialCount} 个物料
              </span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleBatchOperation('批量缺料下发')}
              >
                批量缺料下发
              </Button>
              <Button
                onClick={() => setSelectedRowKeys([])}
              >
                取消选择
              </Button>
            </>
          ) : (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleShortageRelease}
              >
                缺料下发
              </Button>
              <span className="toolbar-separator" />
              <Button type="text" icon={<ToolOutlined />} onClick={handleSupplyDemandConfig}>
                供需设置
              </Button>
              <Button type="text" icon={<SettingOutlined />} onClick={handleSupplyDemandSettings}>
                字段配置
              </Button>
              <Button type="text" icon={<SortAscendingOutlined />}>
                排序
              </Button>
              <Button type="text" icon={<ColumnHeightOutlined />}>
                行高
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="main-table-card" ref={mainTableCardRef}>
        <Table
          columns={mainColumns}
          dataSource={paginatedMainData}
          rowKey="rowKey"
          scroll={{ x: mainTableWidth || 1500, y: tableScrollY }}
          pagination={{
            current: mainCurrentPage,
            pageSize: mainPageSize,
            total: pagedMaterialCodes.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setMainCurrentPage(page)
              setMainPageSize(size || 20)
            },
            onShowSizeChange: (_current, size) => {
              setMainCurrentPage(1)
              setMainPageSize(size)
            },
          }}
          size="small"
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: (selectedKeys) => {
              // 由于只显示供给行的复选框，selectedKeys 中只包含供给行的 key
              // 根据供给行找到对应的物料，然后选中/取消选中该物料的所有三行
              const supplyRowKeys = selectedKeys.filter(key => {
                const record = transformedMaterialData.find(item => item.rowKey === key)
                return record?.rowType === '供给'
              })
              
              const selectedMaterialCodes = new Set(
                transformedMaterialData
                  .filter(item => supplyRowKeys.includes(item.rowKey || ''))
                  .map(item => item.materialCode)
              )
              
              // 找到所有选中物料对应的三行（需求、供给、结存）
              const allSelectedKeys = transformedMaterialData
                .filter(item => selectedMaterialCodes.has(item.materialCode))
                .map(item => item.rowKey || '')
                .filter(key => key)
              
              setSelectedRowKeys(allSelectedKeys)
            },
            onSelectAll: (selected) => {
              if (selected) {
                // 全选时，选中当前页所有物料的所有三行
                const allRowKeys = paginatedMainData.map(item => item.rowKey || '').filter(key => key)
                setSelectedRowKeys(allRowKeys)
              } else {
                // 取消全选
                setSelectedRowKeys([])
              }
            },
            getCheckboxProps: (record: MaterialItem) => {
              // 只显示物料中间行（供给行）的复选框
              if (record.rowType !== '供给') {
                return {
                  style: { display: 'none' },
                }
              }
              return {
                name: record.materialCode,
              }
            },
          }}
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          onRow={(record) => ({
            onClick: (e) => {
              // 如果点击的是复选框，不触发行选择
              if ((e.target as HTMLElement).closest('.ant-checkbox-wrapper')) {
                return
              }
              handleRowClick(record)
            },
            className: `${selectedMaterial === record.materialCode ? 'row-selected' : ''} ${record.rowType !== '供给' ? 'hide-checkbox' : ''}`,
            'data-row-type': record.rowType,
            style: {
              cursor: 'pointer',
            },
          })}
        />
      </Card>

      {selectedMaterial && (
        <>
          <div
            className="detail-resize-handle"
            onMouseDown={handleDetailResizeStart}
            style={{ cursor: 'row-resize' }}
          />
          <Card
            ref={detailTableCardRef}
            className="detail-table-card"
            style={{ height: detailTableHeight }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  供需明细 - 当前选中: {selectedMaterial} {materialData.find(m => m.materialCode === selectedMaterial)?.materialName || ''}
                </span>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedMaterial('')}
                  size="small"
                  style={{ marginLeft: 16 }}
                >
                  关闭
                </Button>
              </div>
            }
          >
            <Table
              columns={detailColumns}
              dataSource={paginatedDetailData}
              scroll={{ x: detailTableWidth || 1500, y: detailTableHeight - 120 }}
              pagination={{
                current: detailCurrentPage,
                pageSize: detailPageSize,
                total: detailData.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, size) => {
                  setDetailCurrentPage(page)
                  setDetailPageSize(size || 20)
                },
                onShowSizeChange: (_current, size) => {
                  setDetailCurrentPage(1)
                  setDetailPageSize(size)
                },
              }}
              size="small"
              components={{
                header: {
                  cell: ResizableTitle,
                },
              }}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default MaterialControlWorkbench
