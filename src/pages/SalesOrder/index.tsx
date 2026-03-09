import { useState, useMemo, useRef, useCallback } from 'react'
import { Card, Table, Button, Space, Input, Select, message } from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  ColumnHeightOutlined,
  SortAscendingOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ResizableTitle from '@/components/common/ResizableTitle'
import './index.css'

interface SalesOrderItem {
  key: string
  orderNo: string
  customerName: string
  orderDate: string
  deliveryDate: string
  status: string
  amount: number
}

const SalesOrder: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [orderNo, setOrderNo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [status, setStatus] = useState<string>('全部')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})

  const dataSource = useMemo<SalesOrderItem[]>(() => {
    return [
      {
        key: '1',
        orderNo: 'SO-202601-0001',
        customerName: '客户A',
        orderDate: '2026-01-25',
        deliveryDate: '2026-02-05',
        status: '已审核',
        amount: 150000,
      },
      {
        key: '2',
        orderNo: 'SO-202601-0002',
        customerName: '客户B',
        orderDate: '2026-01-26',
        deliveryDate: '2026-02-10',
        status: '待审核',
        amount: 98000,
      },
      {
        key: '3',
        orderNo: 'SO-202601-0003',
        customerName: '客户C',
        orderDate: '2026-01-27',
        deliveryDate: '2026-02-15',
        status: '关闭',
        amount: 65000,
      },
    ]
  }, [])

  // 仅按搜索栏（订单号、客户名称）筛选，用于二级分组数量统计
  const baseFiltered = useMemo(() => {
    return dataSource.filter((item) => {
      if (orderNo.trim() && !item.orderNo.includes(orderNo.trim())) return false
      if (customerName.trim() && !item.customerName.includes(customerName.trim())) return false
      return true
    })
  }, [dataSource, orderNo, customerName])

  // 二级分组各选项数量：全部 / 待审核 / 已审核 / 关闭
  const statusCounts = useMemo(() => {
    const all = baseFiltered.length
    const pending = baseFiltered.filter((item) => item.status === '待审核').length
    const approved = baseFiltered.filter((item) => item.status === '已审核').length
    const closed = baseFiltered.filter((item) => item.status === '关闭').length
    return { 全部: all, 待审核: pending, 已审核: approved, 关闭: closed }
  }, [baseFiltered])

  const filteredData = useMemo(() => {
    if (status === '全部') return baseFiltered
    return baseFiltered.filter((item) => item.status === status)
  }, [baseFiltered, status])

  const transformedData = useMemo(() => {
    return filteredData.map((item) => ({ ...item, rowKey: item.key }))
  }, [filteredData])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return transformedData.slice(start, end)
  }, [transformedData, currentPage, pageSize])

  const amountTotal = useMemo(() => {
    return transformedData.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  }, [transformedData])

  const handleMainResize = (key: string) => (_e: unknown, { size }: { size: { width: number } }) => {
    setMainColumnWidths((prev) => ({ ...prev, [key]: size.width }))
  }

  const getColumnWidth = (key: string | undefined, defaultWidth: number, widths: Record<string, number>) => {
    if (!key) return defaultWidth
    return widths[key] ?? defaultWidth
  }

  const baseMainColumns: ColumnsType<SalesOrderItem> = useMemo(() => {
    return [
      {
        title: '销售订单号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: getColumnWidth('orderNo', 180, mainColumnWidths),
        fixed: 'left',
      },
      {
        title: '客户名称',
        dataIndex: 'customerName',
        key: 'customerName',
        width: getColumnWidth('customerName', 160, mainColumnWidths),
      },
      {
        title: '订单日期',
        dataIndex: 'orderDate',
        key: 'orderDate',
        width: getColumnWidth('orderDate', 120, mainColumnWidths),
      },
      {
        title: '交货日期',
        dataIndex: 'deliveryDate',
        key: 'deliveryDate',
        width: getColumnWidth('deliveryDate', 120, mainColumnWidths),
      },
      {
        title: '订单状态',
        dataIndex: 'status',
        key: 'status',
        width: getColumnWidth('status', 100, mainColumnWidths),
      },
      {
        title: '订单金额',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        width: getColumnWidth('amount', 120, mainColumnWidths),
        render: (val: number) => val.toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
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
    setCustomerName('')
    setStatus('全部')
    setCurrentPage(1)
    message.success('已重置筛选条件')
  }

  const handleFieldSettings = () => {
    message.info('字段配置')
  }

  const handleBatchOperation = useCallback((operation: string) => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择要操作的订单')
      return
    }
    message.info(`${operation}，已选择 ${selectedRowKeys.length} 条订单`)
  }, [selectedRowKeys])

  return (
    <div className="sales-order-page">
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            <span
              className="view-tab active"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <FileTextOutlined style={{ color: '#02b980' }} />
              <span>全部订单视图</span>
            </span>
            <Button type="text" size="small" style={{ padding: '2px 8px' }}>
              <PlusOutlined />
            </Button>
          </Space>
        </div>
        <div className="category-tabs">
          <Space size="middle">
            {(['全部', '待审核', '已审核', '关闭'] as const).map((tab) => (
              <span
                key={tab}
                className={`category-tab ${status === tab ? 'active' : ''}`}
                onClick={() => {
                  setStatus(tab)
                  setCurrentPage(1)
                }}
                style={{ cursor: 'pointer' }}
              >
                {tab} {statusCounts[tab]}
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
            <span className="search-filter-label">客户名称</span>
            <span className="search-filter-input-wrap">
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="请输入"
                size="small"
                allowClear
                style={{ width: '100%' }}
              />
            </span>
          </label>
          <label className="search-filter-item">
            <span className="search-filter-label">订单状态</span>
            <span className="search-filter-select-wrap">
              <Select
                value={status}
                onChange={setStatus}
                size="small"
                style={{ width: '100%' }}
                options={[
                  { value: '全部', label: '全部' },
                  { value: '待审核', label: '待审核' },
                  { value: '已审核', label: '已审核' },
                  { value: '关闭', label: '关闭' },
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
                <span className="selected-count">已选择 {selectedRowKeys.length} 条订单</span>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleBatchOperation('批量下推生产')}
                >
                  批量下推生产
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
                onClick={() => message.info('新建销售订单')}
              >
                新建订单
              </Button>
              <span className="toolbar-separator" />
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
          scroll={{ x: mainTableWidth || 800, y: 'calc(100vh - 340px)' }}
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
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            onSelectAll: (selected) => {
              if (selected) {
                const allRowKeys = paginatedData.map((item) => item.rowKey || '').filter(Boolean)
                setSelectedRowKeys(allRowKeys)
              } else {
                setSelectedRowKeys([])
              }
            },
          }}
          summary={() => (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="left">
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {amountTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
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
    </div>
  )
}

export default SalesOrder
