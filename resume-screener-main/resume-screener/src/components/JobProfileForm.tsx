import { useState } from 'react'
import { Briefcase, Zap, ChevronDown } from 'lucide-react'
import type { JobProfile } from '../types'
import { JOB_TEMPLATES } from '../types'

interface Props {
  profile: JobProfile
  onChange: (p: JobProfile) => void
  onNext: () => void
}

export default function JobProfileForm({ profile, onChange, onNext }: Props) {
  const [showTemplates, setShowTemplates] = useState(false)

  const set =
    (field: keyof JobProfile) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      onChange({ ...profile, [field]: e.target.value })

  const applyTemplate = (name: string) => {
    onChange(JOB_TEMPLATES[name])
    setShowTemplates(false)
  }

  const isValid =
    profile.title.trim() &&
    profile.skills.trim() &&
    profile.minExperience.trim() &&
    profile.description.trim()

  return (
    <div className="section-card">
      <div className="section-title">
        <Briefcase size={20} />
        <span>Job Requirements</span>
        {/* Template picker */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setShowTemplates((v) => !v)}
            type="button"
          >
            <Zap size={13} />
            Templates
            <ChevronDown size={13} />
          </button>
          {showTemplates && (
            <div className="template-dropdown">
              {Object.keys(JOB_TEMPLATES).map((name) => (
                <button
                  key={name}
                  className="template-option"
                  onClick={() => applyTemplate(name)}
                  type="button"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Job Title *</label>
          <input
            type="text"
            placeholder="e.g. Data Scientist"
            value={profile.title}
            onChange={set('title')}
          />
        </div>

        <div className="form-group">
          <label>Required Skills * (comma-separated)</label>
          <input
            type="text"
            placeholder="e.g. Python, SQL, Machine Learning"
            value={profile.skills}
            onChange={set('skills')}
          />
        </div>

        <div className="form-group">
          <label>Min. Years of Experience *</label>
          <input
            type="number"
            min="0"
            max="30"
            placeholder="e.g. 3"
            value={profile.minExperience}
            onChange={set('minExperience')}
          />
        </div>

        <div className="form-group">
          <label>Preferred Education Level</label>
          <select value={profile.education} onChange={set('education')}>
            <option value="">Any</option>
            <option value="High School">High School</option>
            <option value="Associate's">Associate's Degree</option>
            <option value="Bachelor's">Bachelor's Degree</option>
            <option value="Master's">Master's Degree</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div className="form-group full">
          <label>Job Description *</label>
          <textarea
            rows={4}
            placeholder="Describe the role, responsibilities, and expectations..."
            value={profile.description}
            onChange={set('description')}
          />
        </div>

        <div className="form-group full">
          <label>Preferred Certifications / Tools (optional)</label>
          <input
            type="text"
            placeholder="e.g. AWS Certified, Tableau, Docker"
            value={profile.certifications}
            onChange={set('certifications')}
          />
        </div>
      </div>

      <div className="nav-buttons">
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          * Required fields
        </span>
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue to Upload →
        </button>
      </div>
    </div>
  )
}
