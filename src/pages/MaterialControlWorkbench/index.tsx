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
  Modal,
  Form,
  Checkbox,
  Typography,
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
import type { MaterialItem, SupplyDemandDetail, TimeDataItem } from '@/types/supply-demand'
import type { DemandCalcRule } from '@/pages/SalesDetail/DemandCalcDrawer'
import { defaultRule, WAREHOUSE_OPTIONS, loadLastRule, persistLastRule } from '@/pages/SalesDetail/DemandCalcDrawer'
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

  const [supplyRuleModalOpen, setSupplyRuleModalOpen] = useState(false)
  const [supplyRule, setSupplyRule] = useState<DemandCalcRule>(defaultRule)
  const [supplyRuleForm] = Form.useForm<DemandCalcRule>()
  
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

  // 模拟物料数据：按当前日期动态生成 timeData，保证主表日期列有数据；物料名称与规格更贴近业务
  const materialData = useMemo<MaterialItem[]>(() => {
    const today = dayjs()
    const buildTimeData = (
      initialBalance: number,
      dailyDemand: number[],
      dailySupply: number[]
    ): TimeDataItem[] => {
      const rows: TimeDataItem[] = [{ date: '期初', demand: 0, supply: 0, balance: initialBalance }]
      let balance = initialBalance
      for (let i = 0; i < 7; i++) {
        const d = dailyDemand[i] ?? 0
        const s = dailySupply[i] ?? 0
        balance = balance + s - d
        rows.push({
          date: today.add(i, 'day').format('YYYY-MM-DD'),
          demand: d,
          supply: s,
          balance,
        })
      }
      return rows
    }

    const rawData: MaterialItem[] = [
      {
        key: '1',
        materialCode: 'BB00001',
        materialName: '智能网关机箱',
        specification: '100×50×30mm 钣金',
        unit: '件',
        safetyStock: 50,
        currentStock: 100,
        shortageQty: 0,
        supplier: '华强钣金',
        workshop: '车间1',
        expanded: false,
        timeData: buildTimeData(100, [50, 30, 20, 40, 25, 35, 20], [0, 100, 0, 50, 0, 80, 60]),
        planNew: 60, purchaseInTransit: 100, productionWip: 40,
        salesPendingIssue: 30, planPendingPick: 20, productionPendingPick: 15,
      },
      {
        key: '2',
        materialCode: 'BB00002',
        materialName: '工业接线盒',
        specification: '120×60×40mm 阻燃',
        unit: '件',
        safetyStock: 50,
        currentStock: 80,
        shortageQty: 0,
        supplier: '远东电气',
        workshop: '车间1',
        expanded: false,
        timeData: buildTimeData(80, [40, 20, 30, 25, 35, 15, 10], [0, 60, 0, 40, 0, 50, 45]),
        planNew: 40, purchaseInTransit: 60, productionWip: 0,
        salesPendingIssue: 20, planPendingPick: 15, productionPendingPick: 10,
      },
      {
        key: '3',
        materialCode: 'BB00003',
        materialName: '机加工支架',
        specification: '80×40×20mm 冷轧',
        unit: '件',
        safetyStock: 100,
        currentStock: 0,
        shortageQty: 385,
        supplier: '精工机械',
        workshop: '车间2',
        expanded: false,
        timeData: buildTimeData(0, [385, 200, 150, 100, 80, 120, 60], [0, 150, 0, 300, 0, 500, 200]),
        planNew: 200, purchaseInTransit: 150, productionWip: 300,
        salesPendingIssue: 0, planPendingPick: 100, productionPendingPick: 80,
      },
      {
        key: '4',
        materialCode: 'BB00004',
        materialName: '焊接组件',
        specification: '90×45×25mm',
        unit: '件',
        safetyStock: 100,
        currentStock: 50,
        shortageQty: 0,
        supplier: '众合焊接',
        workshop: '车间2',
        expanded: false,
        timeData: buildTimeData(50, [30, 20, 25, 35, 15, 20, 18], [0, 40, 0, 50, 0, 60, 40]),
        planNew: 30, purchaseInTransit: 50, productionWip: 20,
        salesPendingIssue: 10, planPendingPick: 15, productionPendingPick: 12,
      },
      {
        key: '5',
        materialCode: 'BB00005',
        materialName: 'Q235 钢材',
        specification: '板材/卷料',
        unit: 'kg',
        safetyStock: 200,
        currentStock: 150,
        shortageQty: 0,
        supplier: '宝钢经销',
        workshop: '',
        expanded: false,
        timeData: buildTimeData(150, [80, 60, 50, 70, 40, 90, 55], [0, 200, 0, 150, 0, 180, 100]),
        planNew: 100, purchaseInTransit: 200, productionWip: 0,
        salesPendingIssue: 50, planPendingPick: 80, productionPendingPick: 60,
      },
      {
        key: '6',
        materialCode: 'BB00006',
        materialName: '控制柜体',
        specification: '150×80×50mm',
        unit: '件',
        safetyStock: 30,
        currentStock: 45,
        shortageQty: 0,
        supplier: '华强钣金',
        workshop: '车间1',
        expanded: false,
        timeData: buildTimeData(45, [20, 15, 10, 25, 12, 18, 8], [0, 30, 0, 20, 0, 35, 25]),
        planNew: 20, purchaseInTransit: 30, productionWip: 10,
        salesPendingIssue: 8, planPendingPick: 5, productionPendingPick: 6,
      },
      {
        key: '7',
        materialCode: 'BB00007',
        materialName: '喷涂件',
        specification: '70×35×18mm',
        unit: '件',
        safetyStock: 80,
        currentStock: 120,
        shortageQty: 0,
        supplier: '精工机械',
        workshop: '车间2',
        expanded: false,
        timeData: buildTimeData(120, [50, 30, 40, 35, 25, 45, 30], [0, 80, 0, 60, 0, 70, 50]),
        planNew: 50, purchaseInTransit: 0, productionWip: 70,
        salesPendingIssue: 25, planPendingPick: 30, productionPendingPick: 20,
      },
      {
        key: '8',
        materialCode: 'BB00008',
        materialName: '304 不锈钢',
        specification: '板/管',
        unit: 'kg',
        safetyStock: 150,
        currentStock: 200,
        shortageQty: 0,
        supplier: '太钢经销',
        workshop: '',
        expanded: false,
        timeData: buildTimeData(200, [60, 40, 50, 70, 30, 80, 45], [0, 100, 0, 120, 0, 150, 90]),
        planNew: 80, purchaseInTransit: 100, productionWip: 0,
        salesPendingIssue: 40, planPendingPick: 60, productionPendingPick: 30,
      },
      {
        key: '9',
        materialCode: 'BB00009',
        materialName: '配电柜门板',
        specification: '200×100×60mm',
        unit: '件',
        safetyStock: 20,
        currentStock: 15,
        shortageQty: 5,
        supplier: '远东电气',
        workshop: '车间1',
        expanded: false,
        timeData: buildTimeData(15, [10, 8, 12, 15, 6, 10, 5], [0, 15, 0, 20, 0, 25, 18]),
        planNew: 15, purchaseInTransit: 25, productionWip: 0,
        salesPendingIssue: 10, planPendingPick: 8, productionPendingPick: 5,
      },
      {
        key: '10',
        materialCode: 'BB00010',
        materialName: '装配底座',
        specification: '110×55×30mm',
        unit: '件',
        safetyStock: 60,
        currentStock: 30,
        shortageQty: 30,
        supplier: '众合焊接',
        workshop: '车间2',
        expanded: false,
        timeData: buildTimeData(30, [40, 25, 30, 20, 35, 15, 12], [0, 30, 0, 50, 0, 60, 45]),
        planNew: 25, purchaseInTransit: 30, productionWip: 50,
        salesPendingIssue: 15, planPendingPick: 20, productionPendingPick: 18,
      },
      {
        key: '11',
        materialCode: 'BB00011',
        materialName: '6061 铝合金',
        specification: '型材',
        unit: 'kg',
        safetyStock: 100,
        currentStock: 180,
        shortageQty: 0,
        supplier: '中铝经销',
        workshop: '',
        expanded: false,
        timeData: buildTimeData(180, [50, 40, 60, 45, 35, 55, 40], [0, 80, 0, 100, 0, 120, 85]),
        planNew: 60, purchaseInTransit: 80, productionWip: 0,
        salesPendingIssue: 30, planPendingPick: 50, productionPendingPick: 35,
      },
      {
        key: '12',
        materialCode: 'BB00012',
        materialName: 'PLC 安装板',
        specification: '180×90×55mm',
        unit: '件',
        safetyStock: 40,
        currentStock: 60,
        shortageQty: 0,
        supplier: '华强钣金',
        workshop: '车间1',
        expanded: false,
        timeData: buildTimeData(60, [25, 20, 15, 30, 18, 22, 14], [0, 40, 0, 25, 0, 45, 35]),
        planNew: 35, purchaseInTransit: 40, productionWip: 25,
        salesPendingIssue: 15, planPendingPick: 10, productionPendingPick: 8,
      },
    ]

    return rawData.map((item) => {
      const expectedIn = (item.planNew || 0) + (item.purchaseInTransit || 0) + (item.productionWip || 0)
      const expectedOut = (item.salesPendingIssue || 0) + (item.planPendingPick || 0) + (item.productionPendingPick || 0)
      const availableStock = (item.currentStock || 0) + expectedIn - expectedOut
      return { ...item, expectedIn, expectedOut, availableStock }
    })
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
      'BB00006': [
        { key: '24', type: '需求', docType: '销售订单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'XSDD-2026-0088', docStatus: '已审核', lineNo: 1, unit: '件', qty: 20, executedQty: 0, unexecutedQty: 20, exception: '' },
        { key: '25', type: '需求', docType: '生产工单', docDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0012', docStatus: '已审核', lineNo: 1, unit: '件', qty: 10, executedQty: 0, unexecutedQty: 10, exception: '' },
        { key: '26', type: '供给', docType: '采购订单', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0015', docStatus: '已审核', lineNo: 1, unit: '件', qty: 30, executedQty: 0, unexecutedQty: 30, exception: '' },
        { key: '27', type: '供给', docType: '生产入库', docDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), docNo: 'SCRK-2026-0003', docStatus: '已审核', lineNo: 1, unit: '件', qty: 35, executedQty: 0, unexecutedQty: 35, exception: '' },
      ],
      'BB00007': [
        { key: '28', type: '需求', docType: '生产工单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'SCRW-2026-0015', docStatus: '已审核', lineNo: 1, unit: '件', qty: 50, executedQty: 0, unexecutedQty: 50, exception: '' },
        { key: '29', type: '需求', docType: '生产工单', docDate: dayjs().add(3, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0018', docStatus: '已审核', lineNo: 1, unit: '件', qty: 40, executedQty: 0, unexecutedQty: 40, exception: '' },
        { key: '30', type: '供给', docType: '委外入库', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'WWRK-2026-0002', docStatus: '已审核', lineNo: 1, unit: '件', qty: 80, executedQty: 0, unexecutedQty: 80, exception: '' },
        { key: '31', type: '供给', docType: '生产入库', docDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), docNo: 'SCRK-2026-0005', docStatus: '已审核', lineNo: 1, unit: '件', qty: 70, executedQty: 0, unexecutedQty: 70, exception: '' },
      ],
      'BB00008': [
        { key: '32', type: '需求', docType: '生产工单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'SCRW-2026-0020', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 60, executedQty: 0, unexecutedQty: 60, exception: '' },
        { key: '33', type: '需求', docType: '生产工单', docDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0022', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 50, executedQty: 0, unexecutedQty: 50, exception: '' },
        { key: '34', type: '供给', docType: '采购订单', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0025', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 100, executedQty: 0, unexecutedQty: 100, exception: '' },
        { key: '35', type: '供给', docType: '采购入库', docDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), docNo: 'CGRK-2026-0008', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 150, executedQty: 0, unexecutedQty: 150, exception: '' },
      ],
      'BB00009': [
        { key: '36', type: '需求', docType: '销售订单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'XSDD-2026-0092', docStatus: '已审核', lineNo: 1, unit: '件', qty: 10, executedQty: 0, unexecutedQty: 10, exception: '' },
        { key: '37', type: '需求', docType: '生产工单', docDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0025', docStatus: '已审核', lineNo: 1, unit: '件', qty: 12, executedQty: 0, unexecutedQty: 12, exception: '' },
        { key: '38', type: '供给', docType: '采购订单', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0030', docStatus: '已审核', lineNo: 1, unit: '件', qty: 15, executedQty: 0, unexecutedQty: 15, exception: '' },
        { key: '39', type: '供给', docType: '采购订单', docDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0032', docStatus: '已审核', lineNo: 1, unit: '件', qty: 25, executedQty: 0, unexecutedQty: 25, exception: '' },
      ],
      'BB00010': [
        { key: '40', type: '需求', docType: '生产工单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'SCRW-2026-0030', docStatus: '已审核', lineNo: 1, unit: '件', qty: 40, executedQty: 0, unexecutedQty: 40, exception: '' },
        { key: '41', type: '需求', docType: '生产工单', docDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0032', docStatus: '已审核', lineNo: 1, unit: '件', qty: 30, executedQty: 0, unexecutedQty: 30, exception: '' },
        { key: '42', type: '供给', docType: '委外入库', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'WWRK-2026-0005', docStatus: '已审核', lineNo: 1, unit: '件', qty: 30, executedQty: 0, unexecutedQty: 30, exception: '' },
        { key: '43', type: '供给', docType: '采购订单', docDate: dayjs().add(4, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0038', docStatus: '已审核', lineNo: 1, unit: '件', qty: 50, executedQty: 0, unexecutedQty: 50, exception: '' },
        { key: '44', type: '供给', docType: '生产入库', docDate: dayjs().add(6, 'day').format('YYYY-MM-DD'), docNo: 'SCRK-2026-0010', docStatus: '已审核', lineNo: 1, unit: '件', qty: 60, executedQty: 0, unexecutedQty: 60, exception: '' },
      ],
      'BB00011': [
        { key: '45', type: '需求', docType: '生产工单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'SCRW-2026-0040', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 50, executedQty: 0, unexecutedQty: 50, exception: '' },
        { key: '46', type: '需求', docType: '生产工单', docDate: dayjs().add(3, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0042', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 60, executedQty: 0, unexecutedQty: 60, exception: '' },
        { key: '47', type: '供给', docType: '采购订单', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0045', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 80, executedQty: 0, unexecutedQty: 80, exception: '' },
        { key: '48', type: '供给', docType: '采购入库', docDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), docNo: 'CGRK-2026-0012', docStatus: '已审核', lineNo: 1, unit: 'kg', qty: 120, executedQty: 0, unexecutedQty: 120, exception: '' },
      ],
      'BB00012': [
        { key: '49', type: '需求', docType: '销售订单', docDate: dayjs().format('YYYY-MM-DD'), docNo: 'XSDD-2026-0098', docStatus: '已审核', lineNo: 1, unit: '件', qty: 25, executedQty: 0, unexecutedQty: 25, exception: '' },
        { key: '50', type: '需求', docType: '生产工单', docDate: dayjs().add(3, 'day').format('YYYY-MM-DD'), docNo: 'SCRW-2026-0050', docStatus: '已审核', lineNo: 1, unit: '件', qty: 15, executedQty: 0, unexecutedQty: 15, exception: '' },
        { key: '51', type: '供给', docType: '采购订单', docDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), docNo: 'CGDD-2026-0052', docStatus: '已审核', lineNo: 1, unit: '件', qty: 40, executedQty: 0, unexecutedQty: 40, exception: '' },
        { key: '52', type: '供给', docType: '生产入库', docDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), docNo: 'SCRK-2026-0015', docStatus: '已审核', lineNo: 1, unit: '件', qty: 45, executedQty: 0, unexecutedQty: 45, exception: '' },
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
        title: '现有库存',
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
      {
        title: '预计可用库存',
        dataIndex: 'availableStock',
        key: 'availableStock',
        width: getColumnWidth('availableStock', 120, mainColumnWidths),
        align: 'right',
        render: (text) => {
          const value = text ?? 0
          return <span style={{ color: value < 0 ? '#ff4d4f' : '#333', fontWeight: 600 }}>{value}</span>
        },
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '预计入库',
        dataIndex: 'expectedIn',
        key: 'expectedIn',
        width: getColumnWidth('expectedIn', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '预计出库',
        dataIndex: 'expectedOut',
        key: 'expectedOut',
        width: getColumnWidth('expectedOut', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '销售待发',
        dataIndex: 'salesPendingIssue',
        key: 'salesPendingIssue',
        width: getColumnWidth('salesPendingIssue', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '计划新增',
        dataIndex: 'planNew',
        key: 'planNew',
        width: getColumnWidth('planNew', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '计划待领',
        dataIndex: 'planPendingPick',
        key: 'planPendingPick',
        width: getColumnWidth('planPendingPick', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '采购在途',
        dataIndex: 'purchaseInTransit',
        key: 'purchaseInTransit',
        width: getColumnWidth('purchaseInTransit', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '生产在制',
        dataIndex: 'productionWip',
        key: 'productionWip',
        width: getColumnWidth('productionWip', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
        },
      },
      {
        title: '生产待领',
        dataIndex: 'productionPendingPick',
        key: 'productionPendingPick',
        width: getColumnWidth('productionPendingPick', 100, mainColumnWidths),
        align: 'right',
        onCell: (record, index) => {
          if (index === undefined) return {}
          const isFirstRow = index === 0 || transformedMaterialData[index - 1]?.materialCode !== record.materialCode
          const rowCount = transformedMaterialData.filter(item => item.materialCode === record.materialCode).length
          return { rowSpan: isFirstRow ? rowCount : 0 }
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

  const handleSupplyDemandSettings = () => {
    message.info('供需设置功能')
  }

  const handleSupplyDemandConfig = () => {
    const lastRule = loadLastRule()
    setSupplyRule(lastRule)
    supplyRuleForm.setFieldsValue(lastRule)
    setSupplyRuleModalOpen(true)
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
  }, [selectedRowKeys, transformedMaterialData])

  const handleBatchExport = useCallback(() => {
    const hasSelection = selectedRowKeys.length > 0
    const exportRows = hasSelection
      ? transformedMaterialData.filter(item => selectedRowKeys.includes(item.rowKey || ''))
      : transformedMaterialData

    if (exportRows.length === 0) {
      message.warning('暂无可导出的供需数据')
      return
    }

    const materialCount = new Set(exportRows.map(item => item.materialCode)).size

    if (hasSelection) {
      message.success(`已导出 ${materialCount} 个已选物料的供需数据`)
      return
    }

    message.success(`已导出全部 ${materialCount} 个物料的供需数据`)
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
              <div className="toolbar-batch-left">
                <span className="selected-count">
                  已选择 {selectedMaterialCount} 个物料
                </span>
                <Button onClick={handleBatchExport}>导出</Button>
                <Button onClick={() => handleBatchOperation('下发生产')}>
                  下发生产
                </Button>
                <Button onClick={() => handleBatchOperation('下发采购')}>
                  下发采购
                </Button>
              </div>
              <Button type="text" className="toolbar-cancel-select" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleBatchExport}>导出</Button>
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

      <Modal
        title="供需设置 - 预计可用库存"
        open={supplyRuleModalOpen}
        onCancel={() => setSupplyRuleModalOpen(false)}
        onOk={async () => {
          const values = await supplyRuleForm.validateFields()
          const next = { ...supplyRule, ...values }
          setSupplyRule(next)
          persistLastRule(next)
          setSupplyRuleModalOpen(false)
          message.success('已保存供需设置（与需求计算配置保持一致）')
        }}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        width={980}
        className="rule-config-modal"
      >
        <Form form={supplyRuleForm} layout="vertical" initialValues={supplyRule}>
          <div className="rule-config-all">
            <div className="rule-item">
              <div className="rule-item-label">说明</div>
              <div className="rule-item-control">
                <Typography.Text type="secondary">
                  与需求计算中「计算规则配置 → 预计可用库存」共用同一套配置，修改后全局生效。
                </Typography.Text>
              </div>
            </div>

            <div className="rule-item">
                      <div className="rule-item-label">库存数量</div>
                      <div className="rule-item-control">
                        <Space size={24} direction="vertical">
                          <div className="available-stock-item">
                            <Form.Item name={['availableStockSettings', 'includeOnHand']} valuePropName="checked" noStyle>
                              <Checkbox>现有库存</Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.availableStockSettings?.includeOnHand !== cur.availableStockSettings?.includeOnHand}>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'includeOnHand']))
                                if (!checked) return null
                                return (
                                  <Space size={8} style={{ marginLeft: 16 }}>
                                    <Typography.Text type="secondary">排除部分仓库</Typography.Text>
                                    <Form.Item
                                      name={['availableStockSettings', 'onHandExcludedWarehouses']}
                                      noStyle
                                    >
                                      <Select
                                        mode="multiple"
                                        allowClear
                                        placeholder="请选择仓库"
                                        options={WAREHOUSE_OPTIONS}
                                        style={{ minWidth: 260 }}
                                      />
                                    </Form.Item>
                                  </Space>
                                )
                              }}
                            </Form.Item>
                          </div>
                          <div className="available-stock-item">
                            <Form.Item name={['availableStockSettings', 'includeSafetyStock']} valuePropName="checked" noStyle>
                              <Checkbox>安全库存</Checkbox>
                            </Form.Item>
                          </div>
                        </Space>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">预计入库</div>
                      <div className="rule-item-control">
                        <Space size={24} direction="vertical">
                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedIn', 'planNew', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox
                                onChange={(e) => {
                                  supplyRuleForm.setFieldValue(
                                    ['availableStockSettings', 'expectedIn', 'planNew', 'pendingApproval'],
                                    e.target.checked
                                  )
                                }}
                              >
                                计划新增
                              </Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'expectedIn', 'planNew', 'checked']))
                                return (
                                  <Form.Item
                                    name={['availableStockSettings', 'expectedIn', 'planNew', 'pendingApproval']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <Checkbox disabled={!checked}>含待审批</Checkbox>
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                          </div>

                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedIn', 'purchaseInTransit', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox
                                onChange={(e) => {
                                  supplyRuleForm.setFieldValue(
                                    ['availableStockSettings', 'expectedIn', 'purchaseInTransit', 'pendingApproval'],
                                    e.target.checked
                                  )
                                }}
                              >
                                采购在途
                              </Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'expectedIn', 'purchaseInTransit', 'checked']))
                                return (
                                  <Form.Item
                                    name={['availableStockSettings', 'expectedIn', 'purchaseInTransit', 'pendingApproval']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <Checkbox disabled={!checked}>含待审批</Checkbox>
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                          </div>

                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedIn', 'productionWip', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox
                                onChange={(e) => {
                                  supplyRuleForm.setFieldValue(
                                    ['availableStockSettings', 'expectedIn', 'productionWip', 'notStarted'],
                                    e.target.checked
                                  )
                                }}
                              >
                                生产在制
                              </Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'expectedIn', 'productionWip', 'checked']))
                                return (
                                  <Form.Item
                                    name={['availableStockSettings', 'expectedIn', 'productionWip', 'notStarted']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <Checkbox disabled={!checked}>含未开始</Checkbox>
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                          </div>
                        </Space>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">预计出库</div>
                      <div className="rule-item-control">
                        <Space size={24} direction="vertical">
                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedOut', 'salesPendingIssue', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox
                                onChange={(e) => {
                                  supplyRuleForm.setFieldValue(
                                    ['availableStockSettings', 'expectedOut', 'salesPendingIssue', 'pendingApproval'],
                                    e.target.checked
                                  )
                                }}
                              >
                                销售待发
                              </Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'expectedOut', 'salesPendingIssue', 'checked']))
                                return (
                                  <Form.Item
                                    name={['availableStockSettings', 'expectedOut', 'salesPendingIssue', 'pendingApproval']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <Checkbox disabled={!checked}>含待审批</Checkbox>
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                            <Typography.Text type="secondary" style={{ marginLeft: 32 }}>
                              销售占用仅考虑已计算过的销售订单。
                            </Typography.Text>
                          </div>

                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedOut', 'planPendingPick', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox
                                onChange={(e) => {
                                  supplyRuleForm.setFieldValue(
                                    ['availableStockSettings', 'expectedOut', 'planPendingPick', 'pendingApproval'],
                                    e.target.checked
                                  )
                                }}
                              >
                                计划待领
                              </Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'expectedOut', 'planPendingPick', 'checked']))
                                return (
                                  <Form.Item
                                    name={['availableStockSettings', 'expectedOut', 'planPendingPick', 'pendingApproval']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <Checkbox disabled={!checked}>含待审批</Checkbox>
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                          </div>

                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedOut', 'productionPendingPick', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox
                                onChange={(e) => {
                                  supplyRuleForm.setFieldValue(
                                    ['availableStockSettings', 'expectedOut', 'productionPendingPick', 'notStarted'],
                                    e.target.checked
                                  )
                                }}
                              >
                                生产待领
                              </Checkbox>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate>
                              {({ getFieldValue }) => {
                                const checked = Boolean(getFieldValue(['availableStockSettings', 'expectedOut', 'productionPendingPick', 'checked']))
                                return (
                                  <Form.Item
                                    name={['availableStockSettings', 'expectedOut', 'productionPendingPick', 'notStarted']}
                                    valuePropName="checked"
                                    noStyle
                                  >
                                    <Checkbox disabled={!checked}>含未开始</Checkbox>
                                  </Form.Item>
                                )
                              }}
                            </Form.Item>
                          </div>
                        </Space>
                        <Form.Item noStyle shouldUpdate>
                          {({ getFieldValue }) => {
                            const settings = (getFieldValue('availableStockSettings') || {}) as DemandCalcRule['availableStockSettings']

                            const plusParts: string[] = []
                            const minusParts: string[] = []

                            if (settings.includeOnHand) plusParts.push('现有库存')
                            if (settings.includeSafetyStock) minusParts.push('安全库存')

                            if (settings.expectedIn?.planNew?.checked) {
                              plusParts.push(`计划新增${settings.expectedIn.planNew.pendingApproval ? '(含待审批)' : ''}`)
                            }
                            if (settings.expectedIn?.purchaseInTransit?.checked) {
                              plusParts.push(`采购在途${settings.expectedIn.purchaseInTransit.pendingApproval ? '(含待审批)' : ''}`)
                            }
                            if (settings.expectedIn?.productionWip?.checked) {
                              plusParts.push(`生产在制${settings.expectedIn.productionWip.notStarted ? '(含未开始)' : ''}`)
                            }

                            if (settings.expectedOut?.salesPendingIssue?.checked) {
                              minusParts.push(`销售待发${settings.expectedOut.salesPendingIssue.pendingApproval ? '(含待审批)' : ''}`)
                            }
                            if (settings.expectedOut?.planPendingPick?.checked) {
                              minusParts.push(`计划待领${settings.expectedOut.planPendingPick.pendingApproval ? '(含待审批)' : ''}`)
                            }
                            if (settings.expectedOut?.productionPendingPick?.checked) {
                              minusParts.push(`生产待领${settings.expectedOut.productionPendingPick.notStarted ? '(含未开始)' : ''}`)
                            }

                            return (
                              <div className="available-stock-formula">
                                <div className="available-stock-formula-label">预计可用库存计算口径</div>
                                <div className="available-stock-formula-row">
                                  <span className="available-stock-formula-row-label">加：</span>
                                  <span className="available-stock-formula-row-value">
                                    {plusParts.length ? plusParts.join(' + ') : '无'}
                                  </span>
                                </div>
                                <div className="available-stock-formula-row">
                                  <span className="available-stock-formula-row-label">减：</span>
                                  <span className="available-stock-formula-row-value">
                                    {minusParts.length ? minusParts.join(' + ') : '无'}
                                  </span>
                                </div>
                              </div>
                            )
                          }}
                        </Form.Item>
                      </div>
                    </div>
          </div>
        </Form>
      </Modal>

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
