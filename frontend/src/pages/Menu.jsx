import React from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Menu() {
  const [data, setData] = React.useState(null)
  const [cart, setCart] = React.useState([])
  const [phone, setPhone] = React.useState('')
  const [tableNumber, setTableNumber] = React.useState('')
  const [step, setStep] = React.useState('menu')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch(`${API}/menu`)
        const result = await res.json()
        if (!res.ok) { setError(result.detail || 'Could not load menu'); return }
        setData(result)
      } catch (e) {
        setError('Could not connect to server')
      }
    }
    loadMenu()
  }, [])

  const allItems = data ? Object.values(data.items).flat() : []
  const specials = allItems.filter(i => i.is_special)
  const total = cart.reduce((sum, item) => sum + Number(item.price), 0)

  async function placeOrder() {
    setError('')
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: tableNumber || 'Table 1',
          customer_phone: phone || null,
          items: cart.map(i => ({ item_id: i.id }))
        })
      })
      const result = await res.json()
      if (!res.ok) { setError(result.detail || 'Order failed'); return }
      setStep('done')
    } catch (e) {
      setError('Could not connect to server')
    }
  }

  if (error && !data) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ color: '#991B1B', marginBottom: 8 }}>{error}</div>
        <div style={{ color: '#94a3b8' }}>Please refresh and try again.</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontFamily: 'sans-serif' }}>
        Loading menu...
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Order received!</div>
        <div style={{ color: '#64748b' }}>Your food is being prepared</div>
        {phone && (
          <div style={{ color: '#2563eb', fontSize: 13, marginTop: 10 }}>
            Points added to {phone}
          </div>
        )}
        <button
          onClick={() => { setCart([]); setPhone(''); setTableNumber(''); setError(''); setStep('menu') }}
          style={{ marginTop: 20, background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13 }}
        >
          Back to menu
        </button>
      </div>
    )
  }

  // ─── ITEM CARD ────────────────────────────────────────────────────────────
  const ItemCard = ({ item }) => (
    <div
      onClick={() => setCart(c => [...c, item])}
      style={{
        padding: '13px 16px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        gap: 12,
        cursor: 'pointer',
        background: '#fff'
      }}
    >
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />
      )}

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</span>

          {item.is_special && (
            <span style={{ background: '#FCD34D', color: '#78350F', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>
              SPECIAL
            </span>
          )}

          {/* ✅ 3D BUTTON — only shows when model_url exists */}
          {item.model_url && (
            <button
              onClick={e => {
                e.stopPropagation() // prevent adding to cart when tapping 3D
                window.location.href =
                  '/ar?model=' + encodeURIComponent(item.model_url) +
                  '&name='  + encodeURIComponent(item.name) +
                  '&price=' + item.price
              }}
              style={{
                background: '#7C3AED',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 10,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              3D
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
          {item.description}
        </div>

        <div style={{ fontWeight: 700, color: '#2563eb', marginTop: 5, fontSize: 15 }}>
          €{Number(item.price).toFixed(2)}
        </div>
      </div>

      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: '#2563eb', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0, alignSelf: 'center'
      }}>
        +
      </div>
    </div>
  )
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: 80 }}>
      <div style={{ background: '#1e293b', color: '#fff', padding: '18px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{data.restaurant_name}</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 3 }}>Tap a dish to order</div>
      </div>

      {specials.length > 0 && (
        <div>
          <div style={{ padding: '9px 16px', background: '#FEF9C3', fontSize: 11, fontWeight: 700, color: '#713F12', textTransform: 'uppercase' }}>
            ⭐ Today's Specials
          </div>
          {specials.map(i => <ItemCard key={i.id} item={i} />)}
        </div>
      )}

      {data.categories.map(cat => (
        <div key={cat.id}>
          <div style={{ padding: '9px 16px', background: '#f1f5f9', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            {cat.name}
          </div>
          {(data.items[cat.id] || []).map(i => <ItemCard key={i.id} item={i} />)}
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid #f1f5f9' }}>
        <a href="/loyalty" style={{ color: '#2563eb', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
          ⭐ Check your loyalty points →
        </a>
      </div>

      {cart.length > 0 && step === 'menu' && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, background: '#2563eb', color: '#fff',
          padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', boxSizing: 'border-box'
        }}>
          <span>{cart.length} item{cart.length > 1 ? 's' : ''}</span>
          <button
            onClick={() => setStep('checkout')}
            style={{ background: '#fff', color: '#2563eb', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}
          >
            Order — €{total.toFixed(2)}
          </button>
        </div>
      )}

      {step === 'checkout' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 99 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 430, borderRadius: '16px 16px 0 0', padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Your Order</div>

            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13 }}>
                <span>{item.name}</span>
                <span>
                  €{Number(item.price).toFixed(2)}
                  <button
                    onClick={() => setCart(c => c.filter((_, idx) => idx !== i))}
                    style={{ marginLeft: 8, color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                  >✕</button>
                </span>
              </div>
            ))}

            <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1f5f9', marginBottom: 12 }}>
              <span>Total</span><span>€{total.toFixed(2)}</span>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <input
              placeholder="Phone number (earn loyalty points)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, marginBottom: 4, boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
              €1 = 10 points · 500 points = free dessert
            </div>

            <input
              placeholder="Table number (e.g. Table 4)"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }}
            />

            <button
              onClick={placeOrder}
              style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Place Order
            </button>

            <button
              onClick={() => setStep('menu')}
              style={{ width: '100%', background: 'none', border: 'none', color: '#94a3b8', padding: '10px', cursor: 'pointer', fontSize: 13, marginTop: 4 }}
            >
              Back to menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}