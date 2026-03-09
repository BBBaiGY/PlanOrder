import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Drawer,
  Card,
  Space,
  Button,
  Table,
  Typography,
  Modal,
  Popconfirm,
  Form,
  Radio,
  InputNumber,
  DatePicker,
  Select,
  Checkbox,
  Tabs,
  Row,
  Col,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

type SalesDetailItem = {
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
  rowKey?: string
}

type DemandCalcRule = {
  warehouseScope: 'all' | 'exclude'
  excludedWarehouses: string[]

  inventoryScope: 'none' | 'available'
  availableStockSettings: {
    includeOnHand: boolean
    includeSafetyStock: boolean

    expectedIn: {
      planNew: { checked: boolean; pendingApproval: boolean } // 计划新增、待审批
      purchaseInTransit: { checked: boolean; pendingApproval: boolean } // 采购在途、待审批
      productionWip: { checked: boolean; notStarted: boolean } // 生产在制、未开始
    }

    expectedOut: {
      salesPendingIssue: { checked: boolean; pendingApproval: boolean } // 销售待发、待审批
      planPendingPick: { checked: boolean; pendingApproval: boolean } // 计划待领、待审批
      productionPendingPick: { checked: boolean; notStarted: boolean } // 生产待领、未开始
    }
  }

  inventoryMethod:
    | 'step'
    | 'mtoNoStock_mtsStock'
    | 'noFinished'
    | 'noSemiFinished'
    | 'onlyLowest'

  bomExpandOnNegativeAvailable: boolean

  resultMergeRule:
    | 'none'
    | 'product'
    | 'product_sourceDoc'
    | 'product_sourceDoc_line'
    | 'mto_product_sourceDoc__mts_product'
    | 'mto_product_sourceDoc_line__mts_product'
}

type DemandCalcDetailRow = {
  key: string
  productCode: string
  productName: string
  productSpec: string
  calcQty: number
  appendCalcQty: number
  cumulativeCalcQty: number
  availableCalcQty: number
  docQty: number
  executedQty: number
  demandDate: Dayjs
  sourceDemandDate: Dayjs
  sourceDocType: string
  sourceDocNo: string
  sourceLineNo: number
  bomStatus: '已维护' | '待维护'
}

const LAST_RULE_STORAGE_KEY = 'plan-order:demand-calc:last-rule'

const defaultRule: DemandCalcRule = {
  warehouseScope: 'all',
  excludedWarehouses: [],
  inventoryScope: 'available',
  availableStockSettings: {
    includeOnHand: true,
    includeSafetyStock: true,
    expectedIn: {
      planNew: { checked: true, pendingApproval: true },
      purchaseInTransit: { checked: true, pendingApproval: true },
      productionWip: { checked: true, notStarted: true },
    },
    expectedOut: {
      salesPendingIssue: { checked: true, pendingApproval: true },
      planPendingPick: { checked: true, pendingApproval: true },
      productionPendingPick: { checked: true, notStarted: true },
    },
  },
  inventoryMethod: 'step',
  bomExpandOnNegativeAvailable: true,
  resultMergeRule: 'product',
}

const WAREHOUSE_OPTIONS = [
  { value: 'WH001', label: 'WH001 主仓' },
  { value: 'WH002', label: 'WH002 成品仓' },
  { value: 'WH003', label: 'WH003 半成品仓' },
  { value: 'WH004', label: 'WH004 原材料仓' },
]

const computeAvailableCalcQty = (docQty: number, executedQty: number) => {
  const v = (Number(docQty) || 0) - (Number(executedQty) || 0)
  return Math.max(0, v)
}

const toNumber = (v: unknown, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const computeAppendByCalc = (calcQty: number, executedQty: number, cumulativeCalcQty: number) => {
  // 追加计算数量 = 计算数量 + 累计执行数量 − 累计计算数量
  return toNumber(calcQty) + toNumber(executedQty) - toNumber(cumulativeCalcQty)
}

const computeCalcByAppend = (appendCalcQty: number, executedQty: number, cumulativeCalcQty: number) => {
  // 追加计算数量 = 计算数量 + 累计执行数量 − 累计计算数量
  // => 计算数量 = 追加计算数量 + 累计计算数量 − 累计执行数量
  return toNumber(appendCalcQty) + toNumber(cumulativeCalcQty) - toNumber(executedQty)
}

const normalizeRow = (row: DemandCalcDetailRow): DemandCalcDetailRow => {
  const available = computeAvailableCalcQty(row.docQty, row.executedQty)
  const calcQty = Math.max(0, toNumber(row.calcQty))
  const appendCalcQty = toNumber(row.appendCalcQty)
  const cumulativeCalcQty = Math.max(0, toNumber(row.cumulativeCalcQty))
  return {
    ...row,
    availableCalcQty: available,
    calcQty,
    appendCalcQty,
    cumulativeCalcQty,
  }
}

function formatRule(rule: DemandCalcRule) {
  const warehouseText =
    rule.warehouseScope === 'all'
      ? '仓库=全部'
      : `仓库=排除(${(rule.excludedWarehouses || []).length}个)`

  const inventoryScopeText = rule.inventoryScope === 'none' ? '库存=不考虑' : '库存=预计可用库存'

  const inventoryMethodText = (() => {
    switch (rule.inventoryMethod) {
      case 'step':
        return '方式=逐级考虑库存'
      case 'mtoNoStock_mtsStock':
        return '方式=MTO不考虑库存/MTS考虑库存'
      case 'noFinished':
        return '方式=不考虑成品库存'
      case 'noSemiFinished':
        return '方式=不考虑中间半成品库存'
      case 'onlyLowest':
        return '方式=只考虑末级库存'
      default:
        return '方式=—'
    }
  })()

  const bomText = rule.bomExpandOnNegativeAvailable ? 'BOM展开=负预计可用库存' : 'BOM展开=不展开'

  const mergeText = (() => {
    switch (rule.resultMergeRule) {
      case 'none':
        return '合并=不合并'
      case 'product':
        return '合并=产品'
      case 'product_sourceDoc':
        return '合并=产品+来源单据'
      case 'product_sourceDoc_line':
        return '合并=产品+来源单据+行号'
      case 'mto_product_sourceDoc__mts_product':
        return '合并=MTO(产品+来源单据)/MTS(产品)'
      case 'mto_product_sourceDoc_line__mts_product':
        return '合并=MTO(产品+来源单据+行号)/MTS(产品)'
      default:
        return '合并=—'
    }
  })()
  return `${warehouseText}；${inventoryScopeText}；${inventoryMethodText}；${bomText}；${mergeText}`
}

function loadLastRule(): DemandCalcRule {
  try {
    const raw = localStorage.getItem(LAST_RULE_STORAGE_KEY)
    if (!raw) return defaultRule
    const parsed = JSON.parse(raw) as Partial<DemandCalcRule> & Record<string, unknown>
    return {
      ...defaultRule,
      ...parsed,
      bomExpandOnNegativeAvailable: (() => {
        if (typeof (parsed as any).bomExpandOnNegativeAvailable === 'boolean') return (parsed as any).bomExpandOnNegativeAvailable as boolean
        // 兼容旧字段：bomExpandWhen
        const legacy = (parsed as any).bomExpandWhen
        if (legacy === 'negativeAvailable') return true
        if (legacy === 'negativeStock') return false
        return defaultRule.bomExpandOnNegativeAvailable
      })(),
      availableStockSettings: (() => {
        const p = parsed.availableStockSettings as Partial<DemandCalcRule['availableStockSettings']> | undefined
        if (!p) return defaultRule.availableStockSettings
        return {
          ...defaultRule.availableStockSettings,
          includeOnHand: typeof p.includeOnHand === 'boolean' ? p.includeOnHand : defaultRule.availableStockSettings.includeOnHand,
          includeSafetyStock: typeof p.includeSafetyStock === 'boolean' ? p.includeSafetyStock : defaultRule.availableStockSettings.includeSafetyStock,
          expectedIn: {
            ...defaultRule.availableStockSettings.expectedIn,
            ...(p.expectedIn || {}),
            planNew: { ...defaultRule.availableStockSettings.expectedIn.planNew, ...(p.expectedIn?.planNew || {}) },
            purchaseInTransit: { ...defaultRule.availableStockSettings.expectedIn.purchaseInTransit, ...(p.expectedIn?.purchaseInTransit || {}) },
            productionWip: { ...defaultRule.availableStockSettings.expectedIn.productionWip, ...(p.expectedIn?.productionWip || {}) },
          },
          expectedOut: {
            ...defaultRule.availableStockSettings.expectedOut,
            ...(p.expectedOut || {}),
            salesPendingIssue: { ...defaultRule.availableStockSettings.expectedOut.salesPendingIssue, ...(p.expectedOut?.salesPendingIssue || {}) },
            planPendingPick: { ...defaultRule.availableStockSettings.expectedOut.planPendingPick, ...(p.expectedOut?.planPendingPick || {}) },
            productionPendingPick: { ...defaultRule.availableStockSettings.expectedOut.productionPendingPick, ...(p.expectedOut?.productionPendingPick || {}) },
          },
        }
      })(),
      excludedWarehouses: Array.isArray(parsed.excludedWarehouses) ? (parsed.excludedWarehouses as string[]) : [],
    }
  } catch {
    return defaultRule
  }
}

function persistLastRule(rule: DemandCalcRule) {
  try {
    localStorage.setItem(LAST_RULE_STORAGE_KEY, JSON.stringify(rule))
  } catch {
    // ignore
  }
}

export type DemandCalcDrawerProps = {
  open: boolean
  salesDetails: SalesDetailItem[]
  onClose: () => void
}

const DemandCalcDrawer: React.FC<DemandCalcDrawerProps> = ({ open, salesDetails, onClose }) => {
  const [rule, setRule] = useState<DemandCalcRule>(defaultRule)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [availableStockActiveKey, setAvailableStockActiveKey] = useState<string>('stock')
  const [ruleTabKey, setRuleTabKey] = useState<string>('rules')
  const [ruleForm] = Form.useForm<DemandCalcRule>()

  const initialRows = useMemo<DemandCalcDetailRow[]>(() => {
    const today = dayjs()
    return salesDetails.map((s) => {
      const docQty = Number(s.qty) || 0
      const executedQty = Number(s.deliveredQty) || 0
      const available = computeAvailableCalcQty(docQty, executedQty)
      return {
        key: `${s.orderNo}-${s.lineNo}-${s.productCode}`,
        productCode: s.productCode,
        productName: s.productName,
        productSpec: s.spec,
        // 计算数量默认为可计算数量
        calcQty: available,
        // 追加计算数量支持编辑，默认 0
        appendCalcQty: 0,
        // 累计计算数量按公式推导；此处初始会得到 docQty（因为 available = docQty - executedQty）
        cumulativeCalcQty: docQty,
        availableCalcQty: available,
        docQty,
        executedQty,
        demandDate: today,
        sourceDemandDate: today,
        sourceDocType: '销售订单',
        sourceDocNo: s.orderNo,
        sourceLineNo: s.lineNo,
        bomStatus: '已维护',
      }
    })
  }, [salesDetails])

  const [rows, setRows] = useState<DemandCalcDetailRow[]>([])

  useEffect(() => {
    if (!open) return
    const lastRule = loadLastRule()
    setRule(lastRule)
    setRows(initialRows.map((r) => normalizeRow(r)))
  }, [open, initialRows])

  const ruleSummary = useMemo(() => formatRule(rule), [rule])

  const selectedSummary = useMemo(() => {
    const distinctProducts = new Set(rows.map((r) => r.productCode)).size
    const totalAvailable = rows.reduce((sum, r) => sum + (Number(r.availableCalcQty) || 0), 0)
    return { distinctProducts, totalAvailable }
  }, [rows])

  const updateRow = useCallback((key: string, patch: Partial<DemandCalcDetailRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r
        const base = normalizeRow({ ...r, ...patch })

        // 双向联动：
        // - 输入计算数量 -> 更新追加计算数量
        // - 输入追加计算数量 -> 反推更新计算数量
        const hasCalc = Object.prototype.hasOwnProperty.call(patch, 'calcQty')
        const hasAppend = Object.prototype.hasOwnProperty.call(patch, 'appendCalcQty')

        if (hasAppend && !hasCalc) {
          const nextCalc = computeCalcByAppend(base.appendCalcQty, base.executedQty, base.cumulativeCalcQty)
          const next = normalizeRow({ ...base, calcQty: nextCalc })
          return next
        }

        if (hasCalc && !hasAppend) {
          const nextAppend = computeAppendByCalc(base.calcQty, base.executedQty, base.cumulativeCalcQty)
          const next = normalizeRow({ ...base, appendCalcQty: nextAppend })
          return next
        }

        // 默认：不强行联动（如同时传入 calcQty 和 appendCalcQty，认为外部已自行保证关系）
        return base
      })
    )
  }, [])

  const handleDeleteRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key))
    message.success('已删除明细')
  }, [])

  const columns: ColumnsType<DemandCalcDetailRow> = useMemo(() => {
    return [
      { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 140, fixed: 'left' },
      { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 160 },
      { title: '产品规格', dataIndex: 'productSpec', key: 'productSpec', width: 180 },
      {
        title: '计算数量',
        dataIndex: 'calcQty',
        key: 'calcQty',
        width: 130,
        align: 'right',
        render: (_v, r) => (
          <InputNumber
            value={r.calcQty}
            min={0}
            status={r.calcQty > r.availableCalcQty ? 'warning' : undefined}
            precision={0}
            controls={false}
            style={{ width: '100%' }}
            onChange={(val) => updateRow(r.key, { calcQty: Number(val) || 0 })}
          />
        ),
      },
      {
        title: '追加计算数量',
        dataIndex: 'appendCalcQty',
        key: 'appendCalcQty',
        width: 140,
        align: 'right',
        render: (_v: number, r) => (
          <InputNumber
            value={r.appendCalcQty}
            min={undefined}
            max={undefined}
            precision={0}
            controls={false}
            style={{ width: '100%' }}
            onChange={(val) => updateRow(r.key, { appendCalcQty: Number(val) || 0 })}
          />
        ),
      },
      {
        title: '累计计算数量',
        dataIndex: 'cumulativeCalcQty',
        key: 'cumulativeCalcQty',
        width: 130,
        align: 'right',
        render: (v: number) => <span>{v}</span>,
      },
      { title: '可计算数量', dataIndex: 'availableCalcQty', key: 'availableCalcQty', width: 130, align: 'right' },
      { title: '单据数量', dataIndex: 'docQty', key: 'docQty', width: 120, align: 'right' },
      { title: '累计执行数量', dataIndex: 'executedQty', key: 'executedQty', width: 130, align: 'right' },
      {
        title: '需求日期',
        dataIndex: 'demandDate',
        key: 'demandDate',
        width: 150,
        render: (_v, r) => (
          <DatePicker
            value={r.demandDate}
            style={{ width: '100%' }}
            onChange={(val) => {
              if (!val) return
              updateRow(r.key, { demandDate: val })
            }}
          />
        ),
      },
      {
        title: '来源需求日期',
        dataIndex: 'sourceDemandDate',
        key: 'sourceDemandDate',
        width: 150,
        render: (v: Dayjs) => <span>{(v || dayjs()).format('YYYY-MM-DD')}</span>,
      },
      { title: '来源单据类型', dataIndex: 'sourceDocType', key: 'sourceDocType', width: 120 },
      { title: '来源单据', dataIndex: 'sourceDocNo', key: 'sourceDocNo', width: 160 },
      { title: '来源明细行号', dataIndex: 'sourceLineNo', key: 'sourceLineNo', width: 120, align: 'right' },
      {
        title: '产品BOM状态',
        dataIndex: 'bomStatus',
        key: 'bomStatus',
        width: 120,
        render: (v: DemandCalcDetailRow['bomStatus']) => {
          if (v === '已维护') return <Tag color="green">已维护</Tag>
          return <Tag color="orange">待维护</Tag>
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 90,
        fixed: 'right',
        render: (_v, r) => (
          <Popconfirm
            title="确认删除该行明细？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => handleDeleteRow(r.key)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        ),
      },
    ]
  }, [handleDeleteRow, updateRow])

  const handleOpenRuleModal = () => {
    ruleForm.setFieldsValue(rule)
    setRuleTabKey('rules')
    setRuleModalOpen(true)
  }

  const handleSaveRule = async () => {
    const next = await ruleForm.validateFields()
    setRule(next)
    persistLastRule(next)
    setRuleModalOpen(false)
    message.success('已更新本次计算规则')
  }

  const handleStartCalc = () => {
    if (rows.length === 0) {
      message.warning('请先选择销售明细')
      return
    }
    persistLastRule(rule)
    message.success('需求计算已生成（示例）')
    onClose()
  }

  return (
    <>
      <Drawer
        title="新建需求计算"
        placement="right"
        width={1100}
        open={open}
        destroyOnClose
        onClose={onClose}
        className="demand-calc-drawer"
        extra={
          <Space>
            <Button onClick={onClose}>关闭</Button>
          </Space>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleStartCalc}>
              开始计算
            </Button>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Card size="small" className="calc-rule-card">
            <div className="calc-rule-row">
              <div className="calc-rule-left">
                <Typography.Text strong>设置计算规则</Typography.Text>
                <Typography.Text type="secondary" className="calc-rule-summary">
                  默认上一次计算规则：{ruleSummary}
                </Typography.Text>
              </div>
              <Button onClick={handleOpenRuleModal}>修改</Button>
            </div>
          </Card>

          <Card
            size="small"
            title={
              <Space size={10}>
                <Typography.Text strong>明细</Typography.Text>
                <Typography.Text type="secondary">
                  共 {rows.length} 行，{selectedSummary.distinctProducts} 个产品，可计算数量合计 {selectedSummary.totalAvailable}
                </Typography.Text>
              </Space>
            }
            className="calc-detail-card"
          >
            <Table
              columns={columns}
              dataSource={rows}
              rowKey="key"
              size="small"
              pagination={false}
              scroll={{ x: 1800, y: 'calc(100vh - 360px)' }}
            />
          </Card>
        </Space>
      </Drawer>

      <Modal
        title="修改计算规则"
        open={ruleModalOpen}
        onCancel={() => setRuleModalOpen(false)}
        onOk={handleSaveRule}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        width={980}
        className="rule-config-modal"
      >
        <Form form={ruleForm} layout="vertical" initialValues={rule}>
          <Tabs
            activeKey={ruleTabKey}
            onChange={setRuleTabKey}
            items={[
              {
                key: 'rules',
                label: '计算规则',
                children: (
                  <div className="rule-config-all">
                    <div className="rule-item">
                      <div className="rule-item-label">仓库计算范围</div>
                      <div className="rule-item-control">
                        <Form.Item<DemandCalcRule> name="warehouseScope" rules={[{ required: true }]} noStyle>
                          <Radio.Group>
                            <Radio value="all">全部仓库</Radio>
                            <Radio value="exclude">排除部分仓库计算</Radio>
                          </Radio.Group>
                        </Form.Item>
                        <Form.Item noStyle shouldUpdate={(p, c) => p.warehouseScope !== c.warehouseScope}>
                          {({ getFieldValue }) => {
                            const scope = getFieldValue('warehouseScope') as DemandCalcRule['warehouseScope']
                            if (scope !== 'exclude') return null
                            return (
                              <div className="rule-item-inline-extra rule-item-inline-extra--warehouse">
                                <Form.Item<DemandCalcRule>
                                  name="excludedWarehouses"
                                  rules={[{ required: true, message: '请选择要排除的仓库' }]}
                                  noStyle
                                >
                                  <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="请选择要排除的仓库"
                                    options={WAREHOUSE_OPTIONS}
                                    style={{ minWidth: 260 }}
                                  />
                                </Form.Item>
                              </div>
                            )
                          }}
                        </Form.Item>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">库存考虑范围</div>
                      <div className="rule-item-control">
                        <Form.Item<DemandCalcRule> name="inventoryScope" rules={[{ required: true }]} noStyle>
                          <Radio.Group
                            options={[
                              { value: 'none', label: '不考虑库存' },
                              { value: 'available', label: '预计可用库存' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item noStyle shouldUpdate={(p, c) => p.inventoryScope !== c.inventoryScope}>
                          {({ getFieldValue }) => {
                            const invScope = getFieldValue('inventoryScope') as DemandCalcRule['inventoryScope']
                            return (
                              <div className="rule-item-inline-hint">
                                <Typography.Text type="secondary">
                                  预计可用库存配置请在第二页进行设置
                                </Typography.Text>
                                <Button
                                  type="link"
                                  disabled={invScope !== 'available'}
                                  onClick={() => setRuleTabKey('availableStock')}
                                >
                                  去配置
                                </Button>
                              </div>
                            )
                          }}
                        </Form.Item>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">库存考虑方式</div>
                      <div className="rule-item-control">
                        <Form.Item<DemandCalcRule> name="inventoryMethod" rules={[{ required: true }]} noStyle>
                          <Select
                            style={{ width: 420 }}
                            options={[
                              { value: 'step', label: '逐级考虑库存' },
                              { value: 'mtoNoStock_mtsStock', label: 'MTO不考虑库存，MTS考虑库存' },
                              { value: 'noFinished', label: '不考虑成品库存' },
                              { value: 'noSemiFinished', label: '不考虑中间半成品库存' },
                              { value: 'onlyLowest', label: '只考虑末级库存' },
                            ]}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">BOM 展开子件需求</div>
                      <div className="rule-item-control">
                        <Form.Item<DemandCalcRule> name="bomExpandOnNegativeAvailable" valuePropName="checked" noStyle>
                          <Checkbox>负预计可用库存</Checkbox>
                        </Form.Item>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">需求计算结果合并规则</div>
                      <div className="rule-item-control">
                        <Form.Item<DemandCalcRule> name="resultMergeRule" rules={[{ required: true }]} noStyle>
                          <Select
                            style={{ width: 420 }}
                            options={[
                              { value: 'none', label: '不合并' },
                              { value: 'product', label: '产品' },
                              { value: 'product_sourceDoc', label: '产品+来源单据' },
                              { value: 'product_sourceDoc_line', label: '产品+来源单据+行号' },
                              { value: 'mto_product_sourceDoc__mts_product', label: 'MTO（产品+来源单据）、MTS（产品）' },
                              { value: 'mto_product_sourceDoc_line__mts_product', label: 'MTO（产品+来源单据+行号）、MTS（产品）' },
                            ]}
                          />
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'availableStock',
                label: '预计可用库存配置',
                children: (
                  <div className="rule-config-all">
                    <div className="rule-item">
                      <div className="rule-item-label">说明</div>
                      <div className="rule-item-control">
                        <Typography.Text type="secondary">
                          仅当库存考虑范围选择「预计可用库存」时，本页配置才会参与计算
                        </Typography.Text>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">库存数量</div>
                      <div className="rule-item-control">
                        <Space size={24} wrap>
                          <Form.Item name={['availableStockSettings', 'includeOnHand']} valuePropName="checked" noStyle>
                            <Checkbox>现有库存</Checkbox>
                          </Form.Item>
                          <Form.Item name={['availableStockSettings', 'includeSafetyStock']} valuePropName="checked" noStyle>
                            <Checkbox>安全库存</Checkbox>
                          </Form.Item>
                        </Space>
                      </div>
                    </div>

                    <div className="rule-item">
                      <div className="rule-item-label">预计入库</div>
                      <div className="rule-item-control">
                        <Space size={24} direction="vertical">
                          <div className="available-stock-item available-stock-item--with-unapproved">
                            <Form.Item name={['availableStockSettings', 'expectedIn', 'planNew', 'checked']} valuePropName="checked" noStyle>
                              <Checkbox>计划新增</Checkbox>
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
                              <Checkbox>采购在途</Checkbox>
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
                              <Checkbox>生产在制</Checkbox>
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
                              <Checkbox>销售待发</Checkbox>
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
                              <Checkbox>计划待领</Checkbox>
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
                              <Checkbox>生产待领</Checkbox>
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
                            // 安全库存属于要减去的内容
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
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </>
  )
}

export default DemandCalcDrawer

