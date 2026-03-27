import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  message,
  DatePicker,
  Popconfirm,
  Drawer,
  Descriptions,
  Tag,
  Tabs,
  Checkbox,
} from 'antd'
import type { Dayjs } from 'dayjs'
import {
  ReloadOutlined,
  SettingOutlined,
  ColumnHeightOutlined,
  SortAscendingOutlined,
  SearchOutlined,
  FileTextOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { MaterialItem } from '@/types/supply-demand'
import ResizableTitle from '@/components/common/ResizableTitle'
import { loadLastRule } from '@/pages/SalesDetail/DemandCalcDrawer'
import { ROUTES } from '@/constants/routes'
import './index.css'

const formatAvailableStockFormula = () => {
  const rule = loadLastRule()
  if (rule.inventoryScope !== 'available') return '预计可用库存：不参与计算'

  const settings = rule.availableStockSettings
  const plusParts: string[] = []
  const minusParts: string[] = []

  if (settings.includeOnHand) {
    const warehouseText =
      settings.onHandExcludedWarehouses && settings.onHandExcludedWarehouses.length
        ? `(排除仓库${settings.onHandExcludedWarehouses.length}个)`
        : ''
    plusParts.push(`现有库存${warehouseText}`)
  }
  if (settings.expectedIn.planNew.checked) {
    plusParts.push(`计划新增${settings.expectedIn.planNew.pendingApproval ? '(含待审批)' : ''}`)
  }
  if (settings.expectedIn.purchaseInTransit.checked) {
    plusParts.push(`采购在途${settings.expectedIn.purchaseInTransit.pendingApproval ? '(含待审批)' : ''}`)
  }
  if (settings.expectedIn.productionWip.checked) {
    plusParts.push(`生产在制${settings.expectedIn.productionWip.notStarted ? '(含未开始)' : ''}`)
  }

  if (settings.includeSafetyStock) minusParts.push('安全库存')
  if (settings.expectedOut.salesPendingIssue.checked) {
    minusParts.push(`销售待发${settings.expectedOut.salesPendingIssue.pendingApproval ? '(含待审批)' : ''}`)
  }
  if (settings.expectedOut.planPendingPick.checked) {
    minusParts.push(`计划待领${settings.expectedOut.planPendingPick.pendingApproval ? '(含待审批)' : ''}`)
  }
  if (settings.expectedOut.productionPendingPick.checked) {
    minusParts.push(`生产待领${settings.expectedOut.productionPendingPick.notStarted ? '(含未开始)' : ''}`)
  }

  const plusExpr = plusParts.length ? plusParts.join(' + ') : '0'
  const minusExpr = minusParts.length ? minusParts.join(' + ') : '0'
  return `(${plusExpr}) - (${minusExpr})`
}

const DemandCalculation: React.FC = () => {
  const navigate = useNavigate()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  // 筛选条件（与列表字段对应）：需求计算编号、库存查询时间、备注、创建人
  const [calcNo, setCalcNo] = useState('')
  const [docStatus, setDocStatus] = useState<string>('全部') // 计算状态：全部/待计算/计算中/已计算
  const [calcTimeRange, setCalcTimeRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [remark, setRemark] = useState('')
  const [createBy, setCreateBy] = useState('')
  const [selectedView, setSelectedView] = useState<string>('本月')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  // 已删除的行 key，用于前端模拟删除（接 API 后改为接口删除）
  const [deletedRowKeys, setDeletedRowKeys] = useState<React.Key[]>([])
  // 详情侧滑弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRecord, setDetailRecord] = useState<(MaterialItem & { rowKey?: string }) | null>(null)
  // 详情内各 Tab 分页
  const [docPage, setDocPage] = useState(1)
  const [docPageSize, setDocPageSize] = useState(10)
  const [recordPage, setRecordPage] = useState(1)
  const [recordPageSize, setRecordPageSize] = useState(10)
  // 需求计算记录：仅展示净需求>0，默认勾选
  const [hideZeroNetDemand, setHideZeroNetDemand] = useState(true)
  
  // 列宽状态管理
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})
  // 单据状态说明：同一时间仅一条「计算中」，其余按时间先后为「已计算」或「待计算」

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

  // 排除已删除的行
  const dataWithoutDeleted = useMemo(
    () => materialData.filter((m) => !deletedRowKeys.includes(m.key)),
    [materialData, deletedRowKeys]
  )

  // 计算状态映射：按时间从早到晚（这里用 key 代替时间）分布为「已计算」→「计算中」→「待计算」
  const docStatusMap = useMemo(() => {
    const ordered = [...dataWithoutDeleted].sort(
      (a, b) => Number(a.key) - Number(b.key)
    )
    const map = new Map<React.Key, '待计算' | '计算中' | '已计算'>()
    if (!ordered.length) return map

    const len = ordered.length
    // 中间偏后的一个作为「计算中」，前面的视为已完成，后面的视为待计算
    const runningIndex = Math.min(len - 1, Math.max(1, Math.floor(len / 2)))

    ordered.forEach((item, index) => {
      if (index < runningIndex) {
        map.set(item.key, '已计算')
      } else if (index === runningIndex) {
        map.set(item.key, '计算中')
      } else {
        map.set(item.key, '待计算')
      }
    })

    return map
  }, [dataWithoutDeleted])

  const getDocStatus = useCallback((record: { key?: React.Key }) => {
    if (!record.key) return '待计算'
    return docStatusMap.get(record.key) || '待计算'
  }, [docStatusMap])

  // 一级筛选：视图（本月/本年）
  const filteredByView = useMemo(() => {
    if (selectedView === '本月') return dataWithoutDeleted
    if (selectedView === '本年') return dataWithoutDeleted
    return dataWithoutDeleted
  }, [dataWithoutDeleted, selectedView])

  // 筛选逻辑：与列表字段对应（需求计算编号、计算状态、计算时间、备注、创建人）
  const filteredMaterialData = useMemo(() => {
    let data = filteredByView
    // 需求计算编号：列表显示为 XQJS-${materialCode}
    if (calcNo.trim()) {
      const keyword = calcNo.trim()
      data = data.filter((item) => {
        const no = `XQJS-${item.materialCode || item.key}`
        return no.includes(keyword) || (item.materialCode || '').includes(keyword)
      })
    }
    // 计算状态：待计算、计算中、已计算
    if (docStatus === '待计算') data = data.filter((item) => getDocStatus(item) === '待计算')
    else if (docStatus === '计算中') data = data.filter((item) => getDocStatus(item) === '计算中')
    else if (docStatus === '已计算') data = data.filter((item) => getDocStatus(item) === '已计算')
    // 计算时间：模拟数据无单独字段时按创建时间模拟；若有 calcTime 可在此比较
    if (calcTimeRange?.[0] && calcTimeRange?.[1]) {
      const [start, end] = calcTimeRange
      if (start && end) {
        data = data.filter(() => true) // 当前模拟数据无时间字段，全部通过；接真实 API 时按 calcTime 比较
      }
    }
    // 备注：列表显示为 materialName
    if (remark.trim()) data = data.filter((item) => item.materialName?.includes(remark.trim()))
    // 创建人：列表显示为「系统」，筛选包含关键词
    if (createBy.trim()) data = data.filter(() => '系统'.includes(createBy.trim()))
    return data
  }, [filteredByView, calcNo, docStatus, calcTimeRange, remark, createBy, getDocStatus])

  // 将物料数据转换为带 rowKey 的列表格式
  const transformedMaterialData = useMemo(() => {
    return filteredMaterialData.map((material) => ({
      ...material,
      rowKey: material.key,
    }))
  }, [filteredMaterialData])

  // 二级 Tab 各选项数量（与列表「计算状态」对应：全部/待计算/计算中/已计算）
  const docStatusCounts = useMemo(() => {
    const all = filteredByView.length
    const pending = filteredByView.filter((item) => getDocStatus(item) === '待计算').length
    const running = filteredByView.filter((item) => getDocStatus(item) === '计算中').length
    const done = filteredByView.filter((item) => getDocStatus(item) === '已计算').length
    return { 全部: all, 待计算: pending, 计算中: running, 已计算: done }
  }, [filteredByView, getDocStatus])

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return transformedMaterialData.slice(start, end)
  }, [transformedMaterialData, currentPage, pageSize])


  // 处理主表格列宽变化
  const handleMainResize = (key: string) => (_e: unknown, { size }: { size: { width: number } }) => {
    setMainColumnWidths((prev) => ({
      ...prev,
      [key]: size.width,
    }))
  }


  // 获取列宽（优先使用调整后的宽度）
  const getColumnWidth = (key: string | undefined, defaultWidth: number, widths: Record<string, number>) => {
    if (!key) return defaultWidth
    return widths[key] || defaultWidth
  }

  const handleView = (record: MaterialItem & { rowKey?: string }) => {
    setDetailRecord(record)
    // 打开前重置各 Tab 分页
    setDocPage(1)
    setRecordPage(1)
    setDetailVisible(true)
  }

  const handleDeleteSingle = (rowKey: React.Key) => {
    setDeletedRowKeys((prev) => [...prev, rowKey])
    setSelectedRowKeys((prev) => prev.filter((k) => k !== rowKey))
    message.success('已删除')
  }

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录')
      return
    }
    setDeletedRowKeys((prev) => [...new Set([...prev, ...selectedRowKeys])])
    setSelectedRowKeys([])
    message.success(`已删除 ${selectedRowKeys.length} 条记录`)
  }

  // 基础列定义（需求计算列表）
  // 字段顺序：需求计算编号、库存查询时间、备注、创建人、创建时间、计算规则、预计可用库存、操作
  const baseMainColumns: ColumnsType<MaterialItem> = useMemo(() => {
    const availableStockFormula = formatAvailableStockFormula()
    return [
      {
        title: '需求计算编号',
        key: 'calcNo',
        dataIndex: 'calcNo',
        width: getColumnWidth('calcNo', 160, mainColumnWidths),
        fixed: 'left',
        render: (_: unknown, record) => {
          // 示例编号：根据物料编码生成，真实项目中应来自后端
          return `XQJS-${record.materialCode || record.key}`
        },
      },
      {
        title: '库存查询时间',
        key: 'calcTime',
        dataIndex: 'calcTime',
        width: getColumnWidth('calcTime', 180, mainColumnWidths),
        render: () => '2026-01-25 10:00:00',
      },
      {
        title: '备注',
        key: 'remark',
        dataIndex: 'remark',
        width: getColumnWidth('remark', 200, mainColumnWidths),
        render: (_: unknown, record) => record.materialName || '',
      },
      {
        title: '创建人',
        key: 'createBy',
        dataIndex: 'createBy',
        width: getColumnWidth('createBy', 100, mainColumnWidths),
        render: () => '系统',
      },
      {
        title: '创建时间',
        key: 'createTime',
        dataIndex: 'createTime',
        width: getColumnWidth('createTime', 180, mainColumnWidths),
        render: () => '2026-01-25 09:00:00',
      },
      {
        title: '计算规则',
        key: 'ruleSummary',
        dataIndex: 'ruleSummary',
        width: getColumnWidth('ruleSummary', 260, mainColumnWidths),
        ellipsis: true,
        render: () => '库存口径：预计可用库存；库存方式：逐级考虑库存；BOM展开：按负预计可用库存展开；结果合并：产品；需求计划审批：自动审批',
      },
      {
        title: '预计可用库存',
        key: 'projectedAvailableStock',
        dataIndex: 'projectedAvailableStock',
        width: getColumnWidth('projectedAvailableStock', 380, mainColumnWidths),
        ellipsis: true,
        render: () => availableStockFormula,
      },
      {
        title: '操作',
        key: 'actions',
        width: getColumnWidth('actions', 140, mainColumnWidths),
        fixed: 'right',
        render: (_: unknown, record: MaterialItem & { rowKey?: string }) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => handleView(record)}>
              查看
            </Button>
            <Popconfirm
              title="确认删除该条需求计算记录？"
              okText="删除"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={() => handleDeleteSingle(record.rowKey ?? record.key)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]
  }, [mainColumnWidths])

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

  // 表格总宽度（用于横向滚动），避免拖拽一列时挤压其它列
  const mainTableWidth = useMemo(() => {
    return mainColumns.reduce((sum, col) => {
      const w = Number(col.width) || 100
      return sum + w
    }, 0)
  }, [mainColumns])


  const handleRefresh = () => {
    message.success('查询成功')
  }

  const handleReset = () => {
    setCalcNo('')
    setDocStatus('全部')
    setCalcTimeRange(null)
    setRemark('')
    setCreateBy('')
    setCurrentPage(1)
    message.success('已重置筛选条件')
  }

  const handleSupplyDemandSettings = () => {
    message.info('字段配置')
  }

  const handleSourceDocClick = (sourceDocNo: string, sourceDocType?: string) => {
    if (!sourceDocNo) return
    if (sourceDocType?.includes('销售')) {
      navigate(ROUTES.SALES_ORDER)
      return
    }
    navigate(ROUTES.SALES_DETAIL)
  }

  const renderDetailHeader = () => {
    if (!detailRecord) return null
    const calcNo = `XQJS-${detailRecord.materialCode || detailRecord.key}`
    const status = getDocStatus(detailRecord)
    const availableStockFormula = formatAvailableStockFormula()
    const statusColor =
      status === '已计算' ? 'green' : status === '计算中' ? 'orange' : 'default'

    return (
      <div className="demand-calc-detail-header">
        <div className="demand-calc-detail-title">
          <div className="demand-calc-detail-title-left">
            <span className="label">需求计算编号：</span>
            <span className="value strong">{calcNo}</span>
            <Tag color={statusColor} style={{ marginLeft: 12 }}>
              {status}
            </Tag>
          </div>
          <Space size="small">
            <Button
              size="small"
              onClick={() => {
                setDetailVisible(false)
                navigate(ROUTES.PLAN_ORDER_PURCHASE)
              }}
            >
              查看采购计划
            </Button>
            <Button
              size="small"
              onClick={() => {
                setDetailVisible(false)
                navigate(ROUTES.PLAN_ORDER_PRODUCTION)
              }}
            >
              查看生产计划
            </Button>
          </Space>
        </div>
        <Descriptions
          size="small"
          column={2}
          labelStyle={{ width: 96 }}
        >
          <Descriptions.Item label="计算状态">
            {status}
          </Descriptions.Item>
          <Descriptions.Item label="计算时间">
            2026-01-25 10:00:00
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {detailRecord.materialName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            系统
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            2026-01-25 09:00:00
          </Descriptions.Item>
          <Descriptions.Item label="计算规则" span={2}>
            库存口径：预计可用库存；库存方式：逐级考虑库存；BOM展开：按负预计可用库存展开；结果合并：产品；需求计划审批：自动审批
          </Descriptions.Item>
          <Descriptions.Item label="预计可用库存" span={2}>
            {availableStockFormula}
          </Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  const renderDemandDocTab = () => {
    if (!detailRecord) return null
    const calcNo = `XQJS-${detailRecord.materialCode || detailRecord.key}`
    // 模拟计算单据明细（字段与“计算单据”页签要求一致）
    const dataSource = [
      {
        key: `${calcNo}-1`,
        productCode: detailRecord.materialCode,
        productName: detailRecord.materialName,
        productSpec: detailRecord.specification || '-',
        calcQty: Math.max(detailRecord.shortageQty || 0, 0) + 20,
        appendCalcQty: 20,
        cumulativeCalcQty: Math.max(detailRecord.shortageQty || 0, 0) + 120,
        availableCalcQty: Math.max(detailRecord.shortageQty || 0, 0),
        docQty: Math.max(detailRecord.shortageQty || 0, 0) + 100,
        executedQty: 100,
        demandDate: '2026-01-28',
        sourceDemandDate: '2026-01-25',
        sourceDocType: '销售订单',
        sourceDocNo: 'SO-202601-0001',
        sourceLineNo: 1,
        sourceCustomer: '华东客户A',
      },
      {
        key: `${calcNo}-2`,
        productCode: detailRecord.materialCode,
        productName: detailRecord.materialName,
        productSpec: detailRecord.specification || '-',
        calcQty: Math.max(detailRecord.shortageQty || 0, 0),
        appendCalcQty: 0,
        cumulativeCalcQty: Math.max(detailRecord.shortageQty || 0, 0) + 100,
        availableCalcQty: Math.max(detailRecord.shortageQty || 0, 0),
        docQty: Math.max(detailRecord.shortageQty || 0, 0) + 100,
        executedQty: 100,
        demandDate: '2026-01-30',
        sourceDemandDate: '2026-01-26',
        sourceDocType: '销售订单',
        sourceDocNo: 'FC-202601-0008',
        sourceLineNo: 2,
        sourceCustomer: '华南客户B',
      },
    ]

    const columns: ColumnsType<any> = [
      { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 130 },
      { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 140 },
      { title: '产品规格', dataIndex: 'productSpec', key: 'productSpec', width: 140 },
      { title: '计算数量', dataIndex: 'calcQty', key: 'calcQty', width: 120 },
      { title: '追加计算数量', dataIndex: 'appendCalcQty', key: 'appendCalcQty', width: 130 },
      { title: '累计计算数量', dataIndex: 'cumulativeCalcQty', key: 'cumulativeCalcQty', width: 130 },
      { title: '可计算数量', dataIndex: 'availableCalcQty', key: 'availableCalcQty', width: 120 },
      { title: '单据数量', dataIndex: 'docQty', key: 'docQty', width: 110 },
      { title: '累计执行数量', dataIndex: 'executedQty', key: 'executedQty', width: 130 },
      { title: '需求日期', dataIndex: 'demandDate', key: 'demandDate', width: 120 },
      { title: '来源需求日期', dataIndex: 'sourceDemandDate', key: 'sourceDemandDate', width: 130 },
      { title: '来源单据类型', dataIndex: 'sourceDocType', key: 'sourceDocType', width: 130 },
      {
        title: '来源单据',
        dataIndex: 'sourceDocNo',
        key: 'sourceDocNo',
        width: 140,
        render: (value: string, record: any) => (
          <Button
            type="link"
            size="small"
            className="source-doc-link"
            onClick={() => handleSourceDocClick(value, record.sourceDocType)}
          >
            {value}
          </Button>
        ),
      },
      { title: '来源明细行号', dataIndex: 'sourceLineNo', key: 'sourceLineNo', width: 130 },
      { title: '来源客户', dataIndex: 'sourceCustomer', key: 'sourceCustomer', width: 130 },
    ]

    const pagedData = dataSource.slice(
      (docPage - 1) * docPageSize,
      (docPage - 1) * docPageSize + docPageSize
    )

    return (
      <div className="demand-calc-tab-content">
        <div className="demand-calc-tab-toolbar">
          <div className="toolbar-buttons">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={handleSupplyDemandSettings}
            >
              字段配置
            </Button>
          </div>
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={pagedData}
          rowKey="key"
          scroll={{ x: 1800, y: 260 }}
          pagination={{
            current: docPage,
            pageSize: docPageSize,
            total: dataSource.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setDocPage(page)
              setDocPageSize(size || 10)
            },
            onShowSizeChange: (_current, size) => {
              setDocPage(1)
              setDocPageSize(size)
            },
          }}
        />
      </div>
    )
  }

  const renderDemandRecordTab = () => {
    if (!detailRecord) return null
    const getBomLevel = (levelCode: string) => (levelCode === '0' ? '0' : String(levelCode.split('.').length))
    const isConcreteDate = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v))
    const fallbackDates = ['2026-01-25', '2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29', '2026-01-30']
    const dateList = (detailRecord.timeData || [])
      .map((d) => d.date)
      .filter((d): d is string => isConcreteDate(d))
    const pickConcreteDate = (idx: number) =>
      dateList.length > 0 ? dateList[idx % dateList.length] : fallbackDates[idx % fallbackDates.length]

    const rootGrossBase = Math.max(detailRecord.shortageQty || 0, detailRecord.timeData?.[0]?.demand || 0, 120)
    // 同一根结点产品（同一棵展开树）使用统一来源单据信息
    const sourceDocType = '销售订单'
    const sourceDocNo = 'SO-202601-0001'
    const sourceLineNo = 1
    const sourceCustomer = '华东客户A'
    const nodeDefs: Array<{
      levelCode: string
      unitUsage: number
      parentLevelCode?: string
      productCode: string
      productName: string
      productSpec: string
      unit: string
      productAttr: string
    }> = [
      {
        levelCode: '0',
        unitUsage: 1,
        productCode: detailRecord.materialCode,
        productName: detailRecord.materialName,
        productSpec: detailRecord.specification || '-',
        unit: detailRecord.unit,
        productAttr: detailRecord.workshop ? '自制' : '采购',
      },
      {
        levelCode: '1',
        parentLevelCode: '0',
        unitUsage: 2,
        productCode: `${detailRecord.materialCode}-A`,
        productName: `${detailRecord.materialName}-子件A`,
        productSpec: '子件规格A',
        unit: '件',
        productAttr: '自制',
      },
      {
        levelCode: '1.1',
        parentLevelCode: '1',
        unitUsage: 3,
        productCode: `${detailRecord.materialCode}-A1`,
        productName: `${detailRecord.materialName}-子件A1`,
        productSpec: '子件规格A1',
        unit: '件',
        productAttr: '采购',
      },
      {
        levelCode: '1.2',
        parentLevelCode: '1',
        unitUsage: 1,
        productCode: `${detailRecord.materialCode}-A2`,
        productName: `${detailRecord.materialName}-子件A2`,
        productSpec: '子件规格A2',
        unit: '件',
        productAttr: '采购',
      },
      {
        levelCode: '2',
        parentLevelCode: '0',
        unitUsage: 1,
        productCode: `${detailRecord.materialCode}-B`,
        productName: `${detailRecord.materialName}-子件B`,
        productSpec: '子件规格B',
        unit: '件',
        productAttr: '采购',
      },
      {
        levelCode: '2.1',
        parentLevelCode: '2',
        unitUsage: 2,
        productCode: `${detailRecord.materialCode}-B1`,
        productName: `${detailRecord.materialName}-子件B1`,
        productSpec: '子件规格B1',
        unit: '件',
        productAttr: '采购',
      },
    ]

    const netDemandByLevelCode = new Map<string, number>()
    const rawList = nodeDefs.map((node, index) => {
      const grossDemand = node.levelCode === '0'
        ? rootGrossBase
        : (netDemandByLevelCode.get(node.parentLevelCode || '') || 0) * node.unitUsage
      const availableBeforeAlloc = Math.max(Math.round(grossDemand * 0.35), 0)
      const allocated = Math.min(grossDemand, availableBeforeAlloc)
      const netDemand = Math.max(grossDemand - allocated, 0)
      netDemandByLevelCode.set(node.levelCode, netDemand)

      const onHandStock = Math.max(detailRecord.currentStock || 0, 0)
      const safetyStock = Math.max(detailRecord.safetyStock || 0, 0)
      const projectedAvailableStock = onHandStock - safetyStock

      return {
        key: `${detailRecord.key}-${node.levelCode}`,
        levelCode: node.levelCode,
        productCode: node.productCode,
        productName: node.productName,
        productSpec: node.productSpec,
        unit: node.unit,
        productAttr: node.productAttr,
        bomLevel: getBomLevel(node.levelCode),
        unitUsage: node.unitUsage,
        date: pickConcreteDate(index),
        demand: grossDemand,
        supply: allocated,
        balance: projectedAvailableStock,
        grossDemand,
        availableBeforeAlloc,
        allocated,
        availableAfterAlloc: Math.max(availableBeforeAlloc - allocated, 0),
        projectedAvailableStock,
        onHandStock,
        safetyStock,
        salesPendingIssue: Math.max(Math.round(grossDemand * 0.1), 0),
        planNew: Math.max(Math.round(grossDemand * 0.18), 0),
        planPendingPick: Math.max(Math.round(grossDemand * 0.12), 0),
        purchaseInTransit: Math.max(Math.round(grossDemand * 0.14), 0),
        productionWip: Math.max(Math.round(grossDemand * 0.08), 0),
        productionPendingPick: Math.max(Math.round(grossDemand * 0.09), 0),
        netDemand,
        suggestQty: netDemand,
        sourceDemandDate: pickConcreteDate(index),
        sourceDocType,
        sourceDocNo,
        sourceLineNo,
        sourceCustomer,
        remark: netDemand > 0 ? '需补货' : '-',
      }
    })
    // 由用户勾选「仅展示净需求>0」时过滤
    const dataSource = hideZeroNetDemand
      ? rawList.filter((row) => row.netDemand > 0)
      : rawList

    const columns: ColumnsType<any> = [
      {
        title: 'BOM层级',
        dataIndex: 'bomLevel',
        key: 'bomLevel',
        width: 90,
      },
      {
        title: '层级编号',
        dataIndex: 'levelCode',
        key: 'levelCode',
        width: 100,
      },
      {
        title: '产品编号',
        dataIndex: 'productCode',
        key: 'productCode',
        width: 130,
      },
      {
        title: '产品名称',
        dataIndex: 'productName',
        key: 'productName',
        width: 140,
      },
      {
        title: '产品规格',
        dataIndex: 'productSpec',
        key: 'productSpec',
        width: 140,
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
      },
      {
        title: '产品属性',
        dataIndex: 'productAttr',
        key: 'productAttr',
        width: 100,
      },
      {
        title: '单位用量',
        dataIndex: 'unitUsage',
        key: 'unitUsage',
        width: 90,
      },
      {
        title: '毛需求',
        dataIndex: 'grossDemand',
        key: 'grossDemand',
        width: 90,
      },
      {
        title: '分配前可用量',
        dataIndex: 'availableBeforeAlloc',
        key: 'availableBeforeAlloc',
        width: 120,
      },
      {
        title: '分配占用量',
        dataIndex: 'allocated',
        key: 'allocated',
        width: 110,
      },
      {
        title: '分配后可用量',
        dataIndex: 'availableAfterAlloc',
        key: 'availableAfterAlloc',
        width: 120,
      },
      {
        title: '预计可用库存',
        dataIndex: 'projectedAvailableStock',
        key: 'projectedAvailableStock',
        width: 120,
      },
      {
        title: '现有库存',
        dataIndex: 'onHandStock',
        key: 'onHandStock',
        width: 100,
      },
      {
        title: '安全库存',
        dataIndex: 'safetyStock',
        key: 'safetyStock',
        width: 100,
      },
      {
        title: '销售待发',
        dataIndex: 'salesPendingIssue',
        key: 'salesPendingIssue',
        width: 100,
      },
      {
        title: '计划新增',
        dataIndex: 'planNew',
        key: 'planNew',
        width: 100,
      },
      {
        title: '计划待领',
        dataIndex: 'planPendingPick',
        key: 'planPendingPick',
        width: 100,
      },
      {
        title: '采购在途',
        dataIndex: 'purchaseInTransit',
        key: 'purchaseInTransit',
        width: 100,
      },
      {
        title: '生产在制',
        dataIndex: 'productionWip',
        key: 'productionWip',
        width: 100,
      },
      {
        title: '生产待领',
        dataIndex: 'productionPendingPick',
        key: 'productionPendingPick',
        width: 100,
      },
      {
        title: '需求日期',
        dataIndex: 'date',
        key: 'date',
        width: 110,
      },
      {
        title: '净需求',
        dataIndex: 'netDemand',
        key: 'netDemand',
        width: 90,
      },
      {
        title: '建议数量',
        dataIndex: 'suggestQty',
        key: 'suggestQty',
        width: 90,
      },
      {
        title: '来源需求日期',
        dataIndex: 'sourceDemandDate',
        key: 'sourceDemandDate',
        width: 120,
      },
      {
        title: '来源单据类型',
        dataIndex: 'sourceDocType',
        key: 'sourceDocType',
        width: 120,
      },
      {
        title: '来源单据',
        dataIndex: 'sourceDocNo',
        key: 'sourceDocNo',
        width: 140,
        render: (value: string, record: any) => (
          <Button
            type="link"
            size="small"
            className="source-doc-link"
            onClick={() => handleSourceDocClick(value, record.sourceDocType)}
          >
            {value}
          </Button>
        ),
      },
      {
        title: '来源明细行号',
        dataIndex: 'sourceLineNo',
        key: 'sourceLineNo',
        width: 120,
      },
      {
        title: '来源客户',
        dataIndex: 'sourceCustomer',
        key: 'sourceCustomer',
        width: 120,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 120,
      },
    ]

    const recordTotal = dataSource.length
    const recordMaxPage = Math.max(1, Math.ceil(recordTotal / recordPageSize))
    const effectiveRecordPage = Math.min(recordPage, recordMaxPage)
    const pagedData = dataSource.slice(
      (effectiveRecordPage - 1) * recordPageSize,
      (effectiveRecordPage - 1) * recordPageSize + recordPageSize
    )

    return (
      <div className="demand-calc-tab-content">
        <div className="demand-calc-tab-toolbar">
          <div className="demand-calc-tab-toolbar-left">
            <Button
              type="text"
              size="small"
              icon={<ExportOutlined />}
              onClick={() => message.success(`已导出 ${recordTotal} 条计算过程记录`)}
            >
              导出
            </Button>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={handleSupplyDemandSettings}
            >
              字段配置
            </Button>
          </div>
          <div className="demand-calc-tab-toolbar-right">
            <Checkbox
              checked={hideZeroNetDemand}
              onChange={(e) => {
                setHideZeroNetDemand(e.target.checked)
                setRecordPage(1)
              }}
            >
              仅展示净需求&gt;0
            </Checkbox>
          </div>
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={pagedData}
          scroll={{ x: 3600, y: 260 }}
          pagination={{
            current: effectiveRecordPage,
            pageSize: recordPageSize,
            total: recordTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setRecordPage(page)
              setRecordPageSize(size || 10)
            },
            onShowSizeChange: (_current, size) => {
              setRecordPage(1)
              setRecordPageSize(size)
            },
          }}
        />
      </div>
    )
  }

  return (
    <div className="demand-calculation">
      {/* 已移除明细查看功能 - 单行数据显示 */}
      {/* 产品分类导航和筛选：一级视图（本月/本年），二级与列表「计算状态」对应：全部/待计算/计算中/已计算 */}
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            {(['本月', '本年'] as const).map((view) => (
              <span
                key={view}
                className={`view-tab ${selectedView === view ? 'active' : ''}`}
                onClick={() => {
                  setSelectedView(view)
                  setDocStatus('全部')
                  setCurrentPage(1)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <FileTextOutlined style={{ color: selectedView === view ? '#02b980' : '#666' }} />
                <span>{view}</span>
              </span>
            ))}
          </Space>
        </div>
        <div className="category-tabs">
          <Space size="middle">
            {(['全部', '待计算', '计算中', '已计算'] as const).map((status) => (
              <span
                key={status}
                className={`category-tab ${docStatus === status ? 'active' : ''}`}
                onClick={() => {
                  setDocStatus(status)
                  setCurrentPage(1)
                }}
                style={{ cursor: 'pointer' }}
              >
                {status} {docStatusCounts[status]}
              </span>
            ))}
          </Space>
        </div>
      </div>

      {/* 搜索和筛选：与列表字段对应 - 需求计算编号、库存查询时间、备注、创建人 */}
      <div className="search-filter-bar">
        <div className="search-filter-items">
          <label className="search-filter-item">
            <span className="search-filter-label">需求计算编号</span>
            <span className="search-filter-input-wrap">
              <Input
                value={calcNo}
                onChange={(e) => { setCalcNo(e.target.value); setCurrentPage(1) }}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">库存查询时间</span>
            <span className="search-filter-input-wrap">
              <DatePicker.RangePicker
                value={calcTimeRange ?? undefined}
                onChange={(dates) => {
                  setCalcTimeRange(dates ?? null)
                  setCurrentPage(1)
                }}
                size="small"
                style={{ width: '100%' }}
                allowClear
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">备注</span>
            <span className="search-filter-input-wrap">
              <Input
                value={remark}
                onChange={(e) => { setRemark(e.target.value); setCurrentPage(1) }}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">创建人</span>
            <span className="search-filter-input-wrap">
              <Input
                value={createBy}
                onChange={(e) => { setCreateBy(e.target.value); setCurrentPage(1) }}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
              />
            </span>
          </label>
        </div>
        <span className="search-filter-actions">
          <Button type="primary" icon={<SearchOutlined />} onClick={handleRefresh} size="small">
            查询
          </Button>
          <Button type="text" icon={<ReloadOutlined />} onClick={handleReset} title="重置" size="small" />
          <Button type="text" icon={<SettingOutlined />} title="字段配置" size="small" />
        </span>
      </div>

      {/* 数据表格操作工具栏（与需求计划布局一致：有选中时左侧批量操作 + 右侧取消选择） */}
      <div className="table-toolbar">
        <div className="toolbar-buttons">
          {selectedRowKeys.length > 0 ? (
            <>
              <div className="toolbar-batch-left">
                <span className="selected-count">
                  已选择 {selectedRowKeys.length} 条需求计算记录
                </span>
                <Popconfirm
                  title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
                  okText="删除"
                  okButtonProps={{ danger: true }}
                  cancelText="取消"
                  onConfirm={handleBatchDelete}
                >
                  <Button danger>
                    批量删除
                  </Button>
                </Popconfirm>
              </div>
              <Button type="text" className="toolbar-cancel-select" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </>
          ) : (
            <>
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
          dataSource={paginatedData}
          rowKey="rowKey"
          scroll={{ x: mainTableWidth || 1500, y: 'calc(100vh - 340px)' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: transformedMaterialData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 20)
            },
            onShowSizeChange: (_current, size) => {
              setCurrentPage(1)
              setPageSize(size)
            },
          }}
          size="small"
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            onChange: (selectedKeys) => {
              setSelectedRowKeys(selectedKeys)
            },
            onSelectAll: (selected) => {
              if (selected) {
                const allRowKeys = paginatedData.map(item => item.rowKey || '').filter(key => key)
                setSelectedRowKeys(allRowKeys)
              } else {
                setSelectedRowKeys([])
              }
            },
          }}
          summary={() => (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} />
                <Table.Summary.Cell index={1} colSpan={8} align="left">
                  合计：共 {transformedMaterialData.length} 条需求计算记录
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          onRow={() => ({
            style: { cursor: 'default' },
            onClick: undefined,
          })}
        />
      </Card>

      <Drawer
        title={
          detailRecord
            ? `需求计算详情 - XQJS-${detailRecord.materialCode || detailRecord.key}`
            : '需求计算详情'
        }
        open={detailVisible}
        width={960}
        onClose={() => setDetailVisible(false)}
        className="demand-calc-detail-drawer"
        destroyOnClose
        extra={
          <Button type="text" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        }
      >
        {renderDetailHeader()}
        <div className="demand-calc-detail-tabs">
          <Tabs
            defaultActiveKey="doc"
            items={[
              {
                key: 'doc',
                label: '计算单据',
                children: renderDemandDocTab(),
              },
              {
                key: 'records',
                label: '计算过程',
                children: renderDemandRecordTab(),
              },
            ]}
          />
        </div>
      </Drawer>
    </div>
  )
}

export default DemandCalculation
