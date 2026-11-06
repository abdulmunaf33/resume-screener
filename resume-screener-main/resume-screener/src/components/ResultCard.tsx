import { useState } from 'react'
import { GraduationCap, Clock, MessageSquare, Send, StickyNote, AlertTriangle, X, ChevronDown, Copy } from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { ScreeningResult, JobProfile, Category } from '../types'
import { askFollowUp } from '../lib/screener'

interface Props {
  result: ScreeningResult
  rank: number
  apiKey: string
  jobProfile: JobProfile
  onNoteChange: (id: string, note: string) => void
  onCategoryChange: (id: string, category: Category) => void
}

export default function ResultCard({ result, rank, apiKey, jobProfile, onNoteChange, onCategoryChange }: Props) {
  const {
    candidateName, matchScore, category,
    matchedSkills, missingSkills,
    experienceYears, educationLevel,
    summary, recommendation, lowConfidence, note, isDuplicate, imagePdf,
  } = result

  const [showChat, setShowChat] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([])
  const [asking, setAsking] = useState(false)
  const [noteValue, setNoteValue] = useState(note ?? '')

  const categoryBadgeClass =
    category === 'Shortlist'
      ? 'badge-shortlist'
      : category === 'Hold'
      ? 'badge-hold'
      : 'badge-reject'

  const handleAsk = async () => {
    if (!question.trim() || asking) return
    const q = question.trim()
    setQuestion('')
    setAsking(true)
    try {
      const answer = await askFollowUp(apiKey, q, result, jobProfile)
      setChatHistory((prev) => [...prev, { q, a: answer }])
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { q, a: 'Error: could not get a response. Check your API key.' },
      ])
    } finally {
      setAsking(false)
    }
  }

  const saveNote = () => {
    onNoteChange(result.id, noteValue)
    setShowNote(false)
  }

  return (
    <div className={`result-card ${category.toLowerCase()}`}>
      {/* Rank badge */}
      <div className="card-rank">#{rank}</div>

      {/* Header */}
      <div className="card-header">
        <div className="card-name-area">
          <div className="card-name">{candidateName}</div>
          <div className="card-meta">
            <span>
              <Clock size={12} />
              {experienceYears} yr{experienceYears !== 1 ? 's' : ''} exp.
            </span>
            {educationLevel && (
              <span>
                <GraduationCap size={12} />
                {educationLevel}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Category badge — clickable to override */}
            <div style={{ position: 'relative' }}>
              <button
                className={`badge ${categoryBadgeClass} category-override-btn`}
                onClick={() => setShowCategoryMenu((v) => !v)}
                title="Click to change category"
              >
                {category}
                <ChevronDown size={10} style={{ marginLeft: 2 }} />
              </button>
              {showCategoryMenu && (
                <div className="category-menu">
                  {(['Shortlist', 'Hold', 'Reject'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      className={`category-menu-option ${cat === category ? 'current' : ''}`}
                      onClick={() => {
                        onCategoryChange(result.id, cat)
                        setShowCategoryMenu(false)
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isDuplicate && (
              <span className="badge badge-warning" title="Duplicate candidate name detected">
                <Copy size={11} /> Duplicate
              </span>
            )}
            {imagePdf && (
              <span className="badge badge-warning" title="Scanned/image PDF — no text extracted">
                <AlertTriangle size={11} /> Image PDF
              </span>
            )}
            {lowConfidence && !imagePdf && (
              <span className="badge badge-warning" title="AI had low confidence parsing this resume">
                <AlertTriangle size={11} /> Low Confidence
              </span>
            )}
            {recommendation && (
              <span className="badge badge-blue">
                {recommendation}
              </span>
            )}
          </div>
        </div>
        <ScoreRing score={matchScore} />
      </div>

      <div className="card-divider" />

      {/* Matched skills */}
      {matchedSkills.length > 0 && (
        <>
          <div className="card-section-label">✓ Matched Skills</div>
          <div className="pills">
            {matchedSkills.map((s) => (
              <span key={s} className="pill pill-green">
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Missing skills */}
      {missingSkills.length > 0 && (
        <>
          <div className="card-section-label">✗ Missing Skills</div>
          <div className="pills">
            {missingSkills.map((s) => (
              <span key={s} className="pill pill-red">
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Summary */}
      {summary && (
        <>
          <div className="card-section-label">AI Summary</div>
          <p className="card-summary">{summary}</p>
        </>
      )}

      {/* Recruiter note */}
      {note && !showNote && (
        <div className="recruiter-note">
          <StickyNote size={13} />
          <span>{note}</span>
        </div>
      )}

      {/* Note editor */}
      {showNote && (
        <div className="note-editor">
          <textarea
            rows={3}
            placeholder="Add a recruiter note…"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.8rem' }}
              onClick={() => setShowNote(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '5px 12px', fontSize: '0.8rem' }}
              onClick={saveNote}
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Follow-up chat */}
      {showChat && (
        <div className="chat-area">
          <div className="chat-messages">
            {chatHistory.length === 0 && (
              <p className="chat-hint">
                Ask anything about this candidate, e.g. "What makes them stand out?" or "Should we fast-track this candidate?"
              </p>
            )}
            {chatHistory.map((item, i) => (
              <div key={i} className="chat-pair">
                <div className="chat-q">
                  <span>You:</span> {item.q}
                </div>
                <div className="chat-a">
                  <span>AI:</span> {item.a}
                </div>
              </div>
            ))}
            {asking && (
              <div className="chat-a">
                <span>AI:</span>{' '}
                <span className="chat-thinking">Thinking…</span>
              </div>
            )}
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              placeholder="Ask a question about this candidate…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              disabled={asking}
            />
            <button
              className="btn btn-primary"
              style={{ padding: '8px 14px', flexShrink: 0 }}
              onClick={handleAsk}
              disabled={!question.trim() || asking}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Card action buttons */}
      <div className="card-divider" style={{ marginTop: 12 }} />
      <div className="card-actions">
        <button
          className={`btn btn-secondary card-action-btn ${showNote ? 'active' : ''}`}
          onClick={() => { setShowNote((v) => !v); setShowChat(false) }}
          title="Add recruiter note"
        >
          <StickyNote size={13} />
          {note ? 'Edit Note' : 'Add Note'}
        </button>
        <button
          className={`btn btn-secondary card-action-btn ${showChat ? 'active' : ''}`}
          onClick={() => { setShowChat((v) => !v); setShowNote(false) }}
          title="Ask AI about this candidate"
        >
          <MessageSquare size={13} />
          Ask AI
          {showChat && (
            <X size={12} style={{ marginLeft: 2, opacity: 0.7 }} />
          )}
        </button>
      </div>
    </div>
  )
}
