import { useState, useEffect, useMemo } from 'react'
import { Modal, InputNumber, DatePicker, Input, Button, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PlanOrderItem } from '@/types/supply-demand'
import dayjs from 'dayjs'

interface SplitRow {
  id: string
  planQty: number
  demandDate: string
  planReleaseDate: string
  supplier: string
  remark: string
}

interface SplitModalProps {
  open: boolean
  record: PlanOrderItem | null
  showSupplier?: boolean
  onClose: () => void
  onSplit: (original: PlanOrderItem, newItems: Partial<PlanOrderItem>[]) => void
}

let splitIdCounter = 0

const SplitModal: React.FC<SplitModalProps> = ({ open, record, showSupplier = true, onClose, onSplit }) => {
  const [rows, setRows] = useState<SplitRow[]>([])

  useEffect(() => {
    if (open && record) {
      splitIdCounter = 0
      const half = Math.floor(record.planQty / 2)
      setRows([
        {
          id: `split_${++splitIdCounter}`,
          planQty: half,
          demandDate: record.demandDate,
          planReleaseDate: record.planReleaseDate || record.planExecDate || '',
          supplier: record.supplier,
          remark: record.remark || '',
        },
        {
          id: `split_${++splitIdCounter}`,
          planQty: record.planQty - half,
          demandDate: record.demandDate,
          planReleaseDate: record.planReleaseDate || record.planExecDate || '',
          supplier: record.supplier,
          remark: record.remark || '',
        },
      ])
    }
  }, [open, record])

  const totalQty = useMemo(() => rows.reduce((sum, r) => sum + (r.planQty || 0), 0), [rows])
  const remaining = (record?.planQty || 0) - totalQty

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `split_${++splitIdCounter}`,
        planQty: 0,
        demandDate: record?.demandDate || '',
        planReleaseDate: record?.planReleaseDate || record?.planExecDate || '',
        supplier: record?.supplier || '',
        remark: record?.remark || '',
      },
    ])
  }

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 2) {
      message.warning('至少保留两行拆分记录')
      return
    }
    setRows(prev => prev.filter((r) => r.id !== id))
  }

  const handleRowChange = (id: string, field: keyof SplitRow, value: unknown) => {
    setRows(prev => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = () => {
    if (!record) return
    if (rows.length < 2) {
      message.error('至少需要拆分为两条记录')
      return
    }
    if (rows.some((r) => !r.planQty || r.planQty <= 0)) {
      message.error('每行计划数量必须大于 0')
      return
    }
    if (rows.some((r) => !r.planReleaseDate || !dayjs(r.planReleaseDate).isBefore(dayjs(r.demandDate), 'day'))) {
      message.error('计划下发日期必须早于需求日期')
      return
    }
    if (totalQty !== record.planQty) {
      message.error(`拆分数量之和 (${totalQty}) 必须等于原计划数量 (${record.planQty})`)
      return
    }
    onSplit(
      record,
      rows.map((r) => ({
        planQty: r.planQty,
        demandDate: r.demandDate,
        planReleaseDate: r.planReleaseDate,
        planExecDate: r.planReleaseDate,
        ...(showSupplier ? { supplier: r.supplier } : {}),
        remark: r.remark,
      })),
    )
  }

  const handleClose = () => {
    setRows([])
    onClose()
  }

  return (
    <Modal
      title={`拆分计划 - ${record?.planNo || ''}`}
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText="确认拆分"
      cancelText="取消"
      width={showSupplier ? 980 : 860}
      destroyOnClose
    >
      {record && (
        <div className="split-modal-info">
          <span>产品：{record.productCode} / {record.productName}</span>
          <span>原计划数量：<strong>{record.planQty}</strong> {record.unit}</span>
        </div>
      )}

      <div className="split-modal-table">
        <div className="split-modal-header">
          <span className="split-col-index">序号</span>
          <span className="split-col-qty">计划数量</span>
          <span className="split-col-date">需求日期</span>
          <span className="split-col-exec-date">计划下发日期</span>
          {showSupplier && <span className="split-col-supplier">供应商</span>}
          <span className="split-col-remark">备注</span>
          <span className="split-col-action">操作</span>
        </div>

        {rows.map((row, index) => (
          <div key={row.id} className="split-modal-row">
            <span className="split-col-index">{index + 1}</span>
            <span className="split-col-qty">
              <InputNumber
                min={1}
                value={row.planQty}
                onChange={(val) => handleRowChange(row.id, 'planQty', val || 0)}
                style={{ width: '100%' }}
                size="small"
              />
            </span>
            <span className="split-col-date">
              <DatePicker
                value={row.demandDate ? dayjs(row.demandDate) : null}
                onChange={(_, dateStr) => handleRowChange(row.id, 'demandDate', dateStr as string)}
                style={{ width: '100%' }}
                size="small"
              />
            </span>
            <span className="split-col-exec-date">
              <DatePicker
                value={row.planReleaseDate ? dayjs(row.planReleaseDate) : null}
                onChange={(_, dateStr) => handleRowChange(row.id, 'planReleaseDate', dateStr as string)}
                style={{ width: '100%' }}
                size="small"
              />
            </span>
            {showSupplier && (
              <span className="split-col-supplier">
                <Input
                  value={row.supplier}
                  onChange={(e) => handleRowChange(row.id, 'supplier', e.target.value)}
                  size="small"
                  placeholder="供应商"
                />
              </span>
            )}
            <span className="split-col-remark">
              <Input
                value={row.remark}
                onChange={(e) => handleRowChange(row.id, 'remark', e.target.value)}
                size="small"
                placeholder="备注"
              />
            </span>
            <span className="split-col-action">
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveRow(row.id)}
                disabled={rows.length <= 2}
              />
            </span>
          </div>
        ))}

        <div className="split-modal-footer-row">
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddRow}>
            添加拆分行
          </Button>
          <span className={`split-modal-total ${remaining !== 0 ? 'error' : ''}`}>
            合计：{totalQty} / {record?.planQty || 0}
            {remaining !== 0 && (
              <span className="split-modal-diff">（差额：{remaining > 0 ? `+${remaining}` : remaining}）</span>
            )}
          </span>
        </div>
      </div>
    </Modal>
  )
}

export default SplitModal
