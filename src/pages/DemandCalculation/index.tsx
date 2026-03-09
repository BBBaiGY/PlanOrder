import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Input,
  message,
} from 'antd'
import {
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined,
  ColumnHeightOutlined,
  SortAscendingOutlined,
  SearchOutlined,
  FileTextOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { MaterialItem } from '@/types/supply-demand'
import ResizableTitle from '@/components/common/ResizableTitle'
import './index.css'

const DemandCalculation: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [supplyDemandStatus, setSupplyDemandStatus] = useState<string>('全部') // 二级 Tab：全部/缺料/充足
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [selectedView, setSelectedView] = useState<string>('全部')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  
  // 列宽状态管理
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})
  

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

  // 一级筛选：全部视图（需求计算暂无采购/生产/委外视图，保持与需求计划结构一致）
  const filteredByView = useMemo(() => {
    if (selectedView === '全部') return materialData
    return materialData
  }, [materialData, selectedView])

  // 二级筛选 + 搜索栏：按供需情况（全部/缺料/充足）、产品编号、产品名称
  const filteredMaterialData = useMemo(() => {
    let data = filteredByView
    if (supplyDemandStatus === '缺料') data = data.filter((item) => (item.shortageQty || 0) > 0)
    else if (supplyDemandStatus === '充足') data = data.filter((item) => (item.shortageQty || 0) === 0)
    if (productCode.trim()) data = data.filter((item) => item.materialCode?.includes(productCode.trim()))
    if (productName.trim()) data = data.filter((item) => item.materialName?.includes(productName.trim()))
    return data
  }, [filteredByView, supplyDemandStatus, productCode, productName])

  // 将物料数据转换为带 rowKey 的列表格式
  const transformedMaterialData = useMemo(() => {
    return filteredMaterialData.map((material) => ({
      ...material,
      rowKey: material.key,
    }))
  }, [filteredMaterialData])

  // 二级 Tab 各选项数量（全部/缺料/充足）
  const supplyDemandCounts = useMemo(() => {
    const all = filteredByView.length
    const shortage = filteredByView.filter((item) => (item.shortageQty || 0) > 0).length
    const sufficient = filteredByView.filter((item) => (item.shortageQty || 0) === 0).length
    return { 全部: all, 缺料: shortage, 充足: sufficient }
  }, [filteredByView])

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return transformedMaterialData.slice(start, end)
  }, [transformedMaterialData, currentPage, pageSize])

  // 安全库存、即时库存、缺料数量列合计（基于当前筛选后的全部数据）
  const columnTotals = useMemo(() => {
    const safetyStock = transformedMaterialData.reduce((sum, row) => sum + (Number(row.safetyStock) || 0), 0)
    const currentStock = transformedMaterialData.reduce((sum, row) => sum + (Number(row.currentStock) || 0), 0)
    const shortageQty = transformedMaterialData.reduce((sum, row) => sum + (Number(row.shortageQty) || 0), 0)
    return { safetyStock, currentStock, shortageQty }
  }, [transformedMaterialData])


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

  // 基础列定义
  const baseMainColumns: ColumnsType<MaterialItem> = useMemo(() => {
    return [
      {
        title: '产品编号',
        dataIndex: 'materialCode',
        key: 'materialCode',
        width: getColumnWidth('materialCode', 120, mainColumnWidths),
        fixed: 'left',
      },
      {
        title: '产品名称',
        dataIndex: 'materialName',
        key: 'materialName',
        width: getColumnWidth('materialName', 150, mainColumnWidths),
        fixed: 'left',
      },
      {
        title: '产品规格',
        dataIndex: 'specification',
        key: 'specification',
        width: getColumnWidth('specification', 120, mainColumnWidths),
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: getColumnWidth('unit', 100, mainColumnWidths),
      },
      {
        title: '安全库存',
        dataIndex: 'safetyStock',
        key: 'safetyStock',
        width: getColumnWidth('safetyStock', 100, mainColumnWidths),
        align: 'right',
      },
      {
        title: '即时库存',
        dataIndex: 'currentStock',
        key: 'currentStock',
        width: getColumnWidth('currentStock', 100, mainColumnWidths),
        align: 'right',
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
      },
      {
        title: '默认供应商',
        dataIndex: 'supplier',
        key: 'supplier',
        width: getColumnWidth('supplier', 120, mainColumnWidths),
      },
      {
        title: '汇总',
        key: 'total',
        align: 'right',
        width: getColumnWidth('total', 100, mainColumnWidths),
        render: (_text, record: any) => {
          const lastBalance = record.timeData && record.timeData.length > 0 
            ? record.timeData[record.timeData.length - 1]?.balance || 0
            : 0
          const isNegative = lastBalance < 0
          return <span style={{ color: isNegative ? '#ff4d4f' : '#333' }}>{lastBalance}</span>
        },
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
    setSupplyDemandStatus('全部')
    setProductCode('')
    setProductName('')
    setCurrentPage(1)
    message.success('已重置筛选条件')
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

  // 计算选中的物料数量
  const selectedMaterialCount = useMemo(() => {
    return selectedRowKeys.length
  }, [selectedRowKeys])

  // 批量操作处理
  const handleBatchOperation = useCallback((operation: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的行')
      return
    }
    message.info(`${operation}，已选择 ${selectedRowKeys.length} 个物料`)
    // 这里可以添加实际的批量操作逻辑
  }, [selectedRowKeys])

  return (
    <div className="demand-calculation">
      {/* 已移除明细查看功能 - 单行数据显示 */}
      {/* 产品分类导航和筛选：一级全部视图，二级全部/缺料/充足（带数量） */}
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            <span
              className={`view-tab ${selectedView === '全部' ? 'active' : ''}`}
              onClick={() => {
                setSelectedView('全部')
                setSupplyDemandStatus('全部')
                setCurrentPage(1)
              }}
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
            {(['全部', '缺料', '充足'] as const).map((status) => (
              <span
                key={status}
                className={`category-tab ${supplyDemandStatus === status ? 'active' : ''}`}
                onClick={() => {
                  setSupplyDemandStatus(status)
                  setCurrentPage(1)
                }}
                style={{ cursor: 'pointer' }}
              >
                {status} {supplyDemandCounts[status]}
              </span>
            ))}
          </Space>
        </div>
      </div>

      {/* 搜索和筛选：供需情况、产品编号、产品名称（与需求计划一致的 label 结构） */}
      <div className="search-filter-bar">
        <div className="search-filter-items">
          <label className="search-filter-item">
            <span className="search-filter-label">供需情况</span>
            <span className="search-filter-select-wrap">
              <Select
                value={supplyDemandStatus}
                onChange={(v) => {
                  setSupplyDemandStatus(v)
                  setCurrentPage(1)
                }}
                size="small"
                style={{ width: '100%' }}
                options={[
                  { value: '全部', label: '全部' },
                  { value: '缺料', label: '缺料' },
                  { value: '充足', label: '充足' },
                ]}
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">产品编号</span>
            <span className="search-filter-input-wrap">
              <Input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">产品名称</span>
            <span className="search-filter-input-wrap">
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
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
                  已选择 {selectedMaterialCount} 个物料
                </span>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleBatchOperation('批量缺料下发')}
                >
                  批量缺料下发
                </Button>
              </div>
              <Button type="text" className="toolbar-cancel-select" onClick={() => setSelectedRowKeys([])}>
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
                <Table.Summary.Cell index={1} colSpan={3} align="left">
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  {columnTotals.safetyStock}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {columnTotals.currentStock}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {columnTotals.shortageQty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={2} />
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
    </div>
  )
}

export default DemandCalculation
