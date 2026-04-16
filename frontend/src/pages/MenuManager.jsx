import React from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function MenuManager() {
  const [password, setPassword] = React.useState('')
  const [token, setToken] = React.useState('')
  const [loggedIn, setLoggedIn] = React.useState(false)
  const [restName, setRestName] = React.useState('')
  const [categories, setCategories] = React.useState([])
  const [items, setItems] = React.useState([])
  const [adding, setAdding] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const [form, setForm] = React.useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_special: false
  })

  const authHeaders = currentToken => ({
    'Content-Type': 'application/json',
    'x-token': currentToken
  })

  async function login() {
    if (!password.trim()) {
      setError('Please enter password')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/manage/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Wrong password')
        setLoading(false)
        return
      }

      setToken(data.token)
      setRestName(data.name || '')
      setLoggedIn(true)
    } catch (e) {
      setError('Cannot connect to server')
    }

    setLoading(false)
  }

  async function loadMenu() {
    setError('')

    try {
      const res = await fetch(`${API}/menu`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Could not load menu')
        return
      }

      setCategories(data.categories || [])
      setItems(Object.values(data.items || {}).flat())
    } catch (e) {
      setError('Cannot connect to server')
    }
  }

  React.useEffect(() => {
    if (loggedIn) {
      loadMenu()
    }
  }, [loggedIn])

  async function addItem() {
    if (!form.name.trim() || !form.price || !form.category_id) {
      setError('Name, price and category are required')
      return
    }

    setError('')

    try {
      const res = await fetch(`${API}/manage/items`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: parseFloat(form.price),
          category_id: form.category_id,
          image_url: form.image_url.trim(),
          is_special: form.is_special
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Failed to add item')
        return
      }

      setAdding(false)
      setForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_special: false
      })

      loadMenu()
    } catch (e) {
      setError('Cannot connect to server')
    }
  }

  async function patch(id, fields) {
    setError('')

    try {
      const res = await fetch(`${API}/manage/items/${id}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(fields)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Failed to update item')
        return
      }

      loadMenu()
    } catch (e) {
      setError('Cannot connect to server')
    }
  }

  async function del(id) {
    if (!window.confirm('Delete this item?')) return

    setError('')

    try {
      const res = await fetch(`${API}/manage/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Failed to delete item')
        return
      }

      loadMenu()
    } catch (e) {
      setError('Cannot connect to server')
    }
  }

  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Owner Login</div>
        </div>

        {error && (
          <div
            style={{
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              marginBottom: 12
            }}
          >
            {error}
          </div>
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{
            width: '100%',
            padding: '11px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 12,
            boxSizing: 'border-box'
          }}
        />

        <button
          onClick={login}
          style={{
            width: '100%',
            background: '#9333EA',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          Password is bcrypt hashed in database
        </div>
      </div>
    )
  }

  const specials = items.filter(i => i.is_special)

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', fontFamily: 'sans-serif', padding: 16 }}>
      <div
        style={{
          background: '#9333EA',
          color: '#fff',
          borderRadius: 12,
          padding: '13px 16px',
          marginBottom: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{restName}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Menu Manager</div>
        </div>

        <button
          onClick={() => window.open('/', '_blank')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            borderRadius: 7,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 11
          }}
        >
          View menu ↗
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            marginBottom: 12
          }}
        >
          {error}
        </div>
      )}

      {specials.length > 0 && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: 10,
            padding: '10px 13px',
            marginBottom: 12
          }}
        >
          <div style={{ fontWeight: 700, color: '#92400E', fontSize: 12, marginBottom: 6 }}>
            Today's Specials ({specials.length})
          </div>

          {specials.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: '#78350F',
                marginBottom: 3
              }}
            >
              <span>
                {item.name} — €{Number(item.price).toFixed(2)}
              </span>

              <button
                onClick={() => patch(item.id, { is_special: false })}
                style={{
                  fontSize: 11,
                  color: '#92400E',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setAdding(current => !current)}
        style={{
          width: '100%',
          background: adding ? '#F3E8FF' : '#9333EA',
          color: adding ? '#9333EA' : '#fff',
          border: adding ? '1px solid #9333EA' : 'none',
          borderRadius: 10,
          padding: '11px',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 12
        }}
      >
        {adding ? '✕ Cancel' : '+ Add New Dish'}
      </button>

      {adding && (
        <div
          style={{
            border: '1px solid #E9D5FF',
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            background: '#FAFAFA'
          }}
        >
          {[
            ['Dish name *', 'name', 'text', 'e.g. Pasta Carbonara'],
            ['Description', 'description', 'text', 'e.g. Creamy egg sauce'],
            ['Price (€) *', 'price', 'number', '13.50'],
            ['Photo URL', 'image_url', 'text', 'https://images.unsplash.com/...']
          ].map(([label, field, type, placeholder]) => (
            <div key={field} style={{ marginBottom: 9 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{label}</div>

              <input
                type={type}
                placeholder={placeholder}
                value={form[field]}
                onChange={e => setForm(current => ({ ...current, [field]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 7,
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 9 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Category *</div>

            <select
              value={form.category_id}
              onChange={e => setForm(current => ({ ...current, category_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 7,
                fontSize: 13
              }}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            <input
              type="checkbox"
              checked={form.is_special}
              onChange={e => setForm(current => ({ ...current, is_special: e.target.checked }))}
            />
            Mark as Today's Special
          </label>

          <button
            onClick={addItem}
            style={{
              width: '100%',
              background: '#9333EA',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Add Dish
          </button>
        </div>
      )}

      {categories.map(category => (
        <div key={category.id} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 11,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '6px 0',
              borderBottom: '2px solid #f1f5f9',
              marginBottom: 8
            }}
          >
            {category.name} ({items.filter(item => item.category_id === category.id).length})
          </div>

          {items
            .filter(item => item.category_id === category.id)
            .map(item => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #f1f5f9',
                  borderRadius: 9,
                  padding: '10px 12px',
                  marginBottom: 8,
                  opacity: item.is_available ? 1 : 0.45,
                  background: item.is_special ? '#FFFBEB' : '#fff'
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 7,
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>

                      {item.is_special && (
                        <span
                          style={{
                            background: '#FCD34D',
                            color: '#78350F',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 20
                          }}
                        >
                          SPECIAL
                        </span>
                      )}

                      {!item.is_available && (
                        <span
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 20
                          }}
                        >
                          OFF
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {item.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>€</span>

                    <input
                      type="number"
                      defaultValue={Number(item.price).toFixed(2)}
                      step="0.50"
                      min="0"
                      onBlur={e => {
                        const newPrice = parseFloat(e.target.value)
                        if (!Number.isNaN(newPrice)) {
                          patch(item.id, { price: newPrice })
                        }
                      }}
                      style={{
                        width: 58,
                        padding: '4px 6px',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#2563eb',
                        textAlign: 'right'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => patch(item.id, { is_available: !item.is_available })}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: item.is_available ? '#DCFCE7' : '#FEE2E2',
                      color: item.is_available ? '#166534' : '#991B1B'
                    }}
                  >
                    {item.is_available ? '✓ Available' : '✕ Unavailable'}
                  </button>

                  <button
                    onClick={() => patch(item.id, { is_special: !item.is_special })}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: item.is_special ? '#FEF3C7' : '#F1F5F9',
                      color: item.is_special ? '#92400E' : '#475569'
                    }}
                  >
                    {item.is_special ? '⭐ Special' : 'Mark special'}
                  </button>

                  <button
                    onClick={() => del(item.id)}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      background: '#FEE2E2',
                      color: '#991B1B',
                      fontWeight: 600,
                      marginLeft: 'auto'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}