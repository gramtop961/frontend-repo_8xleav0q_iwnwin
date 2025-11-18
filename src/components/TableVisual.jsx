import React from 'react'
import { motion } from 'framer-motion'

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angle = (angleDeg - 90) * (Math.PI / 180)
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

export default function TableVisual({ table, scale = 1, onSeatClick }) {
  const { shape, width, height, rotation, seats = [], color } = table
  const w = width * scale
  const h = height * scale
  const seatSize = Math.max(10, Math.min(w, h) * 0.12)

  const cx = w / 2
  const cy = h / 2

  const seatPositions = seats.map((s, i) => {
    if (shape === 'round') {
      const radius = Math.min(w, h) * 0.55
      const angle = (360 / seats.length) * i + rotation
      const { x, y } = polarToCartesian(cx, cy, radius / 2, angle)
      return { x, y, ...s }
    }
    // rectangular: distribute around perimeter
    const perim = 2 * (w + h)
    const step = perim / seats.length
    const d = step * i + (rotation / 360) * perim
    let x, y
    if (d <= w) {
      x = d
      y = 0
    } else if (d <= w + h) {
      x = w
      y = d - w
    } else if (d <= 2 * w + h) {
      x = 2 * w + h - d
      y = h
    } else {
      x = 0
      y = perim - d
    }
    return { x, y, ...s }
  })

  const shadow = `0 20px 60px rgba(0,0,0,0.25), 0 0 0 2px ${color || 'rgba(255,255,255,0.08)'} inset`
  const glow = color || 'rgba(59,130,246,0.4)'

  return (
    <motion.div
      className="relative"
      style={{ width: w, height: h }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      {/* Table shape */}
      <div
        className={`absolute inset-0 ${shape === 'round' ? 'rounded-full' : 'rounded-xl'}`}
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), rgba(255,255,255,0.08) 40%, transparent 70%)',
          boxShadow: shadow,
          border: '1px solid rgba(255,255,255,0.1)',
          transform: `rotate(${rotation}deg)`
        }}
      />

      {/* Seats */}
      {seatPositions.map((seat, idx) => (
        <button
          key={idx}
          onClick={() => onSeatClick?.(idx, seat)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
            seat.reserved
              ? 'bg-rose-500/80 hover:bg-rose-500 text-white'
              : 'bg-emerald-400/90 hover:bg-emerald-300 text-emerald-950'
          }`}
          style={{
            left: seat.x,
            top: seat.y,
            width: seatSize,
            height: seatSize,
            boxShadow: `0 0 0 3px rgba(0,0,0,0.25), 0 0 20px ${seat.reserved ? 'rgba(244,63,94,0.6)' : 'rgba(16,185,129,0.6)'}`,
            backdropFilter: 'blur(4px)'
          }}
          title={seat.label}
        >
          <span className="text-[10px] font-extrabold drop-shadow-sm select-none">
            {seat.label}
          </span>
        </button>
      ))}

      {/* Label */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-xs tracking-wide font-semibold text-white/90">
        {table.name}
      </div>

      {/* Aura glow */}
      <div
        className="absolute -inset-6 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(60% 60% at 50% 50%, ${glow} 0%, transparent 70%)`,
          opacity: 0.35,
          filter: 'blur(16px)'
        }}
      />
    </motion.div>
  )
}
