import { useState, useMemo } from 'react'
import { BarChart2, Download, ArrowLeft, GitCompare, Search, SlidersHorizontal, X } from 'lucide-react'
import ResultCard from './ResultCard'
import CompareModal from './CompareModal'
import type { ScreeningResult, FilterType, JobProfile, Category } from '../types'

interface Props {
  results: ScreeningResult[]
  jobProfile: JobProfile
  apiKey: string
  onBack: () => void
  onNewSession: () => void
  onResultsChange: (results: ScreeningResult[]) => void
}

function exportCSV(results: ScreeningResult[]) {
  const headers = [
    'Rank', 'File Name', 'Candidate Name', 'Match Score', 'Category',
    'Matched Skills', 'Missing Skills', 'Experience (yrs)',
    'Education Level', 'Summary', 'Recommendation', 'Note', 'Duplicate',
  ]
  const sorted = [...results].sort((a, b) => b.matchScore - a.matchScore)
  const rows = sorted.map((r, i) => [
    i + 1,
    r.fileName,
    r.candidateName,
    r.matchScore,
    r.category,
    r.matchedSkills.join('; '),
    r.missingSkills.join('; '),
    r.experienceYears,
    r.educationLevel,
    `"${r.summary.replace(/"/g, '""')}"`,
    `"${r.recommendation.replace(/"/g, '""')}"`,
    `"${(r.note ?? '').replace(/"/g, '""')}"`,
    r.isDuplicate ? 'Yes' : 'No',
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `screening-results-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const FILTERS: FilterType[] = ['All', 'Shortlist', 'Hold', 'Reject']
type SortKey = 'matchScore' | 'candidateName' | 'experienceYears'

export default function ResultsDashboard({
  results, jobProfile, apiKey, onBack, onNewSession, onResultsChange,
}: Props) {
  const [filter, setFilter] = useState<FilterType>('All')
  const [sortKey, setSortKey] = useState<SortKey>('matchScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)
  const [search, setSearch] = useState('')
  const [showThresholds, setShowThresholds] = useState(false)
  // Score thresholds: above shortlistMin = Shortlist, above holdMin = Hold, else Reject
  const [shortlistMin, setShortlistMin] = useState(70)
  const [holdMin, setHoldMin] = useState(45)

  const total = results.length
  const shortlisted = results.filter((r) => r.category === 'Shortlist').length
  const hold = results.filter((r) => r.category === 'Hold').length
  const rejected = results.filter((r) => r.category === 'Reject').length
  const duplicates = results.filter((r) => r.isDuplicate).length

  // Assign rank by score globally (before filter)
  const ranked = useMemo(
    () =>
      [...results]
        .sort((a, b) => b.matchScore - a.matchScore)
        .map((r, i) => ({ ...r, rank: i + 1 })),
    [results]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ranked
      .filter((r) => filter === 'All' || r.category === filter)
      .filter((r) => {
        if (!q) return true
        return (
          r.candidateName.toLowerCase().includes(q) ||
          r.matchedSkills.some((s) => s.toLowerCase().includes(q)) ||
          r.missingSkills.some((s) => s.toLowerCase().includes(q)) ||
          r.fileName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const valA = a[sortKey]
        const valB = b[sortKey]
        if (typeof valA === 'number' && typeof valB === 'number')
          return sortDir === 'desc' ? valB - valA : valA - valB
        const sa = String(valA).toLowerCase()
        const sb = String(valB).toLowerCase()
        return sortDir === 'desc' ? sb.localeCompare(sa) : sa.localeCompare(sb)
      })
  }, [ranked, filter, search, sortKey, sortDir])

  const handleNoteChange = (id: string, note: string) => {
    onResultsChange(results.map((r) => (r.id === id ? { ...r, note } : r)))
  }

  /** Override a card's category manually */
  const handleCategoryChange = (id: string, category: Category) => {
    onResultsChange(results.map((r) => (r.id === id ? { ...r, category } : r)))
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  /** Re-categorise all results based on new threshold values */
  const applyThresholds = () => {
    onResultsChange(
      results.map((r) => ({
        ...r,
        category:
          r.matchScore >= shortlistMin
            ? 'Shortlist'
            : r.matchScore >= holdMin
            ? 'Hold'
            : 'Reject',
      }))
    )
    setShowThresholds(false)
  }

  const compareList = results.filter((r) => compareIds.has(r.id))

  return (
    <div>
      {/* Summary bar */}
      <div className="summary-bar">
        <div className="summary-stat stat-total">
          <div className="summary-stat-value">{total}</div>
          <div className="summary-stat-label">Total Screened</div>
        </div>
        <div className="summary-stat stat-shortlist">
          <div className="summary-stat-value">{shortlisted}</div>
          <div className="summary-stat-label">Shortlisted</div>
        </div>
        <div className="summary-stat stat-hold">
          <div className="summary-stat-value">{hold}</div>
          <div className="summary-stat-label">On Hold</div>
        </div>
        <div className="summary-stat stat-reject">
          <div className="summary-stat-value">{rejected}</div>
          <div className="summary-stat-label">Rejected</div>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicates > 0 && (
        <div className="dupe-warning">
          <AlertIcon />
          <span>
            {duplicates} duplicate candidate name{duplicates !== 1 ? 's' : ''} detected — review carefully before shortlisting.
          </span>
        </div>
      )}

      {/* Search bar */}
      <div className="search-bar">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search by name, skill, or filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="results-controls">
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span style={{ marginLeft: 5, opacity: 0.75 }}>
                  ({f === 'Shortlist' ? shortlisted : f === 'Hold' ? hold : rejected})
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="sort-wrap">
            <label>Sort:</label>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="matchScore">Match Score</option>
              <option value="candidateName">Name</option>
              <option value="experienceYears">Experience</option>
            </select>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
              <option value="desc">↓ High</option>
              <option value="asc">↑ Low</option>
            </select>
          </div>
          <button
            className={`btn btn-secondary ${showThresholds ? 'active' : ''}`}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => setShowThresholds((v) => !v)}
            title="Adjust score thresholds"
          >
            <SlidersHorizontal size={14} />
            Thresholds
          </button>
          {compareIds.size >= 2 && (
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setShowCompare(true)}
            >
              <GitCompare size={14} />
              Compare ({compareIds.size})
            </button>
          )}
          <button className="btn btn-export" onClick={() => exportCSV(results)}>
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Score threshold panel */}
      {showThresholds && (
        <div className="threshold-panel">
          <div className="threshold-panel-title">
            <SlidersHorizontal size={14} /> Score Thresholds
            <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              — adjust and re-categorise all results
            </span>
          </div>
          <div className="threshold-row">
            <label>
              <span className="threshold-dot dot-green" /> Shortlist if score ≥
            </label>
            <input
              type="range" min={1} max={100} value={shortlistMin}
              onChange={(e) => setShortlistMin(Number(e.target.value))}
              className="threshold-slider"
            />
            <span className="threshold-val">{shortlistMin}</span>
          </div>
          <div className="threshold-row">
            <label>
              <span className="threshold-dot dot-yellow" /> Hold if score ≥
            </label>
            <input
              type="range" min={1} max={shortlistMin - 1} value={Math.min(holdMin, shortlistMin - 1)}
              onChange={(e) => setHoldMin(Number(e.target.value))}
              className="threshold-slider"
            />
            <span className="threshold-val">{Math.min(holdMin, shortlistMin - 1)}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            Below {Math.min(holdMin, shortlistMin - 1)} → Reject
          </div>
          <button className="btn btn-primary" style={{ padding: '7px 18px', fontSize: '0.85rem' }} onClick={applyThresholds}>
            Apply to All Results
          </button>
        </div>
      )}

      {/* Search results count */}
      {search && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {/* Compare hint */}
      {!search && compareIds.size === 0 && total > 1 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Tip: Check up to 4 candidates then click "Compare" for a side-by-side view.
        </p>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <BarChart2 size={48} />
          <p>{search ? `No results match "${search}"` : 'No results match this filter.'}</p>
        </div>
      ) : (
        <div className="results-grid">
          {filtered.map((r) => (
            <div key={r.id} className="card-wrapper">
              <label className="compare-checkbox" title="Select for comparison">
                <input
                  type="checkbox"
                  checked={compareIds.has(r.id)}
                  onChange={() => toggleCompare(r.id)}
                  disabled={!compareIds.has(r.id) && compareIds.size >= 4}
                />
                <span>Compare</span>
              </label>
              <ResultCard
                result={r}
                rank={r.rank!}
                apiKey={apiKey}
                jobProfile={jobProfile}
                onNoteChange={handleNoteChange}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          ))}
        </div>
      )}

      {/* Nav */}
      <div className="nav-buttons" style={{ marginTop: 28 }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Upload
        </button>
        <button className="btn btn-primary" onClick={onNewSession}>
          New Session
        </button>
      </div>

      {showCompare && compareList.length >= 2 && (
        <CompareModal candidates={compareList} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
