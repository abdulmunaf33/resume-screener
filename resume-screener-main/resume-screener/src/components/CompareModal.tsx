import { X } from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { ScreeningResult } from '../types'

interface Props {
  candidates: ScreeningResult[]
  onClose: () => void
}

export default function CompareModal({ candidates, onClose }: Props) {
  const allSkills = Array.from(
    new Set([
      ...candidates.flatMap((c) => c.matchedSkills),
      ...candidates.flatMap((c) => c.missingSkills),
    ])
  ).sort()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">
            Side-by-Side Comparison ({candidates.length} candidates)
          </span>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div
            className="compare-grid"
            style={{
              gridTemplateColumns: `180px repeat(${candidates.length}, 1fr)`,
            }}
          >
            {/* Header row */}
            <div className="compare-cell compare-label-cell" />
            {candidates.map((c) => (
              <div key={c.id} className="compare-cell compare-header-cell">
                <ScoreRing score={c.matchScore} size={56} />
                <div className="compare-name">{c.candidateName}</div>
                <span
                  className={`badge badge-${c.category.toLowerCase()}`}
                >
                  {c.category}
                </span>
              </div>
            ))}

            {/* Experience */}
            <div className="compare-cell compare-label-cell">Experience</div>
            {candidates.map((c) => (
              <div key={c.id} className="compare-cell">
                {c.experienceYears} yr{c.experienceYears !== 1 ? 's' : ''}
              </div>
            ))}

            {/* Education */}
            <div className="compare-cell compare-label-cell">Education</div>
            {candidates.map((c) => (
              <div key={c.id} className="compare-cell">
                {c.educationLevel || '—'}
              </div>
            ))}

            {/* Match Score */}
            <div className="compare-cell compare-label-cell">Match Score</div>
            {candidates.map((c) => (
              <div key={c.id} className="compare-cell compare-score">
                {c.matchScore}
              </div>
            ))}

            {/* Skills */}
            {allSkills.length > 0 && (
              <>
                <div
                  className="compare-cell compare-label-cell compare-section-header"
                  style={{ gridColumn: `1 / span ${candidates.length + 1}` }}
                >
                  Skills Comparison
                </div>
                {allSkills.map((skill) => (
                  <>
                    <div key={`label-${skill}`} className="compare-cell compare-label-cell">
                      {skill}
                    </div>
                    {candidates.map((c) => {
                      const matched = c.matchedSkills
                        .map((s) => s.toLowerCase())
                        .includes(skill.toLowerCase())
                      const missing = c.missingSkills
                        .map((s) => s.toLowerCase())
                        .includes(skill.toLowerCase())
                      return (
                        <div
                          key={`${c.id}-${skill}`}
                          className={`compare-cell compare-skill-cell ${
                            matched ? 'matched' : missing ? 'missing' : ''
                          }`}
                        >
                          {matched ? '✓' : missing ? '✗' : '—'}
                        </div>
                      )
                    })}
                  </>
                ))}
              </>
            )}

            {/* Summary */}
            <div className="compare-cell compare-label-cell">Summary</div>
            {candidates.map((c) => (
              <div key={c.id} className="compare-cell compare-summary">
                {c.summary}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
