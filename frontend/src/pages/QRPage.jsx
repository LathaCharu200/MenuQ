import React from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function QRPage() {
  const qrUrl = `${API}/qr`

  return (
    <div style={{
      maxWidth: 420,
      margin: '0 auto',
      padding: 20,
      fontFamily: 'sans-serif',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
        📱 Scan to Order
      </div>

      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        Customers can scan this QR code to open the menu
      </div>

      <div style={{
        background: '#fff',
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        display: 'inline-block'
      }}>
        <img
          src={qrUrl}
          alt="QR Code"
          style={{ width: 220, height: 220 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <a
          href={qrUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            color: '#2563eb',
            textDecoration: 'none'
          }}
        >
          Open QR in new tab ↗
        </a>
      </div>
    </div>
  )
}