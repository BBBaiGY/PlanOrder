import { useState, useMemo, useRef, useCallback } from 'react'
import { Card, Table, Space, Input, Select, Button, message } from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  SortAscendingOutlined,
  ColumnHeightOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ResizableTitle from '@/components/common/ResizableTitle'
import DemandCalcDrawer from './DemandCalcDrawer'
import './index.css'

interface SalesDetailItem {
  key: string
  orderNo: string
  lineNo: number
  productCode: string
  productName: string
  spec: string
  unit: string
  qty: number
  deliveredQty: number
  undeliveredQty: number
}

const SalesDetail: React.FC = () => {
  const [orderNo, setOrderNo] = useState('')
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState<string>('全部')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [demandCalcOpen, setDemandCalcOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})

  const dataSource = useMemo<SalesDetailItem[]>(() => {
    return [
      {
        key: '1',
        orderNo: 'SO-202601-0001',
        lineNo: 1,
        productCode: 'CP0001',
        productName: '成品A',
        spec: '100*50*30mm',
        unit: '件',
        qty: 100,
        deliveredQty: 40,
        undeliveredQty: 60,
      },
      {
        key: '2',
        orderNo: 'SO-202601-0001',
        lineNo: 2,
        productCode: 'CP0002',
        productName: '成品B',
        spec: '120*60*40mm',
        unit: '件',
        qty: 80,
        deliveredQty: 80,
        undeliveredQty: 0,
      },
      {
        key: '3',
        orderNo: 'SO-202601-0002',
        lineNo: 1,
        productCode: 'CP0003',
        productName: '成品C',
        spec: '150*80*50mm',
        unit: '件',
        qty: 60,
        deliveredQty: 0,
        undeliveredQty: 60,
      },
    ]
  }, [])

  // 仅按搜索栏（订单号、产品编号、产品名称）筛选，用于二级分组数量统计
  const baseFiltered = useMemo(() => {
    return dataSource.filter((item) => {
      if (orderNo.trim() && !item.orderNo.includes(orderNo.trim())) return false
      if (productCode.trim() && !item.productCode.includes(productCode.trim())) return false
      if (productName.trim() && !item.productName.includes(productName.trim())) return false
      return true
    })
  }, [dataSource, orderNo, productCode, productName])

  // 二级分组各选项数量：全部 / 未发货 / 部分发货 / 已发完
  const deliveryStatusCounts = useMemo(() => {
    const all = baseFiltered.length
    const notDelivered = baseFiltered.filter((item) => item.deliveredQty === 0).length
    const partial = baseFiltered.filter((item) => item.deliveredQty > 0 && item.undeliveredQty > 0).length
    const completed = baseFiltered.filter((item) => item.undeliveredQty === 0).length
    return { 全部: all, 未发货: notDelivered, 部分发货: partial, 已发完: completed }
  }, [baseFiltered])

  const filteredData = useMemo(() => {
    if (deliveryStatus === '全部') return baseFiltered
    if (deliveryStatus === '未发货') return baseFiltered.filter((item) => item.deliveredQty === 0)
    if (deliveryStatus === '部分发货') return baseFiltered.filter((item) => item.deliveredQty > 0 && item.undeliveredQty > 0)
    if (deliveryStatus === '已发完') return baseFiltered.filter((item) => item.undeliveredQty === 0)
    return baseFiltered
  }, [baseFiltered, deliveryStatus])

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

  const baseMainColumns: ColumnsType<SalesDetailItem> = useMemo(() => {
    return [
      {
        title: '销售订单号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: getColumnWidth('orderNo', 180, mainColumnWidths),
        fixed: 'left',
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
        title: '已发货数量',
        dataIndex: 'deliveredQty',
        key: 'deliveredQty',
        align: 'right',
        width: getColumnWidth('deliveredQty', 120, mainColumnWidths),
      },
      {
        title: '未发货数量',
        dataIndex: 'undeliveredQty',
        key: 'undeliveredQty',
        align: 'right',
        width: getColumnWidth('undeliveredQty', 120, mainColumnWidths),
        render: (val: number) => (
          <span style={{ color: val > 0 ? '#ff4d4f' : '#333' }}>{val}</span>
        ),
      },
    ]
  }, [mainColumnWidths])

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

  const handleQuery = () => {
    setCurrentPage(1)
    message.success('查询成功')
  }

  const handleReset = () => {
    setOrderNo('')
    setProductCode('')
    setProductName('')
    setDeliveryStatus('全部')
    setSelectedRowKeys([])
    setCurrentPage(1)
    message.success('已重置筛选条件')
  }

  const handleFieldSettings = useCallback(() => {
    message.info('字段配置')
  }, [])

  return (
    <div className="sales-detail-page">
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            <span
              className="view-tab active"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <FileTextOutlined style={{ color: '#02b980' }} />
              <span>销售明细视图</span>
            </span>
          </Space>
        </div>
        <div className="category-tabs">
          <Space size="middle">
            {(['全部', '未发货', '部分发货', '已发完'] as const).map((tab) => (
              <span
                key={tab}
                className={`category-tab ${deliveryStatus === tab ? 'active' : ''}`}
                onClick={() => {
                  setDeliveryStatus(tab)
                  setCurrentPage(1)
                }}
                style={{ cursor: 'pointer' }}
              >
                {tab} {deliveryStatusCounts[tab]}
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
            <span className="search-filter-label">发货状态</span>
            <span className="search-filter-select-wrap">
              <Select
                value={deliveryStatus}
                onChange={setDeliveryStatus}
                size="small"
                style={{ width: '100%' }}
                options={[
                  { value: '全部', label: '全部' },
                  { value: '未发货', label: '未发货' },
                  { value: '部分发货', label: '部分发货' },
                  { value: '已发完', label: '已发完' },
                ]}
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
                <Button
                  onClick={() => {
                    if (selectedSalesDetails.length === 0) {
                      message.warning('请先选择销售明细')
                      return
                    }
                    setDemandCalcOpen(true)
                  }}
                >
                  计算需求
                </Button>
              </div>
              <Button type="text" className="toolbar-cancel-select" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </>
          ) : (
            <>
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
                <Table.Summary.Cell index={0} colSpan={6} align="left">
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {columnTotals.qty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  {columnTotals.deliveredQty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
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
    </div>
  )
}

export default SalesDetail
