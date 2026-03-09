import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Input,
  message,
  Dropdown,
} from 'antd'
import {
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined,
  ColumnHeightOutlined,
  SortAscendingOutlined,
  SearchOutlined,
  FileTextOutlined,
  DownOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PlanOrderItem } from '@/types/supply-demand'
import ResizableTitle from '@/components/common/ResizableTitle'
import './index.css'

// 审批状态高亮：已审批-绿、待审批-橙
const getApprovalStatusStyle = (status: string) => {
  const map: Record<string, { color: string; background: string }> = {
    已审批: { color: '#389e0d', background: '#f6ffed' },
    待审批: { color: '#d46b08', background: '#fff7e6' },
  }
  return map[status] || { color: '#595959', background: '#fafafa' }
}

// 下发状态高亮：已下发-绿、未下发-灰
const getReleaseStatusStyle = (status: string) => {
  const map: Record<string, { color: string; background: string }> = {
    已下发: { color: '#389e0d', background: '#f6ffed' },
    未下发: { color: '#8c8c8c', background: '#f5f5f5' },
  }
  return map[status] || { color: '#595959', background: '#fafafa' }
}

const PlanOrder: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [planNo, setPlanNo] = useState('')
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('全部')
  const [selectedView, setSelectedView] = useState<string>('全部')
  const [selectedReleaseType, setSelectedReleaseType] = useState<string>('全部')   // 全部视图下：下发类型（全部/生产工单/采购订单/委外订单）
  const [selectedReleaseStatus, setSelectedReleaseStatus] = useState<string>('全部') // 采购/生产/委外视图下：下发状态（全部/已下发/未下发）
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const mainTableCardRef = useRef<HTMLDivElement>(null)
  
  // 列宽状态管理
  const [mainColumnWidths, setMainColumnWidths] = useState<Record<string, number>>({})
  

  // 模拟需求计划数据
  const planOrderData = useMemo<PlanOrderItem[]>(() => {
    return [
      {
        key: '1',
        planNo: 'XQJH202601001',
        productCode: 'BB00001',
        productName: '成品A',
        specification: '100*50*30mm',
        suggestedQty: 100,
        planQty: 100,
        unit: '件',
        planStartDate: '2026-01-25',
        planEndDate: '2026-02-10',
        approvalStatus: '已审批',
        releaseStatus: '已下发',
        releaseType: '采购',
        supplier: '供应商A',
        calcRecord: 'MRP-20260125-001',
        sourceDocType: '销售订单',
        sourceDocNo: 'XSDD202601001',
        sourceDocDetail: '行号1',
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
        productCode: 'BB00002',
        productName: '成品B',
        specification: '120*60*40mm',
        suggestedQty: 80,
        planQty: 80,
        unit: '件',
        planStartDate: '2026-01-26',
        planEndDate: '2026-02-12',
        approvalStatus: '待审批',
        releaseStatus: '未下发',
        releaseType: '自制',
        supplier: '供应商B',
        calcRecord: 'MRP-20260126-002',
        sourceDocType: '销售订单',
        sourceDocNo: 'XSDD202601002',
        sourceDocDetail: '行号2',
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
        productCode: 'BB00003',
        productName: '半成品01',
      specification: '80*40*20mm',
      suggestedQty: 385,
      planQty: 400,
      unit: '件',
      planStartDate: '2026-01-25',
      planEndDate: '2026-01-30',
      approvalStatus: '已审批',
      releaseStatus: '已下发',
      releaseType: '委外',
      supplier: '供应商C',
      calcRecord: 'MRP-20260125-003',
      sourceDocType: '生产工单',
      sourceDocNo: 'SCGD202601001',
      sourceDocDetail: '',
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
      productCode: 'BB00004',
      productName: '半成品02',
      specification: '90*45*25mm',
      suggestedQty: 50,
      planQty: 50,
      unit: '件',
      planStartDate: '2026-01-27',
      planEndDate: '2026-02-05',
      approvalStatus: '待审批',
      releaseStatus: '未下发',
      releaseType: '采购',
      supplier: '供应商D',
      calcRecord: 'MRP-20260127-004',
      sourceDocType: '生产工单',
      sourceDocNo: 'SCGD202601002',
      sourceDocDetail: '',
      createBy: '张三',
      createTime: '2026-01-27 09:15:00',
      updateBy: '李四',
      updateTime: '2026-01-27 11:20:00',
      approver: '王五',
      approvalTime: '2026-01-27 10:30:00',
    },
    {
      key: '5',
      planNo: 'XQJH202601005',
      productCode: 'BB00005',
      productName: '原材料01',
      specification: 'Q235钢材',
      suggestedQty: 200,
      planQty: 200,
      unit: 'kg',
      planStartDate: '2026-01-28',
      planEndDate: '2026-02-15',
      approvalStatus: '已审批',
      releaseStatus: '未下发',
      releaseType: '采购',
      supplier: '供应商E',
      calcRecord: 'MRP-20260128-005',
      sourceDocType: '销售订单',
      sourceDocNo: 'XSDD202601003',
      sourceDocDetail: '行号3',
      createBy: '李四',
      createTime: '2026-01-28 14:00:00',
      updateBy: '李四',
      updateTime: '2026-01-28 14:00:00',
      approver: '王五',
      approvalTime: '2026-01-28 15:00:00',
      },
    ]
  }, [])

  // 一级筛选：全部 / 采购 / 生产 / 委外（按下发类型）
  const filteredByView = useMemo(() => {
    if (selectedView === '全部') return planOrderData
    const typeMap: Record<string, string> = { 采购: '采购', 生产: '自制', 委外: '委外' }
    const releaseType = typeMap[selectedView]
    return releaseType ? planOrderData.filter((item) => item.releaseType === releaseType) : planOrderData
  }, [planOrderData, selectedView])

  // 二级筛选 + 搜索栏核心字段：全部视图按下发类型，采购/生产/委外视图按下发状态；再按计划编号、产品编号、产品名称、审批状态筛选
  const filteredPlanOrderData = useMemo(() => {
    let data: PlanOrderItem[]
    if (selectedView === '全部') {
      if (selectedReleaseType === '全部') data = planOrderData
      else {
        const typeMap: Record<string, string> = { 生产工单: '自制', 采购订单: '采购', 委外订单: '委外' }
        const releaseType = typeMap[selectedReleaseType]
        data = releaseType ? planOrderData.filter((item) => item.releaseType === releaseType) : planOrderData
      }
    } else {
      data = selectedReleaseStatus === '全部' ? filteredByView : filteredByView.filter((item) => item.releaseStatus === selectedReleaseStatus)
    }
    if (planNo.trim()) data = data.filter((item) => item.planNo.includes(planNo.trim()))
    if (productCode.trim()) data = data.filter((item) => item.productCode.includes(productCode.trim()))
    if (productName.trim()) data = data.filter((item) => item.productName.includes(productName.trim()))
    if (approvalStatusFilter !== '全部') data = data.filter((item) => item.approvalStatus === approvalStatusFilter)
    return data
  }, [planOrderData, selectedView, selectedReleaseType, filteredByView, selectedReleaseStatus, planNo, productCode, productName, approvalStatusFilter])

  // 将计划数据转换为带 rowKey 的列表格式
  const transformedPlanOrderData = useMemo(() => {
    return filteredPlanOrderData.map((item) => ({
      ...item,
      rowKey: item.key,
    }))
  }, [filteredPlanOrderData])

  // 全部视图下：下发类型各选项数量（全部/生产工单/采购订单/委外订单）
  const releaseTypeCounts = useMemo(() => {
    const all = planOrderData.length
    const productionOrder = planOrderData.filter((item) => item.releaseType === '自制').length
    const purchaseOrder = planOrderData.filter((item) => item.releaseType === '采购').length
    const outsourcingOrder = planOrderData.filter((item) => item.releaseType === '委外').length
    return { 全部: all, 生产工单: productionOrder, 采购订单: purchaseOrder, 委外订单: outsourcingOrder }
  }, [planOrderData])

  // 采购/生产/委外视图下：下发状态各选项数量（全部/已下发/未下发）
  const releaseStatusCounts = useMemo(() => {
    const all = filteredByView.length
    const released = filteredByView.filter((item) => item.releaseStatus === '已下发').length
    const notReleased = filteredByView.filter((item) => item.releaseStatus === '未下发').length
    return { 全部: all, 已下发: released, 未下发: notReleased }
  }, [filteredByView])

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return transformedPlanOrderData.slice(start, end)
  }, [transformedPlanOrderData, currentPage, pageSize])

  // 建议数量、计划数量列合计（基于当前筛选后的全部数据）
  const columnTotals = useMemo(() => {
    const suggestedQty = transformedPlanOrderData.reduce((sum, row) => sum + (Number(row.suggestedQty) || 0), 0)
    const planQty = transformedPlanOrderData.reduce((sum, row) => sum + (Number(row.planQty) || 0), 0)
    return { suggestedQty, planQty }
  }, [transformedPlanOrderData])


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

  // 编号字段点击（计划编号、来源单据等，不含产品编号）
  const handleNumberFieldClick = useCallback((field: string, record: PlanOrderItem) => {
    const value = record[field]
    if (!value) return
    if (field === 'planNo') message.info(`查看计划：${value}`)
    else if (field === 'sourceDocNo') message.info(`查看来源单据：${value}`)
    else if (field === 'calcRecord') message.info(`查看需求计算记录：${value}`)
    // 可在此接入详情页、抽屉或路由跳转
  }, [])

  // 基础列定义：计划编号、产品编号、产品名称、产品规格、建议数量、计划数量、单位、计划开始日期、计划完成日期、审批状态、下发状态、下发类型、供应商、需求计算记录、来源单据类型、来源单据、来源单据明细、创建人、创建时间、更新人、更新时间、审批人、审批时间
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
            <span
              className="plan-order-number-link"
              onClick={(e) => {
                e.stopPropagation()
                handleNumberFieldClick('planNo', record)
              }}
            >
              {text}
            </span>
          ) : null,
      },
      { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: getColumnWidth('productCode', 100, mainColumnWidths), fixed: 'left' },
      { title: '产品名称', dataIndex: 'productName', key: 'productName', width: getColumnWidth('productName', 150, mainColumnWidths) },
      { title: '产品规格', dataIndex: 'specification', key: 'specification', width: getColumnWidth('specification', 140, mainColumnWidths) },
      { title: '建议数量', dataIndex: 'suggestedQty', key: 'suggestedQty', width: getColumnWidth('suggestedQty', 95, mainColumnWidths), align: 'right' as const },
      { title: '计划数量', dataIndex: 'planQty', key: 'planQty', width: getColumnWidth('planQty', 95, mainColumnWidths), align: 'right' as const },
      { title: '单位', dataIndex: 'unit', key: 'unit', width: getColumnWidth('unit', 56, mainColumnWidths) },
      { title: '计划开始日期', dataIndex: 'planStartDate', key: 'planStartDate', width: getColumnWidth('planStartDate', 118, mainColumnWidths) },
      { title: '计划完成日期', dataIndex: 'planEndDate', key: 'planEndDate', width: getColumnWidth('planEndDate', 118, mainColumnWidths) },
      {
        title: '审批状态',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: getColumnWidth('approvalStatus', 96, mainColumnWidths),
        render: (text: string) => {
          const style = getApprovalStatusStyle(text)
          return text ? (
            <span style={{ color: style.color, background: style.background, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
              {text}
            </span>
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
            <span style={{ color: style.color, background: style.background, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
              {text}
            </span>
          ) : null
        },
      },
      { title: '下发类型', dataIndex: 'releaseType', key: 'releaseType', width: getColumnWidth('releaseType', 88, mainColumnWidths) },
      { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: getColumnWidth('supplier', 100, mainColumnWidths) },
      {
        title: '需求计算记录',
        dataIndex: 'calcRecord',
        key: 'calcRecord',
        width: getColumnWidth('calcRecord', 168, mainColumnWidths),
        render: (text: string, record: PlanOrderItem) =>
          text ? (
            <span
              className="plan-order-number-link"
              onClick={(e) => {
                e.stopPropagation()
                handleNumberFieldClick('calcRecord', record)
              }}
            >
              {text}
            </span>
          ) : null,
      },
      { title: '来源单据类型', dataIndex: 'sourceDocType', key: 'sourceDocType', width: getColumnWidth('sourceDocType', 100, mainColumnWidths) },
      {
        title: '来源单据',
        dataIndex: 'sourceDocNo',
        key: 'sourceDocNo',
        width: getColumnWidth('sourceDocNo', 118, mainColumnWidths),
        render: (text: string, record: PlanOrderItem) =>
          text ? (
            <span
              className="plan-order-number-link"
              onClick={(e) => {
                e.stopPropagation()
                handleNumberFieldClick('sourceDocNo', record)
              }}
            >
              {text}
            </span>
          ) : null,
      },
      { title: '来源单据明细', dataIndex: 'sourceDocDetail', key: 'sourceDocDetail', width: getColumnWidth('sourceDocDetail', 88, mainColumnWidths) },
      { title: '创建人', dataIndex: 'createBy', key: 'createBy', width: getColumnWidth('createBy', 80, mainColumnWidths) },
      { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: getColumnWidth('createTime', 172, mainColumnWidths) },
      { title: '更新人', dataIndex: 'updateBy', key: 'updateBy', width: getColumnWidth('updateBy', 80, mainColumnWidths) },
      { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: getColumnWidth('updateTime', 172, mainColumnWidths) },
      { title: '审批人', dataIndex: 'approver', key: 'approver', width: getColumnWidth('approver', 80, mainColumnWidths) },
      { title: '审批时间', dataIndex: 'approvalTime', key: 'approvalTime', width: getColumnWidth('approvalTime', 172, mainColumnWidths) },
    ]
  }, [mainColumnWidths, handleNumberFieldClick])

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
    setPlanNo('')
    setProductCode('')
    setProductName('')
    setApprovalStatusFilter('全部')
    setCurrentPage(1)
    message.success('已重置筛选条件')
  }

  const handleFieldSettings = () => {
    message.info('字段配置')
  }

  // 计算选中的计划数量
  const selectedMaterialCount = useMemo(() => {
    return selectedRowKeys.length
  }, [selectedRowKeys])

  // 批量操作处理
  const handleBatchOperation = useCallback((operation: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的行')
      return
    }
    message.info(`${operation}，已选择 ${selectedRowKeys.length} 条计划`)
    // 这里可以添加实际的批量操作逻辑
  }, [selectedRowKeys])

  return (
    <div className="plan-order">
      {/* 已移除明细查看功能 - 单行数据显示 */}
      {/* 产品分类导航和筛选 */}
      <div className="category-filter-bar">
        <div className="view-tabs">
          <Space size="middle">
            {(['全部', '采购', '生产', '委外'] as const).map((view) => (
              <span
                key={view}
                className={`view-tab ${selectedView === view ? 'active' : ''}`}
                onClick={() => {
                  setSelectedView(view)
                  if (view === '全部') setSelectedReleaseType('全部')
                  else setSelectedReleaseStatus('全部')
                  setCurrentPage(1)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <FileTextOutlined style={{ color: selectedView === view ? '#02b980' : '#666' }} />
                <span>{view}</span>
              </span>
            ))}
            <Button type="text" size="small" style={{ padding: '2px 8px' }}>
              <PlusOutlined />
            </Button>
          </Space>
        </div>
        <div className="category-tabs">
          <Space size="middle">
            {selectedView === '全部' ? (
              (['全部', '生产工单', '采购订单', '委外订单'] as const).map((type) => (
                <span
                  key={type}
                  className={`category-tab ${selectedReleaseType === type ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedReleaseType(type)
                    setCurrentPage(1)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {type} {releaseTypeCounts[type]}
                </span>
              ))
            ) : (
              (['全部', '已下发', '未下发'] as const).map((status) => (
                <span
                  key={status}
                  className={`category-tab ${selectedReleaseStatus === status ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedReleaseStatus(status)
                    setCurrentPage(1)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {status} {releaseStatusCounts[status]}
                </span>
              ))
            )}
          </Space>
        </div>
      </div>

      {/* 搜索和筛选：计划编号、产品编号、产品名称、审批状态 */}
      <div className="search-filter-bar">
        <div className="search-filter-items">
          <label className="search-filter-item">
            <span className="search-filter-label">计划编号</span>
            <span className="search-filter-input-wrap">
              <Input
                value={planNo}
                onChange={(e) => setPlanNo(e.target.value)}
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
            <span className="search-filter-label">审批状态</span>
            <span className="search-filter-select-wrap">
              <Select
                value={approvalStatusFilter}
                onChange={setApprovalStatusFilter}
                size="small"
                style={{ width: '100%' }}
                options={[
                  { value: '全部', label: '全部' },
                  { value: '待审批', label: '待审批' },
                  { value: '已审批', label: '已审批' },
                ]}
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

      {/* 数据表格操作工具栏 */}
      <div className="table-toolbar">
        <div className="toolbar-buttons">
          {selectedRowKeys.length > 0 ? (
            <>
              <div className="toolbar-batch-left">
                <span className="selected-count">
                  已选择 {selectedMaterialCount} 条计划
                </span>
                <Space.Compact className="toolbar-approval-group">
                  <Button onClick={() => handleBatchOperation('审批')}>审批</Button>
                  <Dropdown
                    menu={{
                      items: [{ key: '撤销审批', label: '撤销审批' }],
                      onClick: ({ key }) => handleBatchOperation(key),
                    }}
                    trigger={['click']}
                  >
                    <Button icon={<DownOutlined />} title="查看更多操作" />
                  </Dropdown>
                </Space.Compact>
                <Button onClick={() => handleBatchOperation('下发生产')}>下发生产</Button>
                <Button onClick={() => handleBatchOperation('下发采购')}>下发采购</Button>
                <Button onClick={() => handleBatchOperation('下发委外')}>下发委外</Button>
                <Button onClick={() => handleBatchOperation('拆分')}>拆分</Button>
                <Button onClick={() => handleBatchOperation('修改')}>修改</Button>
                <Button danger onClick={() => handleBatchOperation('删除')}>
                  删除
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
          scroll={{ x: mainTableWidth || 1500, y: 'calc(100vh - 340px)' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: transformedPlanOrderData.length,
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
                <Table.Summary.Cell index={1} colSpan={4} align="left">
                  合计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  {columnTotals.suggestedQty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  {columnTotals.planQty}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={16} />
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

export default PlanOrder
