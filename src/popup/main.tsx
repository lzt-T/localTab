import React from 'react'
import ReactDOM from 'react-dom/client'
import PopupApp from '@/popup'
import '@/i18n'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
)
