import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle2, XCircle,
  Loader2, Clock, Trash2, Play, Eye, X,
  RefreshCw,
} from 'lucide-react'
import type { ResumeFile } from '../types'

interface Props {
  files: ResumeFile[]
  onFilesAdded: (files: File[]) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  onScreenAll: () => void
  isScreening: boolean
  progress: { done: number; total: number }
  onBack: () => void
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  screening: <Loader2 size={14} />,
  done: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ResumeUpload({
  files, onFilesAdded, onRemove, onRetry, onScreenAll, isScreening, progress, onBack,
}: Props) {
  const [previewFile, setPreviewFile] = useState<ResumeFile | null>(null)

  const onDrop = useCallback(
    (accepted: File[]) => { onFilesAdded(accepted) },
    [onFilesAdded]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    multiple: true,
    disabled: isScreening,
  })

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const failedCount = files.filter((f) => f.status === 'failed').length
  const canScreen = pendingCount > 0 && !isScreening

  return (
    <div className="section-card">
      <div className="section-title">
        <Upload size={20} />
        <span>Upload Resumes</span>
        {files.length > 0 && (
          <span
            style={{
              marginLeft: 8,
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            {files.length} file{files.length !== 1 ? 's' : ''} · {pendingCount} pending
            {failedCount > 0 && `, ${failedCount} failed`}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`dropzone-outer ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon">
          <Upload size={40} />
        </div>
        <h3>
          {isDragActive ? 'Drop your resumes here...' : 'Drag & drop resumes here'}
        </h3>
        <p>or click to browse files</p>
        <span className="dropzone-hint">
          .pdf and .txt files accepted · multiple files at once
        </span>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((rf) => (
            <div key={rf.id} className={`file-item ${rf.status}`}>
              <div className="file-item-left">
                <FileText size={16} />
                <span className="file-name" title={rf.file.name}>
                  {rf.file.name}
                </span>
                <span className="file-size">{formatBytes(rf.file.size)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`badge badge-${rf.status}`}>
                  {STATUS_ICONS[rf.status]}
                  {rf.status === 'screening'
                    ? 'Screening…'
                    : rf.status === 'done'
                    ? 'Done'
                    : rf.status === 'failed'
                    ? 'Failed'
                    : 'Pending'}
                </span>
                {/* Preview extracted text */}
                {rf.extractedText && (
                  <button
                    className="btn btn-secondary icon-btn"
                    title="Preview extracted text"
                    onClick={() => setPreviewFile(rf)}
                  >
                    <Eye size={13} />
                  </button>
                )}
                {/* Retry failed */}
                {rf.status === 'failed' && !isScreening && (
                  <button
                    className="btn btn-secondary icon-btn"
                    title="Retry screening"
                    onClick={() => onRetry(rf.id)}
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
                {/* Remove pending */}
                {rf.status === 'pending' && !isScreening && (
                  <button
                    className="btn btn-secondary icon-btn"
                    title="Remove file"
                    onClick={() => onRemove(rf.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {isScreening && (
        <div className="screening-progress">
          <div className="spinner" />
          <div className="progress-info">
            <p>
              Screening {progress.done} of {progress.total} resumes…
            </p>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="nav-buttons" style={{ marginTop: 20 }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isScreening}
        >
          ← Back
        </button>
        <button
          className="btn btn-success btn-lg"
          onClick={onScreenAll}
          disabled={!canScreen}
        >
          <Play size={16} />
          Screen All Resumes ({pendingCount})
        </button>
      </div>

      {/* Text Preview Modal */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <FileText size={16} /> {previewFile.file.name}
              </span>
              <button
                className="modal-close"
                onClick={() => setPreviewFile(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <pre className="preview-text">
                {previewFile.extractedText || 'No text extracted.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
