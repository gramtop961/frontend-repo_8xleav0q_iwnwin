import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import TableVisual from './components/TableVisual'

function App() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [message, setMessage] = useState('')

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const fetchTables = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/tables`)
      if (!res.ok) throw new Error('Failed to load tables')
      const data = await res.json()
      setTables(data.items || [])
    } catch (e) {
      setMessage('No tables found. Seeding demo layout...')
      // try to seed
      try {
        await fetch(`${baseUrl}/seed`, { method: 'POST' })
        const res2 = await fetch(`${baseUrl}/tables`)
        const data2 = await res2.json()
        setTables(data2.items || [])
      } catch (err) {
        setMessage('Failed to load demo layout')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const reserve = async (tableId, seatIdx, name) => {
    const res = await fetch(`${baseUrl}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: tableId, seat_index: seatIdx, name })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Reservation failed')
    }
  }

  const onSeatClick = (tableId) => async (seatIdx, seat) => {
    setActive({ tableId, seatIdx, label: seat.label, reserved: seat.reserved })
  }

  const Room = useMemo(() => (
    <div className="relative mx-auto max-w-[1200px] min-h-[720px] rounded-[32px] p-10 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)'
      }}
    >
      {/* floor pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      {/* corner glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30"
           style={{ background: 'conic-gradient(from 90deg at 50% 50%, #22d3ee, #a78bfa, #22d3ee)' }} />
      <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20"
           style={{ background: 'conic-gradient(from 180deg at 50% 50%, #34d399, #f472b6, #34d399)' }} />

      {/* Tables layout */}
      <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-12 place-items-center">
        {tables.map((t) => (
          <div key={t.id} className="relative">
            <TableVisual table={t} scale={1} onSeatClick={onSeatClick(t.id)} />
          </div>
        ))}
      </div>
    </div>
  ), [tables])

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-950 via-slate-950 to-sky-950 text-white">
      <header className="sticky top-0 z-50 backdrop-blur-md/30 border-b border-white/10 bg-black/20">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-fuchsia-400 shadow-lg shadow-fuchsia-500/30" />
            <h1 className="text-xl font-bold tracking-tight">Extravagant Seating</h1>
          </div>
          <div className="text-sm text-white/70">
            {message}
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <motion.div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white/80" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} />
            </div>
          ) : (
            Room
          )}
        </div>
      </main>

      {/* Reservation Drawer */}
      {active && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setActive(null)} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
            <div className="max-w-[900px] mx-auto p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold">Reserve {active.label}</h3>
                  <p className="text-white/60 text-sm">Select the seat and leave a name to lock it in.</p>
                </div>
                <button onClick={() => setActive(null)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Close</button>
              </div>
              <div className="mt-6 grid sm:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <p className="text-sm text-white/70 mb-2">Seat</p>
                  <div className="text-lg font-semibold">{active.label}</div>
                  <div className="mt-2 text-xs">{active.reserved ? 'Currently reserved' : 'Available'}</div>
                </div>
                <ReserveForm
                  onSubmit={async (name) => {
                    try {
                      await reserve(active.tableId, active.seatIdx, name)
                      setMessage('Seat reserved!')
                      setActive(null)
                      fetchTables()
                    } catch (e) {
                      alert(e.message)
                    }
                  }}
                  disabled={active.reserved}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <footer className="py-10 text-center text-white/50 text-sm">
        Designed with opulence — shimmering gradients, soft glows, and luxe vibes.
      </footer>
    </div>
  )
}

function ReserveForm({ onSubmit, disabled }) {
  const [name, setName] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name) return
        onSubmit(name)
      }}
      className="bg-white/5 rounded-2xl p-5 border border-white/10"
    >
      <label className="text-sm text-white/70 mb-2 block">Your name</label>
      <input
        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60"
        placeholder="Amelia Earhart"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={disabled}
      />
      <button
        disabled={disabled}
        className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-fuchsia-400 to-sky-400 text-slate-900 font-semibold shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
      >
        {disabled ? 'Seat Unavailable' : 'Reserve seat'}
      </button>
    </form>
  )
}

export default App
