import Anthropic from '@anthropic-ai/sdk'
import * as pdfjsLib from 'pdfjs-dist'
import type { JobProfile, ScreeningResult } from '../types'

// Point pdf.js worker to the CDN so we don't need a separate worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

/** Extract clean text from a PDF using pdf.js. Returns empty string for image-only PDFs. */
async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageTexts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pageTexts.push(pageText)
  }
  return pageTexts.join('\n').trim()
}

/** Returns true if a PDF has no extractable text (likely a scanned image PDF) */
export async function isImageOnlyPdf(file: File): Promise<boolean> {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') return false
  const text = await extractPdfText(file)
  // Consider image-only if less than 50 meaningful characters across all pages
  return text.replace(/\s/g, '').length < 50
}

/** Read .txt file as plain text */
function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read text file'))
    reader.readAsText(file)
  })
}

/** Public: extract text from any supported file */
export async function extractResumeText(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file)
  }
  return readTextFile(file)
}

export async function screenResume(
  apiKey: string,
  file: File,
  job: JobProfile,
  id: string,
  existingText?: string
): Promise<ScreeningResult> {
  const resumeText = existingText ?? (await extractResumeText(file))

  // Detect image-only PDF
  const imagePdf =
    (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') &&
    resumeText.replace(/\s/g, '').length < 50

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const jobContext = `
Job Title: ${job.title}
Required Skills: ${job.skills}
Minimum Experience: ${job.minExperience} years
Preferred Education: ${job.education || 'Any'}
Certifications/Tools: ${job.certifications || 'None specified'}
Job Description: ${job.description}
`.trim()

  const userPrompt = `
Here is the job profile:
${jobContext}

Here is the candidate's resume:
---
${resumeText.slice(0, 10000)}
---

Analyze this resume against the job profile and return a JSON object with EXACTLY these fields:
{
  "candidateName": "Full name extracted from resume, or 'Unknown Candidate'",
  "matchScore": <integer 0-100>,
  "category": "Shortlist" | "Hold" | "Reject",
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "experienceYears": <number>,
  "educationLevel": "e.g. Bachelor's in Computer Science",
  "summary": "2-3 sentence assessment of the candidate's fit",
  "recommendation": "One clear sentence action recommendation",
  "lowConfidence": <true if resume text was unclear/garbled, false otherwise>
}

Rules:
- matchScore 70-100 → Shortlist, 45-69 → Hold, 0-44 → Reject
- Set lowConfidence: true if the resume text seems incomplete, garbled, or hard to parse
- Only return valid JSON, no markdown, no extra text.
`.trim()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: 'You are an expert HR recruiter. Always respond in valid JSON only.',
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  // Strip potential markdown code fences
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  return {
    id,
    fileName: file.name,
    candidateName: String(parsed.candidateName ?? 'Unknown Candidate'),
    matchScore: Math.min(100, Math.max(0, Number(parsed.matchScore ?? 0))),
    category: (['Shortlist', 'Hold', 'Reject'].includes(parsed.category)
      ? parsed.category
      : 'Reject') as ScreeningResult['category'],
    matchedSkills: Array.isArray(parsed.matchedSkills)
      ? parsed.matchedSkills.map(String)
      : [],
    missingSkills: Array.isArray(parsed.missingSkills)
      ? parsed.missingSkills.map(String)
      : [],
    experienceYears: Number(parsed.experienceYears ?? 0),
    educationLevel: String(parsed.educationLevel ?? ''),
    summary: String(parsed.summary ?? ''),
    recommendation: String(parsed.recommendation ?? ''),
    lowConfidence: Boolean(parsed.lowConfidence),
    imagePdf,
  }
}

/** Ask Claude a follow-up question about a single candidate */
export async function askFollowUp(
  apiKey: string,
  question: string,
  result: ScreeningResult,
  job: JobProfile
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const context = `
Job: ${job.title}
Candidate: ${result.candidateName}
Match Score: ${result.matchScore}/100
Category: ${result.category}
Experience: ${result.experienceYears} years
Education: ${result.educationLevel}
Matched Skills: ${result.matchedSkills.join(', ')}
Missing Skills: ${result.missingSkills.join(', ')}
AI Summary: ${result.summary}
`.trim()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: 'You are an expert HR recruiter assistant. Give concise, helpful answers.',
    messages: [
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  })

  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
}
