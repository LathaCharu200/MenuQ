import React from 'react'

export default function Navbar() {
  const path = window.location.pathname

  const linkStyle = currentPath => ({
    padding: '8px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    color: path === currentPath ? '#fff' : '#cbd5e1',
    background: path === currentPath ? '#7C3AED' : 'transparent'
  })

  return (
    <div style={{ background: '#1e293b', width: '100%' }}>
      <div
        style={{
          maxWidth: 430,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
          🍽️ MenuQ
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/" style={linkStyle('/')}>Menu</a>
          <a href="/loyalty" style={linkStyle('/loyalty')}>Loyalty</a>
          <a href="/manage" style={linkStyle('/manage')}>Manager</a>
          <a href="/kitchen" style={linkStyle('/kitchen')}>Kitchen</a>
          <a href="/qr" style={linkStyle('/qr')}>QR</a>
        </div>
      </div>
    </div>
  )
}