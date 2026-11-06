import type { Session } from '../types'

const KEY_API = 'rscreener_apikey'
const KEY_SESSIONS = 'rscreener_sessions'

export function loadApiKey(): string {
  return localStorage.getItem(KEY_API) ?? ''
}

export function saveApiKey(key: string) {
  if (key) {
    localStorage.setItem(KEY_API, key)
  } else {
    localStorage.removeItem(KEY_API)
  }
}

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY_SESSIONS)
    return raw ? (JSON.parse(raw) as Session[]) : []
  } catch {
    return []
  }
}

export function saveSession(session: Session) {
  const sessions = loadSessions()
  const existing = sessions.findIndex((s) => s.id === session.id)
  if (existing >= 0) {
    sessions[existing] = session
  } else {
    sessions.unshift(session)
  }
  // Keep last 20 sessions
  localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions.slice(0, 20)))
}

export function deleteSession(id: string) {
  const sessions = loadSessions().filter((s) => s.id !== id)
  localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions))
}

export function clearAllSessions() {
  localStorage.removeItem(KEY_SESSIONS)
}
