import React from 'react'

export default function ARViewer() {
  const p = new URLSearchParams(window.location.search)
  const modelUrl = p.get('model')
  const name = p.get('name') || 'Dish'
  const price = p.get('price') || '0'

  return (
    <div
      style={{
        maxWidth: 430,
        margin: '0 auto',
        fontFamily: 'sans-serif',
        background: '#0b0f1a',
        minHeight: '100vh',
        color: '#fff'
      }}
    >
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
          height: 430,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
            shadow-intensity="1.5"
            exposure="1.1"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000'
            }}
          />
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            3D model not available
          </div>
        )}
      </div>

      <div style={{ padding: '18px 16px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ fontWeight: 700, fontSize: 17, textAlign: 'center' }}>{name}</div>
        <div
          style={{
            fontWeight: 700,
            color: '#4f6cff',
            fontSize: 17,
            marginTop: 8,
            textAlign: 'center'
          }}
        >
          €{Number(price).toFixed(2)}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <button
          onClick={() => window.history.back()}
          style={{
            width: '100%',
            background: '#4f6cff',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          + Add to Order
        </button>
      </div>
    </div>
  )
}