import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AlertTriangle, MapPin, Clock, CheckCircle, Plus, LogOut, Radio, FileText } from 'lucide-react'

interface SOSRequest {
  _id: string; type: string; urgency: string; status: string; description: string
  location: { coordinates: [number, number]; address: string }
  numberOfPeople: number; priorityScore: number; createdAt: string
  assignedTask?: { volunteerId?: { name: string; phone: string } }
}

const TYPE_EMOJI: Record<string, string> = { food: '🍱', water: '💧', medical: '🏥', rescue: '🚁', shelter: '⛺' }
const URGENCY_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }

const timeAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  return diff < 1 ? 'Just now' : diff < 60 ? `${diff}m ago` : diff < 1440 ? `${Math.floor(diff / 60)}h ago` : `${Math.floor(diff / 1440)}d ago`
}

const STATUS_STEPS = ['pending', 'assigned', 'in_progress', 'resolved']
const STATUS_LABEL: Record<string, string> = { pending: 'Waiting', assigned: 'Assigned', in_progress: 'En Route', resolved: 'Resolved' }

const ProgressTracker = ({ status }: { status: string }) => {
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12 }}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? (active ? '#22c55e' : '#22c55e88') : 'rgba(255,255,255,0.08)',
                border: `2px solid ${done ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                fontSize: 12, fontWeight: 700, color: done ? 'white' : 'var(--color-text-muted)',
                boxShadow: active ? '0 0 10px rgba(34,197,94,0.5)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done && !active ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? '#4ade80' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {STATUS_LABEL[step]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < currentIdx ? '#22c55e88' : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function CivilianDashboard() {
  const { user, logout } = useAuth()
  const { socket, connected } = useSocket(user)
  const navigate = useNavigate()
  const [myRequests, setMyRequests] = useState<SOSRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMyRequests() }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('request_status_updated', ({ requestId, status }: any) => {
      setMyRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r))
    })
    socket.on('sos_assigned', ({ message }: any) => {
      toast.success(message, { icon: '🤝', duration: 8000 })
      fetchMyRequests()
    })
    socket.on('sos_resolved', ({ message }: any) => {
      toast.success(message, { icon: '✅', duration: 10000 })
      fetchMyRequests()
    })
    return () => { socket.off('request_status_updated'); socket.off('sos_assigned'); socket.off('sos_resolved') }
  }, [socket])

  const fetchMyRequests = async () => {
    try {
      const { data } = await axios.get('/api/requests')
      setMyRequests(data.data || [])
    } catch { toast.error('Failed to load requests') }
    finally { setLoading(false) }
  }

  const active = myRequests.filter(r => r.status !== 'resolved' && r.status !== 'cancelled')
  const resolved = myRequests.filter(r => r.status === 'resolved')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '12px 24px', background: 'rgba(10,15,30,0.96)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', borderRadius: 10, padding: '6px 8px' }}>
            <AlertTriangle size={16} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.3px' }}>DisasterLink</span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1 }}>Civilian Portal</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="conn-dot" style={{ background: connected ? '#22c55e' : '#ef4444', boxShadow: connected ? '0 0 6px #22c55e' : 'none' }}></span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{connected ? 'Live' : 'Offline'}</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Hi, <strong style={{ color: 'white' }}>{user?.name.split(' ')[0]}</strong></span>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={13} />Live Map
          </Link>
          <button onClick={() => { logout(); navigate('/') }} className="btn-secondary" style={{ fontSize: 13, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <LogOut size={13} />Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        {/* Greeting + Send SOS CTA */}
        <div className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>My Relief Requests</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {active.length === 0 ? "You have no active requests. Stay safe!" : `${active.length} active request${active.length > 1 ? 's' : ''} being coordinated.`}
            </p>
          </div>
          <Link to="/sos" className="sos-btn btn-primary" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            border: '2px solid rgba(255,255,255,0.2)', borderRadius: 10,
          }}>
            <AlertTriangle size={18} />Send SOS
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Sent', value: myRequests.length, icon: FileText, color: '#3b82f6' },
            { label: 'Active', value: active.length, icon: Radio, color: '#f97316' },
            { label: 'Resolved', value: resolved.length, icon: CheckCircle, color: '#22c55e' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</span>
                  <Icon size={16} color={s.color} />
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            )
          })}
        </div>

        {/* Active Requests */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2].map(i => (
              <div key={i} className="glass" style={{ padding: 24, height: 160 }}>
                <div style={{ background: 'var(--color-surface-2)', borderRadius: 6, height: 16, width: '40%', marginBottom: 12, animation: 'shimmer 1.5s infinite' }} />
                <div style={{ background: 'var(--color-surface-2)', borderRadius: 6, height: 12, width: '70%', marginBottom: 8 }} />
                <div style={{ background: 'var(--color-surface-2)', borderRadius: 6, height: 12, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myRequests.length === 0 && (
              <div className="glass fade-in" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🙏</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No requests yet</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: 14 }}>If you need emergency assistance, press the SOS button.</p>
                <Link to="/sos" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} />Send SOS Request
                </Link>
              </div>
            )}

            {myRequests.map(req => (
              <div key={req._id} className="glass fade-in" style={{ padding: 22, borderLeft: `4px solid ${URGENCY_COLOR[req.urgency] || '#6b7280'}` }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22 }}>{TYPE_EMOJI[req.type] || '🆘'}</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{req.type} Request</h3>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <Clock size={11} />{timeAgo(req.createdAt)}
                        {req.numberOfPeople > 1 && <span>· 👥 {req.numberOfPeople} people</span>}
                      </span>
                    </div>
                  </div>
                  <span className={`badge badge-${req.urgency}`}>{req.urgency}</span>
                </div>

                {/* Description */}
                {req.description && (
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 10, lineHeight: 1.6 }}>{req.description}</p>
                )}

                {/* Location */}
                {req.location.address && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <MapPin size={13} />{req.location.address}
                  </p>
                )}

                {/* Assigned volunteer */}
                {req.assignedTask?.volunteerId && (
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>🤝</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Volunteer Assigned</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {req.assignedTask.volunteerId.name}
                        {req.assignedTask.volunteerId.phone && ` · ${req.assignedTask.volunteerId.phone}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress tracker */}
                <ProgressTracker status={req.status} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
