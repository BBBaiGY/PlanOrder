import { useState, useMemo, useRef, useCallback } from 'react'
import { Card, Table, Space, Input, Select, Button, Dropdown, message } from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  SortAscendingOutlined,
  ColumnHeightOutlined,
  DownOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import ResizableTitle from '@/components/common/ResizableTitle'
import { ROUTES } from '@/constants/routes'
import DemandCalcDrawer from './DemandCalcDrawer'
import ExecutionProgressDrawer from './ExecutionProgressDrawer'
import './index.css'

const VIEW_OPTIONS = ['明细查看', 'BOM维护', '需求计算', '进度跟踪', '本年记录'] as const
const SECONDARY_OPTIONS_BY_VIEW: Record<(typeof VIEW_OPTIONS)[number], readonly string[]> = {
  明细查看: ['全部', '待审批', '进行中', '已结束', '已取消'],
  BOM维护: ['全部', '待维护', '已维护'],
  需求计算: ['全部', '未计算', '已计算'],
  进度跟踪: ['全部', '未发货', '部分发货', '已发完'],
  本年记录: ['全部', '进行中', '已完成', '有退货'],
}

interface SalesDetailItem {
  key: string
  orderNo: string
  lineNo: number
  productCode: string
  productName: string
  spec: string
  productBomStatus: string
  unit: string
  qty: number
  planQty: number
  demandCalcFlag: string
  lastCalcTime: string
  cumulativeCalcQty: number
  cumulativeDemandRef: number
  deliveredQty: number
  undeliveredQty: number
  detailStatus: '待审批' | '进行中' | '已结束' | '已取消'
  yearRecordStatus: '进行中' | '已完成' | '有退货'
}

const SalesDetail: React.FC = () => {
  const navigate = useNavigate()
  const [orderNo, setOrderNo] = useState('')
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [demandCalcFilter, setDemandCalcFilter] = useState<string>('全部')
  const [pendingCalcRefFilter, setPendingCalcRefFilter] = useState('')
  const [activeView, setActiveView] = useState<(typeof VIEW_OPTIONS)[number]>('明细查看')
  const [secondaryStatus, setSecondaryStatus] = useState<string>('全部')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [demandCalcOpen, setDemandCalcOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressRecord, setProgressRecord] = useState<SalesDetailItem | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})

  const [dataSource, setDataSource] = useState<SalesDetailItem[]>([
      {
        key: '1',
        orderNo: 'SO-202601-0001',
        lineNo: 1,
        productCode: 'CP0001',
        productName: '成品A',
        spec: '100*50*30mm',
        productBomStatus: '已维护',
        unit: '件',
        qty: 100,
        planQty: 95,
        demandCalcFlag: '已计算',
        lastCalcTime: '2026-03-18 10:30:00',
        cumulativeCalcQty: 120,
        cumulativeDemandRef: 118,
        deliveredQty: 40,
        undeliveredQty: 60,
        detailStatus: '进行中',
        yearRecordStatus: '进行中',
      },
      {
        key: '2',
        orderNo: 'SO-202601-0001',
        lineNo: 2,
        productCode: 'CP0002',
        productName: '成品B',
        spec: '120*60*40mm',
        productBomStatus: '已维护',
        unit: '件',
        qty: 80,
        planQty: 80,
        demandCalcFlag: '已计算',
        lastCalcTime: '2026-03-18 14:20:00',
        cumulativeCalcQty: 80,
        cumulativeDemandRef: 80,
        deliveredQty: 80,
        undeliveredQty: 0,
        detailStatus: '已结束',
        yearRecordStatus: '已完成',
      },
      {
        key: '3',
        orderNo: 'SO-202601-0002',
        lineNo: 1,
        productCode: 'CP0003',
        productName: '成品C',
        spec: '150*80*50mm',
        productBomStatus: '待维护',
        unit: '件',
        qty: 60,
        planQty: 0,
        demandCalcFlag: '未计算',
        lastCalcTime: '-',
        cumulativeCalcQty: 0,
        cumulativeDemandRef: 0,
        deliveredQty: 0,
        undeliveredQty: 60,
        detailStatus: '待审批',
        yearRecordStatus: '有退货',
      },
    ])

  // 仅按搜索栏（订单号、产品编号、产品名称）筛选，用于二级分组数量统计
  const baseFiltered = useMemo(() => {
    return dataSource.filter((item) => {
      if (orderNo.trim() && !item.orderNo.includes(orderNo.trim())) return false
      if (productCode.trim() && !item.productCode.includes(productCode.trim())) return false
      if (productName.trim() && !item.productName.includes(productName.trim())) return false
      if (demandCalcFilter !== '全部' && item.demandCalcFlag !== demandCalcFilter) return false
      if (pendingCalcRefFilter.trim() && String(item.cumulativeDemandRef) !== pendingCalcRefFilter.trim()) return false
      return true
    })
  }, [dataSource, orderNo, productCode, productName, demandCalcFilter, pendingCalcRefFilter])

  const currentSecondaryOptions = useMemo(() => SECONDARY_OPTIONS_BY_VIEW[activeView], [activeView])

  const matchesSecondaryFilter = useCallback(
    (item: SalesDetailItem, status: string) => {
      if (status === '全部') return true

      if (activeView === '明细查看') return item.detailStatus === status
      if (activeView === 'BOM维护') return item.productBomStatus === status
      if (activeView === '需求计算') return item.demandCalcFlag === status
      if (activeView === '进度跟踪') {
        if (status === '未发货') return item.deliveredQty === 0
        if (status === '部分发货') return item.deliveredQty > 0 && item.undeliveredQty > 0
        if (status === '已发完') return item.undeliveredQty === 0
        return true
      }
      if (activeView === '本年记录') return item.yearRecordStatus === status
      return true
    },
    [activeView],
  )

  const secondaryStatusCounts = useMemo(() => {
    return currentSecondaryOptions.reduce<Record<string, number>>((acc, status) => {
      if (status === '全部') {
        acc[status] = baseFiltered.length
        return acc
      }
      acc[status] = baseFiltered.filter((item) => matchesSecondaryFilter(item, status)).length
      return acc
    }, {})
  }, [baseFiltered, currentSecondaryOptions, matchesSecondaryFilter])

  const filteredData = useMemo(() => {
    return baseFiltered.filter((item) => matchesSecondaryFilter(item, secondaryStatus))
  }, [baseFiltered, matchesSecondaryFilter, secondaryStatus])

  const transformedData = useMemo(() => {
    return filteredData.map((item) => ({ ...item, rowKey: item.key }))
  }, [filteredData])

  const selectedSalesDetails = useMemo(() => {
    const keys = new Set(selectedRowKeys.map(String))
    return transformedData.filter((r) => keys.has(String(r.rowKey)))
  }, [selectedRowKeys, transformedData])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return transformedData.slice(start, end)
  }, [transformedData, currentPage, pageSize])

  const columnTotals = useMemo(() => {
    const qty = transformedData.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
    const deliveredQty = transformedData.reduce((sum, row) => sum + (Number(row.deliveredQty) || 0), 0)
    const undeliveredQty = transformedData.reduce((sum, row) => sum + (Number(row.undeliveredQty) || 0), 0)
    return { qty, deliveredQty, undeliveredQty }
  }, [transformedData])

  const handleMainResize = (key: string) => (_e: unknown, { size }: { size: { width: number } }) => {
    setMainColumnWidths((prev) => ({ ...prev, [key]: size.width }))
  }

  const getColumnWidth = (key: string | undefined, defaultWidth: number, widths: Record<string, number>) => {
    if (!key) return defaultWidth
    return widths[key] ?? defaultWidth
  }

  const formatDateOnly = (value?: string) => {
    if (!value || value === '-') return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toISOString().slice(0, 10)
  }

  const handleDirectProduction = useCallback((record: SalesDetailItem) => {
    message.success(`已发起直接生产：${record.orderNo}-${record.lineNo}`)
  }, [])

  const handleMoreAction = useCallback((action: string, record: SalesDetailItem) => {
    if (action === 'maintainBom') {
      message.info(`维护BOM：${record.productCode}`)
      return
    }
    if (action === 'queryProgress') {
      setProgressRecord(record)
      setProgressOpen(true)
      return
    }
    if (action === 'opLog') {
      message.info(`操作日志：${record.orderNo}-${record.lineNo}`)
      return
    }
    if (action === 'delete') {
      setDataSource((prev) => prev.filter((item) => item.key !== record.key))
      setSelectedRowKeys((prev) => prev.filter((key) => String(key) !== String(record.key)))
      message.success('删除成功')
    }
  }, [])

  const handleOpenSalesOrderDetail = useCallback((record: SalesDetailItem) => {
    const query = new URLSearchParams({ highlightOrderNo: record.orderNo })
    navigate(`${ROUTES.SALES_ORDER}?${query.toString()}`)
  }, [navigate])

  const baseMainColumns: ColumnsType<SalesDetailItem> = useMemo(() => {
    return [
      {
        title: '订单编号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: getColumnWidth('orderNo', 180, mainColumnWidths),
        fixed: 'left',
        render: (value: string, record: SalesDetailItem) => (
          <Button
            type="link"
            size="small"
            className="sales-detail-order-link"
            onClick={() => handleOpenSalesOrderDetail(record)}
          >
            {value}
          </Button>
        ),
      },
      {
        title: '行号',
        dataIndex: 'lineNo',
        key: 'lineNo',
        width: getColumnWidth('lineNo', 80, mainColumnWidths),
        align: 'right',
      },
      {
        title: '产品编号',
        dataIndex: 'productCode',
        key: 'productCode',
        width: getColumnWidth('productCode', 140, mainColumnWidths),
      },
      {
        title: '产品名称',
        dataIndex: 'productName',
        key: 'productName',
        width: getColumnWidth('productName', 160, mainColumnWidths),
      },
      {
        title: '规格',
        dataIndex: 'spec',
        key: 'spec',
        width: getColumnWidth('spec', 160, mainColumnWidths),
      },
      {
        title: '产品BOM状态',
        dataIndex: 'productBomStatus',
        key: 'productBomStatus',
        width: getColumnWidth('productBomStatus', 130, mainColumnWidths),
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: getColumnWidth('unit', 80, mainColumnWidths),
      },
      {
        title: '订单数量',
        dataIndex: 'qty',
        key: 'qty',
        align: 'right',
        width: getColumnWidth('qty', 120, mainColumnWidths),
      },
      {
        title: '需求计算标记',
        dataIndex: 'demandCalcFlag',
        key: 'demandCalcFlag',
        width: getColumnWidth('demandCalcFlag', 130, mainColumnWidths),
      },
      {
        title: '最后计算时间',
        dataIndex: 'lastCalcTime',
        key: 'lastCalcTime',
        width: getColumnWidth('lastCalcTime', 170, mainColumnWidths),
        render: (val: string) => formatDateOnly(val),
      },
      {
        title: '累计计算数量',
        dataIndex: 'cumulativeCalcQty',
        key: 'cumulativeCalcQty',
        align: 'right',
        width: getColumnWidth('cumulativeCalcQty', 130, mainColumnWidths),
      },
      {
        title: '待计算参考数量',
        dataIndex: 'cumulativeDemandRef',
        key: 'cumulativeDemandRef',
        align: 'right',
        width: getColumnWidth('cumulativeDemandRef', 140, mainColumnWidths),
      },
      {
        title: '发货数量',
        dataIndex: 'deliveredQty',
        key: 'deliveredQty',
        align: 'right',
        width: getColumnWidth('deliveredQty', 120, mainColumnWidths),
      },
      {
        title: '未清数量',
        dataIndex: 'undeliveredQty',
        key: 'undeliveredQty',
        align: 'right',
        width: getColumnWidth('undeliveredQty', 120, mainColumnWidths),
        render: (val: number) => (
          <span style={{ color: val > 0 ? '#ff4d4f' : '#333' }}>{val}</span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: getColumnWidth('action', 180, mainColumnWidths),
        render: (_: unknown, record: SalesDetailItem) => (
          <Space size={4}>
            <Button type="link" size="small" onClick={() => handleDirectProduction(record)}>
              直接生产
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'maintainBom', label: '维护BOM' },
                  { key: 'queryProgress', label: '查询执行进度' },
                  { key: 'opLog', label: '操作日志' },
                  { key: 'delete', label: '删除', danger: true },
                ],
                onClick: ({ key }) => handleMoreAction(String(key), record),
              }}
              trigger={['click']}
            >
              <Button type="link" size="small" onClick={(e) => e.stopPropagation()}>
                操作 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        ),
      },
    ]
  }, [mainColumnWidths, handleDirectProduction, handleMoreAction, handleOpenSalesOrderDetail])

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

  const summaryLayout = useMemo(() => {
    const columnKeys = mainColumns.map((col) => String(col.key ?? ''))
    const qtyIndex = columnKeys.indexOf('qty')
    const deliveredQtyIndex = columnKeys.indexOf('deliveredQty')
    const undeliveredQtyIndex = columnKeys.indexOf('undeliveredQty')
    const firstValueIndex = [qtyIndex, deliveredQtyIndex, undeliveredQtyIndex]
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0] ?? columnKeys.length

    return {
      labelColSpan: Math.max(firstValueIndex, 1),
      qtyIndex,
      deliveredQtyIndex,
      undeliveredQtyIndex,
    }
  }, [mainColumns])

  const handleQuery = () => {
    setCurrentPage(1)
    message.success('查询成功')
  }

  const handleReset = () => {
    setOrderNo('')
    setProductCode('')
    setProductName('')
    setDemandCalcFilter('全部')
    setPendingCalcRefFilter('')
    setSecondaryStatus('全部')
    setSelectedRowKeys([])
    setCurrentPage(1)
    message.success('已重置筛选条件')
  }

  const handleFieldSettings = useCallback(() => {
    message.info('字段配置')
  }, [])

  const handleBatchExport = useCallback(() => {
    const exportRows = selectedSalesDetails.length > 0 ? selectedSalesDetails : transformedData

    if (exportRows.length === 0) {
      message.warning('暂无可导出的销售明细数据')
      return
    }

    if (selectedSalesDetails.length > 0) {
      message.success(`已导出 ${exportRows.length} 条已选明细`)
      return
    }

    message.success(`已导出全部 ${exportRows.length} 条明细`)
  }, [selectedSalesDetails, transformedData])

  const handleBatchEdit = useCallback(() => {
    if (selectedSalesDetails.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    message.info(`批量修改 ${selectedSalesDetails.length} 条明细`)
  }, [selectedSalesDetails])

  const handleBatchDemandCalc = useCallback(() => {
    if (selectedSalesDetails.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    setDemandCalcOpen(true)
  }, [selectedSalesDetails])

  const handleBatchDirectProduction = useCallback(() => {
    if (selectedSalesDetails.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    message.success(`已发起 ${selectedSalesDetails.length} 条明细的直接生产`)
  }, [selectedSalesDetails])

  const handleBatchDelivery = useCallback(() => {
    if (selectedSalesDetails.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    message.success(`已发起 ${selectedSalesDetails.length} 条明细销售发货`)
  }, [selectedSalesDetails])

  const canBatchReturn = useMemo(() => {
    return selectedSalesDetails.some((item) => Number(item.deliveredQty) > 0)
  }, [selectedSalesDetails])

  const handleBatchReturn = useCallback(() => {
    if (selectedSalesDetails.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    if (!canBatchReturn) {
      message.warning('选中的明细中没有可退货记录（需已有发货数量）')
      return
    }
    message.info(`已发起 ${selectedSalesDetails.length} 条明细销售退货`)
  }, [canBatchReturn, selectedSalesDetails])

  const handleBatchDelete = useCallback(() => {
    if (selectedSalesDetails.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    const selectedKeySet = new Set(selectedSalesDetails.map((item) => item.key))
    setDataSource((prev) => prev.filter((item) => !selectedKeySet.has(item.key)))
    setSelectedRowKeys([])
    message.success(`已删除 ${selectedSalesDetails.length} 条明细`)
  }, [selectedSalesDetails])

  return (
    <div className="sales-detail-page">
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            {VIEW_OPTIONS.map((view) => (
              <span
                key={view}
                className={`view-tab ${activeView === view ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => {
                  setActiveView(view)
                  setSecondaryStatus('全部')
                  setCurrentPage(1)
                }}
              >
                <FileTextOutlined style={{ color: activeView === view ? '#02b980' : undefined }} />
                <span>{view}</span>
              </span>
            ))}
          </Space>
        </div>
        <div className="category-tabs">
          <Space size="middle">
            {currentSecondaryOptions.map((tab) => (
              <span
                key={tab}
                className={`category-tab ${secondaryStatus === tab ? 'active' : ''}`}
                onClick={() => {
                  setSecondaryStatus(tab)
                  setCurrentPage(1)
                }}
                style={{ cursor: 'pointer' }}
              >
                {tab} {secondaryStatusCounts[tab] ?? 0}
              </span>
            ))}
          </Space>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-filter-items">
          <label className="search-filter-item">
            <span className="search-filter-label">订单号</span>
            <span className="search-filter-input-wrap">
              <Input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
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
          <label className="search-filter-item">
            <span className="search-filter-label">需求计算标记</span>
            <span className="search-filter-select-wrap">
              <Select
                value={demandCalcFilter}
                onChange={setDemandCalcFilter}
                size="small"
                style={{ width: '100%' }}
                options={[
                  { value: '全部', label: '全部' },
                  { value: '未计算', label: '未计算' },
                  { value: '已计算', label: '已计算' },
                ]}
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">待计算参考数量</span>
            <span className="search-filter-input-wrap">
              <Input
                value={pendingCalcRefFilter}
                onChange={(e) => setPendingCalcRefFilter(e.target.value)}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
              />
            </span>
          </label>
        </div>
        <span className="search-filter-actions">
          <Button type="primary" icon={<SearchOutlined />} size="small" onClick={handleQuery}>
            查询
          </Button>
          <Button type="text" icon={<ReloadOutlined />} onClick={handleReset} title="重置" size="small" />
          <Button type="text" icon={<SettingOutlined />} title="字段配置" size="small" />
        </span>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-buttons">
          {selectedRowKeys.length > 0 ? (
            <>
              <div className="toolbar-batch-left">
                <span className="selected-count">已选择 {selectedRowKeys.length} 条明细</span>
                <Button onClick={handleBatchExport}>导出</Button>
                <Button onClick={handleBatchEdit}>修改</Button>
                <Button onClick={handleBatchDemandCalc}>
                  计算需求
                </Button>
                <Button onClick={handleBatchDirectProduction}>直接生产</Button>
                <Space.Compact className="toolbar-delivery-group">
                  <Button onClick={handleBatchDelivery}>销售发货</Button>
                  <Dropdown
                    menu={{
                      items: [{ key: 'salesReturn', label: '销售退货', disabled: !canBatchReturn }],
                      onClick: ({ key }) => {
                        if (key === 'salesReturn' && canBatchReturn) handleBatchReturn()
                      },
                    }}
                    trigger={['click']}
                  >
                    <Button icon={<DownOutlined />} aria-label="销售发货更多操作" title="更多发货操作" />
                  </Dropdown>
                </Space.Compact>
                <Button danger onClick={handleBatchDelete}>
                  删除
                </Button>
              </div>
              <Button type="text" className="toolbar-cancel-select" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleBatchExport}>导出</Button>
              <Button type="text" icon={<SettingOutlined />} onClick={handleFieldSettings}>
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
          scroll={{ x: mainTableWidth || 1100, y: 'calc(100vh - 340px)' }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            onSelectAll: (selected) => {
              if (selected) {
                const allRowKeys = paginatedData.map((item) => item.rowKey || '').filter((k) => k)
                setSelectedRowKeys(allRowKeys)
              } else {
                setSelectedRowKeys([])
              }
            },
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total: transformedData.length,
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
          summary={() => (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={summaryLayout.labelColSpan} align="left">
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={summaryLayout.qtyIndex} align="right">
                  {columnTotals.qty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={summaryLayout.deliveredQtyIndex} align="right">
                  {columnTotals.deliveredQty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={summaryLayout.undeliveredQtyIndex} align="right">
                  {columnTotals.undeliveredQty}
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

      <DemandCalcDrawer
        open={demandCalcOpen}
        salesDetails={selectedSalesDetails}
        onClose={() => setDemandCalcOpen(false)}
      />
      <ExecutionProgressDrawer
        open={progressOpen}
        record={progressRecord}
        onClose={() => {
          setProgressOpen(false)
          setProgressRecord(null)
        }}
      />
    </div>
  )
}

export default SalesDetail
