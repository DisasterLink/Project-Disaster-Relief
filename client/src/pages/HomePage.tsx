import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  AlertTriangle, LogIn, UserPlus, MapPin, Clock, Filter,
  X, LayoutDashboard
} from 'lucide-react'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const URGENCY_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e',
}
const TYPE_EMOJI: Record<string, string> = {
  food: '🍱', water: '💧', medical: '🏥', rescue: '🚁', shelter: '⛺'
}

const createMarkerIcon = (urgency: string, type: string) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${URGENCY_COLORS[urgency] || '#60a5fa'};
          border:3px solid rgba(255,255,255,0.9);
          box-shadow:0 0 16px ${URGENCY_COLORS[urgency] || '#60a5fa'}99,0 2px 8px rgba(0,0,0,0.5);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;cursor:pointer;
          transition:transform 0.2s;
        ">${TYPE_EMOJI[type] || '🆘'}</div>
        ${urgency === 'critical' ? `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;background:#ef4444;border-radius:50%;border:2px solid #0a0f1e;animation:sos-blink 1s infinite;"></div>` : ''}
      </div>
      <style>@keyframes sos-blink{0%,100%{opacity:1}50%{opacity:0}}</style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })

interface RequestData {
  _id: string; type: string; urgency: string; description: string; status: string
  location: { coordinates: [number, number]; address: string }
  submittedBy?: { name: string; phone: string }
  createdAt: string; numberOfPeople?: number
}

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

// India center
const INDIA_CENTER: [number, number] = [20.5937, 78.9629]

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { socket, connected } = useSocket(user)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [filterUrgency, setFilterUrgency] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) fetchRequests()
  }, [user])

  useEffect(() => {
    if (!socket) return
    socket.on('new_request', (req: RequestData) => {
      setRequests(prev => [req, ...prev])
      toast(`🚨 New ${req.type} SOS — ${req.urgency}`, { duration: 5000 })
    })
    socket.on('request_status_updated', ({ requestId, status }: any) => {
      setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r))
    })
    socket.on('sos_assigned', ({ message }: any) => { toast.success(message, { duration: 7000 }) })
    socket.on('sos_resolved', ({ message }: any) => { toast.success(message, { icon: '✅', duration: 8000 }) })
    return () => {
      socket.off('new_request')
      socket.off('request_status_updated')
      socket.off('sos_assigned')
      socket.off('sos_resolved')
    }
  }, [socket])

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('/api/requests?limit=200')
      setRequests(data.data || [])
    } catch { /* guest view — no requests shown */ }
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'volunteer') return '/volunteer'
    return '/my-requests'  // civilian dashboard
  }

  const filteredRequests = requests.filter(r => {
    if (filterUrgency !== 'all' && r.urgency !== filterUrgency) return false
    if (filterType !== 'all' && r.type !== filterType) return false
    return true
  })

  const criticalCount = requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', background: 'rgba(10,15,30,0.96)',
        borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)',
        zIndex: 1001, flexShrink: 0, gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: 10, padding: '7px 8px', display: 'flex' }}>
            <AlertTriangle size={18} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px' }}>DisasterLink</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', lineHeight: 1, marginTop: 1 }}>Relief Coordination Platform</span>
          </div>
          {criticalCount > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'block', animation: 'sos-blink 1s infinite' }}></span>
              <style>{`@keyframes sos-blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700 }}>{criticalCount} Critical</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--glass-bg)', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
                <span className="conn-dot" style={{ background: connected ? '#22c55e' : '#ef4444', boxShadow: connected ? '0 0 6px #22c55e' : 'none' }}></span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{connected ? 'Live' : 'Offline'}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Hi, <strong style={{ color: 'var(--color-text)' }}>{user.name.split(' ')[0]}</strong></span>
              <Link to={getDashboardLink()} className="btn-primary" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <LayoutDashboard size={13} />Dashboard
              </Link>
              <button onClick={logout} className="btn-secondary" style={{ padding: '7px 12px', fontSize: 13 }}>Logout</button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 13 }}><LogIn size={13} />Login</Link>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', fontSize: 13 }}><UserPlus size={13} />Register</Link>
            </>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
            />
            <ZoomControl position="bottomright" />
            {filteredRequests.map(req => (
              <Marker
                key={req._id}
                position={[req.location.coordinates[1], req.location.coordinates[0]]}
                icon={createMarkerIcon(req.urgency, req.type)}
              >
                <Popup maxWidth={260}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${req.urgency}`}>{req.urgency}</span>
                      <span className={`badge badge-${req.status}`}>{req.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                      {TYPE_EMOJI[req.type]} {req.type.charAt(0).toUpperCase() + req.type.slice(1)} Request
                    </div>
                    {req.description && (
                      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8, lineHeight: 1.5 }}>{req.description}</p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {req.location.address && (
                        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <MapPin size={11} />{req.location.address}
                        </div>
                      )}
                      {req.numberOfPeople && (
                        <div style={{ fontSize: 12, color: '#6b7280' }}>👥 {req.numberOfPeople} people affected</div>
                      )}
                      <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Clock size={11} />{timeAgo(req.createdAt)}
                      </div>
                      {req.submittedBy?.name && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#9ca3af' }}>
                          By: {req.submittedBy.name}
                          {req.submittedBy.phone && ` · ${req.submittedBy.phone}`}
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map overlays */}

          {/* Top-left: incident counter + filter */}
          <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 1000, display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(10,15,30,0.88)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', display: 'block' }}></span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{filteredRequests.length} Active Incidents</span>
            </div>
            <button onClick={() => setShowFilters(p => !p)} style={{ background: 'rgba(10,15,30,0.88)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(16px)', cursor: 'pointer', color: showFilters ? 'var(--color-primary)' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
              <Filter size={14} />Filter
            </button>

            {showFilters && (
              <div className="fade-in" style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14, backdropFilter: 'blur(16px)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} className="input-field" style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }}>
                  <option value="all">All Urgency</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field" style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }}>
                  <option value="all">All Types</option>
                  <option value="rescue">🚁 Rescue</option>
                  <option value="medical">🏥 Medical</option>
                  <option value="food">🍱 Food</option>
                  <option value="water">💧 Water</option>
                  <option value="shelter">⛺ Shelter</option>
                </select>
                {(filterUrgency !== 'all' || filterType !== 'all') && (
                  <button onClick={() => { setFilterUrgency('all'); setFilterType('all') }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <X size={13} />Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 50, left: 14, zIndex: 1000, background: 'rgba(10,15,30,0.88)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(16px)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Urgency</div>
            {Object.entries(URGENCY_COLORS).map(([level, color]) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}88`, display: 'block' }}></span>
                <span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--color-text-muted)' }}>{level}</span>
              </div>
            ))}
          </div>

          {/* SOS FAB — civilians */}
          {user?.role === 'civilian' && (
            <button onClick={() => navigate('/sos')} className="sos-btn" style={{
              position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: 'white',
              border: '3px solid rgba(255,255,255,0.3)', borderRadius: 50, padding: '16px 36px',
              fontSize: 17, fontWeight: 900, letterSpacing: 2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(239,68,68,0.5)'
            }}>
              <AlertTriangle size={20} />SEND SOS
            </button>
          )}

          {/* Guest CTA */}
          {!user && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'rgba(10,15,30,0.92)', border: '1px solid var(--glass-border)',
              borderRadius: 14, padding: '16px 28px', textAlign: 'center', backdropFilter: 'blur(16px)', minWidth: 320
            }}>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                🌍 <strong style={{ color: 'white' }}>DisasterLink</strong> — Real-time disaster coordination
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Link to="/register?role=civilian" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>🆘 Need Help?</Link>
                <Link to="/register?role=volunteer" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>🤝 Volunteer</Link>
                <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>Login</Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        {user && sidebarOpen && (
          <div style={{ width: 300, background: 'var(--color-surface)', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Live Incidents</h2>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{filteredRequests.length} active</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredRequests.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  No active incidents!
                </div>
              ) : (
                filteredRequests.map(req => (
                  <div key={req._id} className="fade-in" style={{
                    padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer', transition: 'background 0.15s',
                    borderLeft: `3px solid ${URGENCY_COLORS[req.urgency] || 'transparent'}`
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{TYPE_EMOJI[req.type]} {req.type}</span>
                      <span className={`badge badge-${req.urgency}`}>{req.urgency}</span>
                    </div>
                    {req.description && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 5, lineHeight: 1.4 }}>
                        {req.description.slice(0, 70)}{req.description.length > 70 ? '...' : ''}
                      </p>
                    )}
                    {req.location.address && (
                      <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 5, display: 'flex', gap: 4 }}>
                        <MapPin size={10} />{req.location.address}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge badge-${req.status}`}>{req.status.replace('_', ' ')}</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{timeAgo(req.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Toggle sidebar button when closed */}
        {user && !sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 1000, background: 'var(--color-surface)', border: '1px solid var(--glass-border)',
            borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '12px 6px', cursor: 'pointer',
            color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: 3,
          }}>
            <span style={{ fontSize: 10, writingMode: 'vertical-rl', color: 'var(--color-text-muted)', letterSpacing: 1 }}>INCIDENTS</span>
          </button>
        )}
      </div>
    </div>
  )
}
