import { History, Trash2, X, ChevronRight } from 'lucide-react'
import type { Session } from '../types'
import { deleteSession, clearAllSessions } from '../lib/storage'

interface Props {
  sessions: Session[]
  onLoad: (session: Session) => void
  onSessionsChange: (sessions: Session[]) => void
  onClose: () => void
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function SessionHistory({ sessions, onLoad, onSessionsChange, onClose }: Props) {
  const handleDelete = (id: string) => {
    deleteSession(id)
    onSessionsChange(sessions.filter((s) => s.id !== id))
  }

  const handleClearAll = () => {
    if (!confirm('Delete all saved sessions?')) return
    clearAllSessions()
    onSessionsChange([])
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <History size={16} /> Session History
          </span>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {sessions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No saved sessions yet.
            </p>
          ) : (
            <>
              <div className="session-list">
                {sessions.map((s) => (
                  <div key={s.id} className="session-item">
                    <div className="session-info" onClick={() => { onLoad(s); onClose() }}>
                      <div className="session-title">{s.jobTitle}</div>
                      <div className="session-meta">
                        {s.results.length} resume{s.results.length !== 1 ? 's' : ''} ·{' '}
                        {timeAgo(s.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary icon-btn"
                        onClick={() => { onLoad(s); onClose() }}
                        title="Load session"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        className="btn btn-secondary icon-btn"
                        onClick={() => handleDelete(s.id)}
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', color: 'var(--accent-red)' }}
                  onClick={handleClearAll}
                >
                  <Trash2 size={13} /> Clear All
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
