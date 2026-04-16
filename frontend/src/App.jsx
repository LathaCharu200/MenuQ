import React from 'react'
import Menu from './pages/Menu'
import Kitchen from './pages/Kitchen'
import LoyaltyPage from './pages/LoyaltyPage'
import MenuManager from './pages/MenuManager'
import ARViewer from './pages/ARViewer'
import QRPage from './pages/QRPage'


export default function App() {
  const path = window.location.pathname
  if(path==='/kitchen') return <Kitchen />
  if(path==='/loyalty') return <LoyaltyPage />
  if(path==='/manage') return <MenuManager />
  if(path==='/ar') return <ARViewer />
  if(path==='/qr') return <QRPage />
  return <Menu />
}