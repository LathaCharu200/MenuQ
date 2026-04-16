import React from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function ARViewer() {
  const p        = new URLSearchParams(window.location.search)
  const modelUrl = p.get('model')
  const name     = p.get('name')
  const price    = p.get('price')
  const mountRef = React.useRef(null)
  const [loading, setLoading] = React.useState(true)
  const [error,   setError]   = React.useState(false)

  React.useEffect(() => {
    if (!mountRef.current || !modelUrl) return
    const el = mountRef.current
    const W  = el.clientWidth
    const H  = 300

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)
    el.appendChild(renderer.domElement)
    camera.position.set(0, 1, 3)

    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const dl = new THREE.DirectionalLight(0xffffff, 1.5)
    dl.position.set(5, 10, 5)
    scene.add(dl)

    let rotY = 0, rotX = 0.15, drag = false, lx = 0, ly = 0

    const dn = e => {
      drag = true
      lx = e.clientX || (e.touches?.[0]?.clientX || 0)
      ly = e.clientY || (e.touches?.[0]?.clientY || 0)
    }
    const mv = e => {
      if (!drag) return
      const x = e.clientX || (e.touches?.[0]?.clientX || 0)
      const y = e.clientY || (e.touches?.[0]?.clientY || 0)
      rotY += (x - lx) * 0.012
      rotX += (y - ly) * 0.008
      rotX = Math.max(-0.6, Math.min(0.6, rotX))
      lx = x; ly = y
    }
    const up = () => drag = false

    el.addEventListener('mousedown', dn)
    el.addEventListener('mousemove', mv)
    el.addEventListener('mouseup', up)
    el.addEventListener('touchstart', dn)
    el.addEventListener('touchmove', mv)
    el.addEventListener('touchend', up)

    new GLTFLoader().load(
      modelUrl,
      gltf => {
        const model = gltf.scene
        const box   = new THREE.Box3().setFromObject(model)
        model.position.sub(box.getCenter(new THREE.Vector3()))
        const size  = box.getSize(new THREE.Vector3())
        model.scale.setScalar(1.8 / Math.max(size.x, size.y, size.z))
        scene.add(model)
        setLoading(false)

        const animate = () => {
          requestAnimationFrame(animate)
          if (!drag) rotY += 0.006
          model.rotation.y = rotY
          model.rotation.x = rotX
          renderer.render(scene, camera)
        }
        animate()
      },
      undefined,
      () => setError(true)
    )

    return () => {
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      el.removeEventListener('mousedown', dn)
      el.removeEventListener('mousemove', mv)
      el.removeEventListener('mouseup', up)
      el.removeEventListener('touchstart', dn)
      el.removeEventListener('touchmove', mv)
      el.removeEventListener('touchend', up)
    }
  }, [modelUrl])

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1e293b', color: '#fff', padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>Drag to rotate · pinch to zoom</div>
        </div>
      </div>

      <div ref={mountRef} style={{ width: '100%', height: 300,
        background: 'linear-gradient(135deg,#f8f4ef,#ede8e0)',
        cursor: 'grab', touchAction: 'none', position: 'relative' }}>
        {loading && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', fontSize: 13 }}>
            Loading 3D model...
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8, color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontSize: 32 }}>🍽️</div>
            <div>3D preview not available</div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
        <div style={{ fontWeight: 700, color: '#2563eb', fontSize: 17, marginTop: 4 }}>
          €{Number(price || 0).toFixed(2)}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <button onClick={() => window.history.back()}
          style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          + Add to Order
        </button>
      </div>
    </div>
  )
}