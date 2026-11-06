interface Props {
  score: number
  size?: number
}

export default function ScoreRing({ score, size = 72 }: Props) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const colorClass =
    score >= 70 ? 'score-high' :
    score >= 45 ? 'score-med' : 'score-low'

  const textColorClass =
    score >= 70 ? 'score-high-text' :
    score >= 45 ? 'score-med-text' : 'score-low-text'

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`score-ring-fill ${colorClass}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-text">
        <span className={`score-ring-value ${textColorClass}`}>{score}</span>
        <span className="score-ring-pct">/ 100</span>
      </div>
    </div>
  )
}
