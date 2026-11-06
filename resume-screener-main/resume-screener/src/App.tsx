import { useState, useCallback, useEffect } from 'react'
import {
  Bot, Key, Eye, EyeOff, CheckCircle2,
  AlertCircle, Info, History, Save,
} from 'lucide-react'

import JobProfileForm from './components/JobProfileForm'
import ResumeUpload from './components/ResumeUpload'
import ResultsDashboard from './components/ResultsDashboard'
import SessionHistory from './components/SessionHistory'
import { screenResume, extractResumeText } from './lib/screener'
import { loadApiKey, saveApiKey, loadSessions, saveSession } from './lib/storage'

import type { JobProfile, ResumeFile, ScreeningResult, Session } from './types'
type Step = 1 | 2 | 3
type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  msg: string
  type: ToastType
}

const DEFAULT_JOB: JobProfile = {
  title: '',
  skills: '',
  minExperience: '',
  education: '',
  description: '',
  certifications: '',
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function App() {
  const [step, setStep] = useState<Step>(1)
  const [apiKey, setApiKey] = useState(() => loadApiKey())
  const [rememberKey, setRememberKey] = useState(() => !!loadApiKey())
  const [showKey, setShowKey] = useState(false)
  const [jobProfile, setJobProfile] = useState<JobProfile>(DEFAULT_JOB)
  const [files, setFiles] = useState<ResumeFile[]>([])
  const [results, setResults] = useState<ScreeningResult[]>([])
  const [currentSessionId] = useState(() => genId())
  const [isScreening, setIsScreening] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [showHistory, setShowHistory] = useState(false)

  // Persist API key
  useEffect(() => {
    if (rememberKey) {
      saveApiKey(apiKey)
    } else {
      saveApiKey('')
    }
  }, [apiKey, rememberKey])

  // Escape key closes history modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHistory(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auto-save session when results change
  useEffect(() => {
    if (results.length > 0 && jobProfile.title) {
      const session: Session = {
        id: currentSessionId,
        createdAt: Date.now(),
        jobTitle: jobProfile.title,
        results,
      }
      saveSession(session)
      setSessions(loadSessions())
    }
  }, [results, jobProfile.title, currentSessionId])

  const addToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500)
  }, [])

  // --- File management ---
  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      const valid = newFiles.filter(
        (f) => f.name.endsWith('.pdf') || f.name.endsWith('.txt')
      )
      const skipped = newFiles.length - valid.length
      if (skipped > 0)
        addToast(`${skipped} unsupported file(s) skipped.`, 'info')
      if (valid.length === 0) return
      setFiles((prev) => [
        ...prev,
        ...valid.map((f) => ({
          id: genId(),
          file: f,
          status: 'pending' as const,
        })),
      ])
    },
    [addToast]
  )

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleRetry = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'pending', error: undefined } : f))
    )
  }, [])

  // --- Screening ---
  const screenFiles = useCallback(
    async (toScreen: ResumeFile[]) => {
      if (!apiKey.trim()) {
        addToast('Please enter your Anthropic API key first.', 'error')
        return
      }
      if (toScreen.length === 0) {
        addToast('No pending resumes to screen.', 'info')
        return
      }

      setIsScreening(true)
      setProgress({ done: 0, total: toScreen.length })

      // Mark as screening and extract text concurrently
      setFiles((prev) =>
        prev.map((f) =>
          toScreen.find((s) => s.id === f.id)
            ? { ...f, status: 'screening' }
            : f
        )
      )

      const newResults: ScreeningResult[] = []

      await Promise.all(
        toScreen.map(async (rf) => {
          try {
            // Extract text first and cache it on the file object
            const text = await extractResumeText(rf.file)
            setFiles((prev) =>
              prev.map((f) =>
                f.id === rf.id ? { ...f, extractedText: text } : f
              )
            )
            const result = await screenResume(apiKey, rf.file, jobProfile, rf.id, text)
            newResults.push(result)
            setFiles((prev) =>
              prev.map((f) => (f.id === rf.id ? { ...f, status: 'done' } : f))
            )
          } catch (err) {
            console.error('Screening error for', rf.file.name, err)
            setFiles((prev) =>
              prev.map((f) =>
                f.id === rf.id
                  ? { ...f, status: 'failed', error: String(err) }
                  : f
              )
            )
            addToast(
              `Failed: "${rf.file.name}". Check your API key or file content.`,
              'error'
            )
          } finally {
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          }
        })
      )

      setResults((prev) => {
        const combined = [...prev, ...newResults]
        // Mark duplicates — same candidateName appearing more than once
        const nameCounts: Record<string, number> = {}
        combined.forEach((r) => {
          const key = r.candidateName.toLowerCase().trim()
          nameCounts[key] = (nameCounts[key] ?? 0) + 1
        })
        return combined.map((r) => ({
          ...r,
          isDuplicate: nameCounts[r.candidateName.toLowerCase().trim()] > 1,
        }))
      })
      setIsScreening(false)

      // Warn about image-only PDFs
      const imagePdfs = newResults.filter((r) => r.imagePdf)
      if (imagePdfs.length > 0) {
        addToast(
          `${imagePdfs.length} scanned/image PDF(s) had no extractable text — results may be inaccurate.`,
          'error'
        )
      }

      const succeeded = newResults.length
      if (succeeded > 0) {
        addToast(
          `Screening complete! ${succeeded} resume${succeeded !== 1 ? 's' : ''} processed.`,
          'success'
        )
        setStep(3)
      }
    },
    [apiKey, jobProfile, addToast]
  )

  const handleScreenAll = useCallback(() => {
    const pending = files.filter((f) => f.status === 'pending')
    screenFiles(pending)
  }, [files, screenFiles])

  // --- Load session from history ---
  const handleLoadSession = useCallback((session: Session) => {
    setResults(session.results)
    setStep(3)
    addToast(`Loaded session: "${session.jobTitle}"`, 'info')
  }, [addToast])

  // --- Reset ---
  const handleNewSession = useCallback(() => {
    setStep(1)
    setJobProfile(DEFAULT_JOB)
    setFiles([])
    setResults([])
    setProgress({ done: 0, total: 0 })
  }, [])

  const STEP_LABELS = ['Job Requirements', 'Upload Resumes', 'Results']

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-icon">
          <Bot size={48} />
        </div>
        <h1>AI Resume Screener</h1>
        <p>Concurrent screening · Instant insights</p>
        {sessions.length > 0 && (
          <button
            className="btn btn-secondary header-history-btn"
            onClick={() => setShowHistory(true)}
          >
            <History size={14} />
            History ({sessions.length})
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="steps">
        {STEP_LABELS.map((label, i) => {
          const num = (i + 1) as Step
          const state =
            num < step ? 'completed' : num === step ? 'active' : ''
          return (
            <div
              key={label}
              className={`step ${state}`}
              onClick={() => {
                if (num < step) setStep(num)
              }}
            >
              <div className="step-circle">
                {num < step ? <CheckCircle2 size={16} /> : num}
              </div>
              <span className="step-label">{label}</span>
            </div>
          )
        })}
      </div>

      {/* API Key */}
      <div className="api-key-section">
        <Key size={18} />
        <div className="api-key-input-wrap">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="Enter your Anthropic API key (sk-ant-…)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="eye-toggle"
            onClick={() => setShowKey((v) => !v)}
            type="button"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <label className="remember-key-label" title="Save key in browser storage">
          <input
            type="checkbox"
            checked={rememberKey}
            onChange={(e) => setRememberKey(e.target.checked)}
          />
          <Save size={13} />
          Remember
        </label>
        {apiKey.startsWith('sk-ant-') && (
          <span className="badge badge-done" style={{ flexShrink: 0 }}>
            <CheckCircle2 size={12} /> Key set
          </span>
        )}
      </div>

      {/* Phases */}
      {step === 1 && (
        <JobProfileForm
          profile={jobProfile}
          onChange={setJobProfile}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ResumeUpload
          files={files}
          onFilesAdded={handleFilesAdded}
          onRemove={handleRemove}
          onRetry={handleRetry}
          onScreenAll={handleScreenAll}
          isScreening={isScreening}
          progress={progress}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <ResultsDashboard
          results={results}
          jobProfile={jobProfile}
          apiKey={apiKey}
          onBack={() => setStep(2)}
          onNewSession={handleNewSession}
          onResultsChange={setResults}
        />
      )}

      {/* Session history modal */}
      {showHistory && (
        <SessionHistory
          sessions={sessions}
          onLoad={handleLoadSession}
          onSessionsChange={setSessions}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={16} />}
            {t.type === 'error' && <AlertCircle size={16} />}
            {t.type === 'info' && <Info size={16} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
