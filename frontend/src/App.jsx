import React from 'react'
import Menu from './pages/Menu'
import Kitchen from './pages/Kitchen'
import LoyaltyPage from './pages/LoyaltyPage'
import MenuManager from './pages/MenuManager'
import ARViewer from './pages/ARViewer'
import QRPage from './pages/QRPage'
import Navbar from './pages/Navbar'

export default function App() {
  const path = window.location.pathname

  let PageComponent = Menu

  if (path === '/kitchen') PageComponent = Kitchen
  else if (path === '/loyalty') PageComponent = LoyaltyPage
  else if (path === '/manage') PageComponent = MenuManager
  else if (path === '/qr') PageComponent = QRPage
  else if (path === '/ar') PageComponent = ARViewer

  return (
    <>
      <Navbar />
      <PageComponent />
    </>
  )
}