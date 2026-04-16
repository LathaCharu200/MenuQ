import React from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN = import.meta.env.VITE_ADMIN_TOKEN || ''
// const TOKEN = 'restaurant@123'


console.log('API =', API)
console.log('TOKEN =', TOKEN)

const authHeaders = {
  'Content-Type': 'application/json',
  'x-token': TOKEN
}

export default function Kitchen() {
  const [orders, setOrders] = React.useState([])
  const [error, setError] = React.useState('')

  async function load() {
    try {
      setError('')

      const r = await fetch(`${API}/orders/active`, {
        headers: authHeaders
      })

      const data = await r.json()

      if (!r.ok) {
        setError(data.detail || 'Could not load orders')
        return
      }

      setOrders(data)
    } catch (e) {
      setError('Could not connect to server')
      console.error(e)
    }
  }

  React.useEffect(() => {
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  async function updateStatus(id, status) {
    try {
      setError('')

      const r = await fetch(`${API}/orders/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status })
      })

      const data = await r.json()

      if (!r.ok) {
        setError(data.detail || 'Could not update status')
        return
      }

      load()
    } catch (e) {
      setError('Could not connect to server')
      console.error(e)
    }
  }

  const statusColors = {
    pending: { bg: '#1e3a5f', border: '#3b82f6', badge: '#3b82f6' },
    preparing: { bg: '#1c3a2a', border: '#f59e0b', badge: '#f59e0b' },
    ready: { bg: '#14532d', border: '#22c55e', badge: '#22c55e' }
  }

  return (
    <div
      style={{
        padding: 16,
        fontFamily: 'sans-serif',
        background: '#0f172a',
        minHeight: '100vh',
        color: '#fff'
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#38bdf8' }}>
        Kitchen Screen
      </div>

      <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
        Refreshes every 3 seconds
      </div>

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 16,
            fontSize: 13
          }}
        >
          {error}
        </div>
      )}

      {orders.length === 0 && !error && (
        <div style={{ textAlign: 'center', marginTop: 80, color: '#334155' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍🍳</div>
          <div>Waiting for orders...</div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
          gap: 12
        }}
      >
        {orders.map(order => {
          const c = statusColors[order.status] || statusColors.pending

          return (
            <div
              key={order.id}
              style={{
                background: c.bg,
                borderRadius: 12,
                padding: 14,
                border: `1px solid ${c.border}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                  Table {order.table_number}
                </span>

                <span
                  style={{
                    background: c.badge,
                    borderRadius: 20,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                {order.created_at
                  ? new Date(order.created_at).toLocaleTimeString()
                  : ''}
              </div>

              {(order.order_items || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 14,
                    color: '#cbd5e1',
                    marginBottom: 3
                  }}
                >
                  {item.quantity}x {item.item_name}
                </div>
              ))}

              <div style={{ fontWeight: 700, color: '#fbbf24', marginTop: 8 }}>
                €{Number(order.total_amount || 0).toFixed(2)}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(order.id, 'preparing')}
                    style={{
                      flex: 1,
                      background: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Start Preparing
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateStatus(order.id, 'ready')}
                    style={{
                      flex: 1,
                      background: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Mark Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={() => updateStatus(order.id, 'done')}
                    style={{
                      flex: 1,
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Done
                  </button>
                )}

                <button
                  onClick={() => updateStatus(order.id, 'cancelled')}
                  style={{
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}