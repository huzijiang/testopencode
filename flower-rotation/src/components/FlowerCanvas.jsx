import { useRef, useEffect, useState, useCallback } from 'react'
import { COLOR_SCHEMES } from '../data/flowers'
import './FlowerCanvas.css'

export default function FlowerCanvas({ flower, speed, isPlaying, petalCount, colorScheme, error }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const angleRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 600 })

  const schemeColors = COLOR_SCHEMES.find((s) => s.id === colorScheme)?.colors

  useEffect(() => {
    const el = canvasRef.current?.parentElement
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        const size = Math.min(width, 600)
        setCanvasSize({ w: size, h: size })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const drawPetal = useCallback((ctx, cx, cy, angle, length, width, color, alpha) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(width * length * 0.5, -length * 0.3, width * length, -length * 0.6, 0, -length)
    ctx.bezierCurveTo(-width * length, -length * 0.6, -width * length * 0.5, -length * 0.3, 0, 0)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.restore()
  }, [])

  const drawCenter = useCallback((ctx, cx, cy, radius, color) => {
    ctx.save()
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0, '#fff')
    grad.addColorStop(0.3, color)
    grad.addColorStop(1, darken(color, 0.3))
    ctx.fillStyle = grad
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || error) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const { w, h } = canvasSize

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)

    const cx = w / 2
    const cy = h / 2
    const baseRadius = Math.min(w, h) * 0.4

    function getColors(flower, schemeColors) {
      if (schemeColors) return schemeColors
      return flower?.colors || ['#ff6b81', '#ff4d6d', '#c9184a', '#ff2d55']
    }

    function render() {
      ctx.clearRect(0, 0, w, h)

      // Draw background particles
      drawParticles(ctx, w, h, angleRef.current)

      const colors = getColors(flower, schemeColors)
      const count = petalCount || flower?.petals || 12
      const layers = flower?.layers || 1
      const pw = flower?.petalWidth || 0.3
      const pl = flower?.petalLength || 0.85

      // Mouse influence
      let mx = 0, my = 0
      if (mouseRef.current.active) {
        mx = (mouseRef.current.x - cx) / cx
        my = (mouseRef.current.y - cy) / cy
      }

      for (let layer = 0; layer < layers; layer++) {
        const layerScale = 1 - layer * 0.22
        const layerOffset = (layer * Math.PI) / (count * 0.7)
        const alpha = 1 - layer * 0.2

        for (let i = 0; i < count; i++) {
          const baseAngle = (i / count) * Math.PI * 2 + angleRef.current + layerOffset
          const petalAngle = baseAngle + Math.sin(angleRef.current * 0.5 + i * 0.3) * 0.08 + mx * 0.15
          const len = baseRadius * pl * layerScale
          const wid = pw + my * 0.05
          const color = colors[i % colors.length]

          drawPetal(ctx, cx, cy, petalAngle, len, wid, color, alpha)
        }
      }

      // Center
      drawCenter(ctx, cx, cy, baseRadius * 0.15, flower?.centerColor || '#ffd166')

      if (isPlaying) {
        angleRef.current += speed * 0.015
      }

      animRef.current = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animRef.current)
  }, [canvasSize, flower, speed, isPlaying, petalCount, colorScheme, schemeColors, error, drawPetal, drawCenter])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { ...mouseRef.current, active: false }
  }, [])

  if (error) {
    return (
      <div className="flower-canvas-wrapper">
        <div className="flower-canvas error-state">{error}</div>
      </div>
    )
  }

  return (
    <div className="flower-canvas-wrapper" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <canvas ref={canvasRef} className="flower-canvas" />
      <div className="flower-info-badge">{flower?.name || '鲜花'}</div>
    </div>
  )
}

function drawParticles(ctx, w, h, angle) {
  const count = 30
  for (let i = 0; i < count; i++) {
    const seed = i * 137.508
    const x = ((seed * 7.3 + angle * 20 * ((i % 3) + 1)) % w + w) % w
    const y = ((seed * 11.7 + Math.sin(angle + i) * 30) % h + h) % h
    const r = 1 + (i % 3) * 0.5
    const alpha = 0.15 + Math.sin(angle * 2 + i) * 0.1
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function darken(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount))
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount))
  return `rgb(${r},${g},${b})`
}
