import React from 'react'

export default function ARViewer() {
  const p = new URLSearchParams(window.location.search)
  const modelUrl = p.get('model')
  const name = p.get('name') || 'Dish'
  const price = p.get('price') || '0'

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div
        style={{
          background: '#1e293b',
          color: '#fff',
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: 7,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ← Back
        </button>

        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            Rotate in 3D or view on table in AR
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          minHeight: 300,
          background: 'linear-gradient(135deg,#f8f4ef,#ede8e0)'
        }}
      >
        {modelUrl ? (
          <model-viewer
            src={modelUrl}
            alt={name}
            ar
            ar-modes="scene-viewer quick-look webxr"
            camera-controls
            auto-rotate
            style={{ width: '100%', height: '300px' }}
          />
        ) : (
          <div
            style={{
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: 13
            }}
          >
            3D model not available
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
        <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 17, marginTop: 4 }}>
          €{Number(price).toFixed(2)}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <button
          onClick={() => window.history.back()}
          style={{
            width: '100%',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '13px',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer'
          }}
        >
          + Add to Order
        </button>
      </div>
    </div>
  )
}