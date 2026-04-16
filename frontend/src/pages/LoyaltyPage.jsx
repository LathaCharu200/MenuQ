import React from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoyaltyPage() {
  const [phone, setPhone] = React.useState('')
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [redeeming, setRedeeming] = React.useState(false)
  const [redeemed, setRedeemed] = React.useState(false)
  const [error, setError] = React.useState('')

  async function check() {
    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')
    setRedeemed(false)

    try {
      const res = await fetch(
        `${API}/loyalty?phone=${encodeURIComponent(phone.trim())}`
      )

      const result = await res.json()

      if (!res.ok) {
        setError(result.detail || 'Could not fetch loyalty info')
        setLoading(false)
        return
      }

      setData(result)
    } catch (e) {
      setError('Cannot connect to server')
    }

    setLoading(false)
  }

  async function redeem() {
    if (!phone.trim()) return

    setRedeeming(true)
    setError('')

    try {
      const res = await fetch(
        `${API}/loyalty/redeem?phone=${encodeURIComponent(phone.trim())}`,
        { method: 'POST' }
      )

      const result = await res.json()

      if (!res.ok) {
        setError(result.detail || 'Could not redeem reward')
        setRedeeming(false)
        return
      }

      setRedeemed(true)
      setData(current => ({
        ...current,
        points: result.points_remaining,
        can_redeem: false
      }))
    } catch (e) {
      setError('Cannot connect to server')
    }

    setRedeeming(false)
  }

  const pct = data
    ? Math.min(100, Math.round((data.points / data.threshold) * 100))
    : 0

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>⭐</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Your Rewards</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Enter your phone number
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          placeholder="+356 XX XXX XXX"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          style={{
            flex: 1,
            padding: '11px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 14
          }}
        />

        <button
          onClick={check}
          style={{
            background: '#BE185D',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '11px 18px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {loading ? '...' : 'Check'}
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

      {data && (
        <div>
          <div
            style={{
              background: '#1e293b',
              borderRadius: 16,
              padding: 20,
              color: '#fff',
              marginBottom: 14
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Your points</div>

            <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
              {data.points}
            </div>

            <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
              {data.visits} visit{data.visits !== 1 ? 's' : ''}
            </div>

            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  opacity: 0.7,
                  marginBottom: 6
                }}
              >
                <span>Progress</span>
                <span>
                  {data.points} / {data.threshold}
                </span>
              </div>

              <div
                style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 4
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    background: '#fbbf24',
                    width: `${pct}%`,
                    transition: 'width 0.5s'
                  }}
                />
              </div>

              {!data.can_redeem && (
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                  {Math.max(0, data.threshold - data.points)} more points for {data.reward}
                </div>
              )}
            </div>
          </div>

          {data.can_redeem && !redeemed && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
                marginBottom: 12
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#166534',
                  marginBottom: 8
                }}
              >
                🎉 You earned {data.reward}!
              </div>

              <button
                onClick={redeem}
                style={{
                  background: '#16A34A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 24px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {redeeming ? 'Redeeming...' : 'Redeem Now'}
              </button>
            </div>
          )}

          {redeemed && (
            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#92400E',
                  marginBottom: 4
                }}
              >
                ✓ Reward redeemed!
              </div>

              <div style={{ fontSize: 13, color: '#78350F' }}>
                Show this to your waiter. Remaining: {data.points} pts
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}