import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

const theme = {
  token: {
    colorPrimary: '#02b980', // 绿色作为主色调
    colorLink: '#1890ff', // 链接使用蓝色
    colorSuccess: '#02b980', // 成功状态使用绿色
    colorInfo: '#1890ff', // 信息状态使用蓝色
    borderRadius: 4,
  },
  components: {
    Menu: {
      darkItemBg: 'rgba(0, 0, 0, 0.85)',
      darkSubMenuItemBg: 'rgba(0, 0, 0, 0.85)',
      darkItemSelectedBg: '#5c5c5c',
      darkItemColor: '#fff',
      itemSelectedBg: 'rgba(255, 255, 255, 0.08)',
      itemSelectedColor: '#fff',
      itemHoverBg: 'rgba(255, 255, 255, 0.1)',
      subMenuItemBg: 'transparent',
    },
    Button: {
      primaryColor: '#fff',
    },
    Checkbox: {
      colorPrimary: '#02b980',
    },
    Switch: {
      colorPrimary: '#02b980',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
