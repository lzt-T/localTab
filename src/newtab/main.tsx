import React from 'react'
import ReactDOM from 'react-dom/client'
import NewTabApp from '@/newtab'
import '@/i18n'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NewTabApp />
  </React.StrictMode>,
)
