import { useEffect, useMemo, useState } from 'react'
import { Drawer, Form, InputNumber, DatePicker, Input, Button, Descriptions, Table, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PlanOrderItem, PlanMaterialItem } from '@/types/supply-demand'
import dayjs from 'dayjs'

interface EditDrawerProps {
  open: boolean
  record: PlanOrderItem | null
  showSupplier?: boolean
  onClose: () => void
  onSave: (updated: PlanOrderItem) => void
}

const EditDrawer: React.FC<EditDrawerProps> = ({ open, record, showSupplier = true, onClose, onSave }) => {
  const [form] = Form.useForm()
  const [materialList, setMaterialList] = useState<PlanMaterialItem[]>([])
  const isProductionPlan = !showSupplier

  const buildDefaultMaterialRows = useMemo<PlanMaterialItem[]>(
    () => [
      {
        key: 'mat_1',
        productCode: 'CP250012',
        productName: '半成品A',
        specification: '100*50*30mm',
        unitUsage: 1,
        demandQty: 300,
        issueProcess: '装配',
        remark: '-',
        customField: '-',
      },
      {
        key: 'mat_2',
        productCode: 'CP250013',
        productName: '半成品B',
        specification: '80*40*20mm',
        unitUsage: 1,
        demandQty: 300,
        issueProcess: '包装',
        remark: '-',
        customField: '-',
      },
    ],
    [],
  )

  const createBlankMaterial = () => ({
    key: `mat_${Date.now()}`,
    productCode: '',
    productName: '',
    specification: '',
    unitUsage: 1,
    demandQty: Number(form.getFieldValue('planQty')) || 0,
    issueProcess: '',
    remark: '',
    customField: '',
  })

  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        planQty: record.planQty,
        demandDate: record.demandDate ? dayjs(record.demandDate) : null,
        planReleaseDate: (record.planReleaseDate || record.planExecDate)
          ? dayjs(record.planReleaseDate || record.planExecDate)
          : null,
        supplier: record.supplier,
        remark: record.remark === '-' ? '' : record.remark,
      })
      if (isProductionPlan) {
        const nextMaterials = record.materialList?.length ? record.materialList : buildDefaultMaterialRows
        setMaterialList(nextMaterials.map((item, idx) => ({ ...item, key: item.key || `mat_${idx + 1}` })))
      } else {
        setMaterialList([])
      }
    }
  }, [open, record, form, isProductionPlan, buildDefaultMaterialRows])

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!record) return
      const updated: PlanOrderItem = {
        ...record,
        planQty: values.planQty,
        demandDate: values.demandDate?.format('YYYY-MM-DD') || record.demandDate,
        planReleaseDate: values.planReleaseDate?.format('YYYY-MM-DD') || record.planReleaseDate || record.planExecDate,
        planExecDate: values.planReleaseDate?.format('YYYY-MM-DD') || record.planReleaseDate || record.planExecDate,
        supplier: showSupplier ? (values.supplier || record.supplier) : record.supplier,
        remark: values.remark || '-',
        materialList: isProductionPlan ? materialList : record.materialList,
        updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
      onSave(updated)
    })
  }

  const handleClose = () => {
    form.resetFields()
    setMaterialList([])
    onClose()
  }

  const handleAddMaterial = () => {
    setMaterialList((prev) => [...prev, createBlankMaterial()])
  }

  const handleRefreshMaterialList = () => {
    message.success('已更新用料清单（演示）')
  }

  const handleDeleteMaterial = (key: string) => {
    setMaterialList((prev) => prev.filter((item) => item.key !== key))
  }

  const materialColumns: ColumnsType<PlanMaterialItem> = [
    { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 130, render: (text: string) => text || '-' },
    { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 130, render: (text: string) => text || '-' },
    { title: '产品规格', dataIndex: 'specification', key: 'specification', width: 140, render: (text: string) => text || '-' },
    { title: '单位用量', dataIndex: 'unitUsage', key: 'unitUsage', width: 90, align: 'right' },
    { title: '需求数量', dataIndex: 'demandQty', key: 'demandQty', width: 90, align: 'right' },
    { title: '投料工序', dataIndex: 'issueProcess', key: 'issueProcess', width: 120, render: (text: string) => text || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, render: (text: string) => text || '-' },
    { title: '自定义字段', dataIndex: 'customField', key: 'customField', width: 120, render: (text: string) => text || '-' },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_value, row) => (
        <Space size={4}>
          <Popconfirm
            title="确认删除该用料？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDeleteMaterial(row.key)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Drawer
      title={`修改计划 - ${record?.planNo || ''}`}
      placement="right"
      width={720}
      open={open}
      onClose={handleClose}
      destroyOnClose
      className="edit-drawer"
      extra={<Button onClick={handleClose}>关闭</Button>}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </div>
      }
    >
      {record && (
        <Descriptions
          column={3}
          size="small"
          bordered
          className="edit-drawer-info"
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="计划编号">{record.planNo}</Descriptions.Item>
          <Descriptions.Item label="产品编号">{record.productCode}</Descriptions.Item>
          <Descriptions.Item label="产品名称">{record.productName}</Descriptions.Item>
          <Descriptions.Item label="产品规格">{record.specification}</Descriptions.Item>
          <Descriptions.Item label="建议数量">{record.suggestedQty}</Descriptions.Item>
          <Descriptions.Item label="单位">{record.unit}</Descriptions.Item>
        </Descriptions>
      )}
      <Form form={form} layout="vertical">
        <Form.Item label="计划数量" name="planQty" rules={[{ required: true, message: '请输入计划数量' }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="需求日期" name="demandDate" rules={[{ required: true, message: '请选择需求日期' }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="计划下发日期"
            name="planReleaseDate"
            rules={[
              { required: true, message: '请选择下发日期' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const demandDate = getFieldValue('demandDate')
                  if (!value || !demandDate || dayjs(value).isBefore(dayjs(demandDate), 'day')) return Promise.resolve()
                  return Promise.reject(new Error('计划下发日期必须早于需求日期'))
                },
              }),
            ]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>
        {showSupplier && (
          <Form.Item label="默认供应商" name="supplier">
            <Input placeholder="请输入供应商" />
          </Form.Item>
        )}
        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
      </Form>
      {isProductionPlan && (
        <div className="edit-drawer-materials">
          <div className="edit-drawer-materials-header">
            <div className="edit-drawer-materials-title">用料清单</div>
            <Space size={8}>
              <Button icon={<PlusOutlined />} onClick={handleAddMaterial}>添加用料</Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefreshMaterialList}>更新用料清单</Button>
            </Space>
          </div>
          <Table<PlanMaterialItem>
            className="edit-drawer-materials-table"
            columns={materialColumns}
            dataSource={materialList}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 980, y: 240 }}
            locale={{ emptyText: '暂无用料，请点击“添加用料”' }}
          />
          <div className="edit-drawer-materials-footer">共 {materialList.length} 条记录</div>
        </div>
      )}
    </Drawer>
  )
}

export default EditDrawer
