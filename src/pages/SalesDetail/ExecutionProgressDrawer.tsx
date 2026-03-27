import { useMemo } from 'react'
import { Drawer, Card, Descriptions, Table, Typography, Space, Tag, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

interface SalesDetailProgressRecord {
  key: string
  orderNo: string
  lineNo: number
  productCode: string
  productName: string
  spec: string
  qty: number
  demandCalcFlag: string
  lastCalcTime: string
  deliveredQty: number
  undeliveredQty: number
  detailStatus: '待审批' | '进行中' | '已结束' | '已取消'
}

interface ExecutionProgressDrawerProps {
  open: boolean
  record: SalesDetailProgressRecord | null
  onClose: () => void
}

interface LinkedPlanRow {
  key: string
  levelNo: string
  planType: '采购计划' | '生产计划'
  planNo: string
  planStatus: '待审批' | '待下发' | '已下发'
  planQty: number
  productCode: string
  productName: string
  spec: string
  planReleaseDate: string
  generatedDoc: string
}

interface LinkedExecRow {
  key: string
  docType: '采购订单' | '工单'
  docNo: string
  docStatus: string
  productCode: string
  productName: string
  spec: string
  qty: number
  executedQty: number
  unexecutedQty: number
  sourceType: string
}

interface LinkedInventoryTxnRow {
  key: string
  docNo: string
  docType: '采购入库单' | '生产入库单' | '销售出库单'
  approvalStatus: '已审批' | '审批中'
  productCode: string
  productName: string
  spec: string
  qty: number
  stockIoTime: string
}

const isValidDocNo = (docNo?: string) => Boolean(docNo && docNo.trim() && docNo !== '-')

const inferPlanStatus = (record: SalesDetailProgressRecord): LinkedPlanRow['planStatus'] => {
  if (record.demandCalcFlag !== '已计算') return '待审批'
  if (record.deliveredQty > 0 || record.detailStatus === '已结束') return '已下发'
  if (record.detailStatus === '进行中') return '待下发'
  return '待审批'
}

const getRouteByPlanType = (planType: LinkedPlanRow['planType']) => {
  return planType === '采购计划' ? ROUTES.PLAN_ORDER_PURCHASE : ROUTES.PLAN_ORDER_PRODUCTION
}

const getRouteByExecType = (docType: LinkedExecRow['docType']) => {
  return docType === '采购订单' ? ROUTES.PLAN_ORDER_PURCHASE : ROUTES.PLAN_ORDER_PRODUCTION
}

const buildLinkedPlanRows = (record: SalesDetailProgressRecord | null): LinkedPlanRow[] => {
  if (!record || record.demandCalcFlag !== '已计算') return []

  const suffix = record.orderNo.replace(/-/g, '').slice(-6)
  const status = inferPlanStatus(record)
  const purchaseQty = Math.max(0, Math.floor(record.qty * 0.35))
  const productionQty = Math.max(0, record.qty - purchaseQty)
  const planReleaseDate = record.lastCalcTime && record.lastCalcTime !== '-' ? record.lastCalcTime.slice(0, 10) : '2026-03-20'

  return [
    {
      key: `${record.key}-purchase-plan`,
      levelNo: '1.1',
      planType: '采购计划' as const,
      planNo: `CGJH-${suffix}-${record.lineNo}`,
      planStatus: status,
      planQty: purchaseQty,
      productCode: record.productCode,
      productName: record.productName,
      spec: record.spec,
      planReleaseDate,
      generatedDoc: status === '已下发' ? `CGDD-${suffix}-${record.lineNo}` : '-',
    },
    {
      key: `${record.key}-production-plan`,
      levelNo: '1.2',
      planType: '生产计划' as const,
      planNo: `SCJH-${suffix}-${record.lineNo}`,
      planStatus: status,
      planQty: productionQty,
      productCode: record.productCode,
      productName: record.productName,
      spec: record.spec,
      planReleaseDate,
      generatedDoc: status === '已下发' ? `SCDD-${suffix}-${record.lineNo}` : '-',
    },
  ].filter((item) => item.planQty > 0)
}

const buildLinkedExecRows = (record: SalesDetailProgressRecord | null, plans: LinkedPlanRow[]): LinkedExecRow[] => {
  if (!record) return []
  return plans
    .filter((plan) => isValidDocNo(plan.generatedDoc))
    .map((plan) => {
      const isPurchase = plan.generatedDoc.startsWith('CGDD')
      const executedQty = Math.min(plan.planQty, Math.floor(plan.planQty * (record.deliveredQty / Math.max(record.qty, 1))))
      const unexecutedQty = Math.max(0, plan.planQty - executedQty)
      return {
        key: `${plan.key}-exec`,
        docType: isPurchase ? '采购订单' : '工单',
        docNo: plan.generatedDoc,
        docStatus: unexecutedQty > 0 ? '执行中' : '已完成',
        productCode: record.productCode,
        productName: record.productName,
        spec: record.spec,
        qty: plan.planQty,
        executedQty,
        unexecutedQty,
        sourceType: '销售明细',
      }
    })
}

const buildLinkedInventoryTxnRows = (
  record: SalesDetailProgressRecord | null,
  linkedExecDocs: LinkedExecRow[],
): LinkedInventoryTxnRow[] => {
  if (!record) return []
  const rows: LinkedInventoryTxnRow[] = []
  const fallbackDate = record.lastCalcTime && record.lastCalcTime !== '-' ? record.lastCalcTime.slice(0, 10) : '2026-03-18'

  linkedExecDocs.forEach((doc) => {
    if (doc.docType === '采购订单' && doc.executedQty > 0) {
      rows.push({
        key: `${doc.key}-purchase-in`,
        docNo: doc.docNo,
        docType: '采购入库单',
        approvalStatus: doc.unexecutedQty > 0 ? '审批中' : '已审批',
        productCode: record.productCode,
        productName: record.productName,
        spec: record.spec,
        qty: doc.executedQty,
        stockIoTime: fallbackDate,
      })
    }
    if (doc.docType === '工单' && doc.executedQty > 0) {
      rows.push({
        key: `${doc.key}-workorder-in`,
        docNo: doc.docNo,
        docType: '生产入库单',
        approvalStatus: doc.unexecutedQty > 0 ? '审批中' : '已审批',
        productCode: record.productCode,
        productName: record.productName,
        spec: record.spec,
        qty: doc.executedQty,
        stockIoTime: fallbackDate,
      })
    }
  })

  if (record.deliveredQty > 0) {
    rows.push({
      key: `${record.key}-sales-out`,
      docNo: `${record.orderNo}-${record.lineNo}`,
      docType: '销售出库单',
      approvalStatus: record.undeliveredQty > 0 ? '审批中' : '已审批',
      productCode: record.productCode,
      productName: record.productName,
      spec: record.spec,
      qty: record.deliveredQty,
      stockIoTime: fallbackDate,
    })
  }

  return rows
}

const statusTag = (status: LinkedPlanRow['planStatus']) => {
  if (status === '已下发') return <Tag color="success">{status}</Tag>
  if (status === '待下发') return <Tag color="processing">{status}</Tag>
  return <Tag color="warning">{status}</Tag>
}

const ExecutionProgressDrawer: React.FC<ExecutionProgressDrawerProps> = ({ open, record, onClose }) => {
  const navigate = useNavigate()

  const linkedPlans = useMemo(() => buildLinkedPlanRows(record), [record])
  const linkedExecDocs = useMemo(() => buildLinkedExecRows(record, linkedPlans), [record, linkedPlans])
  const linkedPurchaseDocs = useMemo(
    () => linkedExecDocs.filter((item) => item.docType === '采购订单'),
    [linkedExecDocs],
  )
  const linkedWorkOrderDocs = useMemo(
    () => linkedExecDocs.filter((item) => item.docType === '工单'),
    [linkedExecDocs],
  )
  const linkedInventoryTxns = useMemo(
    () => buildLinkedInventoryTxnRows(record, linkedExecDocs),
    [linkedExecDocs, record],
  )

  const summaryText = useMemo(() => {
    if (!record) return '-'
    if (record.demandCalcFlag !== '已计算') return '待需求计算'
    if (linkedPlans.length === 0) return '已计算，待生成计划'
    if (linkedExecDocs.length === 0) return '计划已生成，待下发'
    return '执行中'
  }, [linkedExecDocs.length, linkedPlans.length, record])

  const jumpWithContext = (targetPath: string, highlightDocNo: string) => {
    if (!record || !isValidDocNo(highlightDocNo)) return
    const query = new URLSearchParams({
      highlightDocNo,
      sourceDocNo: record.orderNo,
      sourceDocLineNo: String(record.lineNo),
      from: 'sales-detail-progress',
    })
    navigate(`${targetPath}?${query.toString()}`)
  }

  const planColumns: ColumnsType<LinkedPlanRow> = [
    { title: '层级编号', dataIndex: 'levelNo', key: 'levelNo', width: 90 },
    { title: '计划类型', dataIndex: 'planType', key: 'planType', width: 100 },
    {
      title: '计划编号',
      dataIndex: 'planNo',
      key: 'planNo',
      width: 180,
      render: (value: string, row) => (
        <Typography.Link onClick={() => jumpWithContext(getRouteByPlanType(row.planType), value)}>{value}</Typography.Link>
      ),
    },
    {
      title: '计划状态',
      dataIndex: 'planStatus',
      key: 'planStatus',
      width: 100,
      render: (value: LinkedPlanRow['planStatus']) => statusTag(value),
    },
    { title: '计划数量', dataIndex: 'planQty', key: 'planQty', align: 'right', width: 100 },
    { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 120 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 140 },
    { title: '产品规格', dataIndex: 'spec', key: 'spec', width: 150 },
    { title: '计划下发日期', dataIndex: 'planReleaseDate', key: 'planReleaseDate', width: 120 },
    {
      title: '关联下发单据',
      dataIndex: 'generatedDoc',
      key: 'generatedDoc',
      width: 180,
      render: (value: string) =>
        isValidDocNo(value) ? (
          <Typography.Link
            onClick={() => jumpWithContext(getRouteByExecType(value.startsWith('CGDD') ? '采购订单' : '工单'), value)}
          >
            {value}
          </Typography.Link>
        ) : (
          '-'
        ),
    },
  ]

  const purchaseColumns: ColumnsType<LinkedExecRow> = [
    {
      title: '订单编号',
      dataIndex: 'docNo',
      key: 'docNo',
      width: 180,
      render: (value: string, row) => (
        <Typography.Link onClick={() => jumpWithContext(getRouteByExecType(row.docType), value)}>{value}</Typography.Link>
      ),
    },
    { title: '订单状态', dataIndex: 'docStatus', key: 'docStatus', width: 100 },
    { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 120 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 140 },
    { title: '产品规格', dataIndex: 'spec', key: 'spec', width: 150 },
    { title: '数量', dataIndex: 'qty', key: 'qty', width: 90, align: 'right' },
    { title: '收货数量', dataIndex: 'executedQty', key: 'executedQty', width: 90, align: 'right' },
    { title: '未清数量', dataIndex: 'unexecutedQty', key: 'unexecutedQty', width: 90, align: 'right' },
    { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', width: 120 },
  ]

  const workOrderColumns: ColumnsType<LinkedExecRow> = [
    {
      title: '工单编号',
      dataIndex: 'docNo',
      key: 'docNo',
      width: 180,
      render: (value: string, row) => (
        <Typography.Link onClick={() => jumpWithContext(getRouteByExecType(row.docType), value)}>{value}</Typography.Link>
      ),
    },
    { title: '状态', dataIndex: 'docStatus', key: 'docStatus', width: 100 },
    { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 120 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 140 },
    { title: '产品规格', dataIndex: 'spec', key: 'spec', width: 150 },
    { title: '计划数', dataIndex: 'qty', key: 'qty', width: 90, align: 'right' },
    { title: '良品数', dataIndex: 'executedQty', key: 'executedQty', width: 90, align: 'right' },
    { title: '在制数', dataIndex: 'unexecutedQty', key: 'unexecutedQty', width: 90, align: 'right' },
    {
      title: '已入库数量',
      key: 'stockInQty',
      width: 110,
      align: 'right',
      render: (_: unknown, row) => Math.max(0, Math.floor(row.executedQty * 0.9)),
    },
    { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', width: 120 },
  ]

  const inventoryTxnColumns: ColumnsType<LinkedInventoryTxnRow> = [
    { title: '单据编号', dataIndex: 'docNo', key: 'docNo', width: 180 },
    { title: '单据类型', dataIndex: 'docType', key: 'docType', width: 120 },
    { title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 100 },
    { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 120 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 140 },
    { title: '产品规格', dataIndex: 'spec', key: 'spec', width: 150 },
    { title: '数量', dataIndex: 'qty', key: 'qty', width: 100, align: 'right' },
    { title: '库存收发时间', dataIndex: 'stockIoTime', key: 'stockIoTime', width: 130 },
  ]

  return (
    <Drawer
      open={open}
      width={960}
      title={record ? `执行进度 - ${record.orderNo} / 行${record.lineNo}` : '执行进度'}
      onClose={onClose}
      className="sales-detail-progress-drawer"
      destroyOnClose
    >
      {!record ? (
        <Empty description="暂无可展示的销售明细" />
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card size="small" className="progress-summary-card">
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="来源销售明细">{`${record.orderNo} / 行${record.lineNo}`}</Descriptions.Item>
              <Descriptions.Item label="订单数量">{record.qty}</Descriptions.Item>
              <Descriptions.Item label="需求计算标记">{record.demandCalcFlag}</Descriptions.Item>
              <Descriptions.Item label="已发货">{record.deliveredQty}</Descriptions.Item>
              <Descriptions.Item label="未清数量">{record.undeliveredQty}</Descriptions.Item>
              <Descriptions.Item label="最后计算时间">{record.lastCalcTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态" span={3}>
                {summaryText}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="关联计划">
            {linkedPlans.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联计划，建议先执行需求计算" />
            ) : (
              <Table<LinkedPlanRow>
                rowKey="key"
                columns={planColumns}
                dataSource={linkedPlans}
                size="small"
                pagination={false}
                  scroll={{ x: 1200 }}
              />
            )}
          </Card>

          <Card size="small" title="关联采购">
            {linkedPurchaseDocs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联采购单据" />
            ) : (
              <Table<LinkedExecRow>
                rowKey="key"
                columns={purchaseColumns}
                dataSource={linkedPurchaseDocs}
                size="small"
                pagination={false}
                scroll={{ x: 1150 }}
              />
            )}
          </Card>

          <Card size="small" title="关联生产">
            {linkedWorkOrderDocs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联生产工单" />
            ) : (
              <Table<LinkedExecRow>
                rowKey="key"
                columns={workOrderColumns}
                dataSource={linkedWorkOrderDocs}
                size="small"
                pagination={false}
                scroll={{ x: 1250 }}
              />
            )}
          </Card>

          <Card size="small" title="关联库存">
            {linkedInventoryTxns.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联库存收发记录" />
            ) : (
              <Table<LinkedInventoryTxnRow>
                rowKey="key"
                columns={inventoryTxnColumns}
                dataSource={linkedInventoryTxns}
                size="small"
                pagination={false}
                scroll={{ x: 980 }}
              />
            )}
          </Card>
        </Space>
      )}
    </Drawer>
  )
}

export default ExecutionProgressDrawer
