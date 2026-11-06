# AI Resume Screener

A browser-based AI-powered resume screening tool built with React, TypeScript, and Claude AI. Upload multiple resumes, define a job profile, and get instant candidate rankings with match scores, skill analysis, and recruiter insights — all running locally in your browser.

---

## Features

- **Bulk resume upload** — drag and drop multiple `.pdf` or `.txt` files at once
- **Concurrent AI screening** — all resumes are processed simultaneously using `Promise.all()`
- **Smart PDF parsing** — uses pdf.js for accurate text extraction from real PDFs
- **Image PDF detection** — warns when a scanned/image PDF has no extractable text
- **Match scoring** — each candidate gets a 0–100 score with a visual ring indicator
- **Auto categorisation** — Shortlist / Hold / Reject based on configurable score thresholds
- **Duplicate detection** — flags candidates with the same name across multiple files
- **Live search** — filter results by name, skill, or filename instantly
- **Side-by-side comparison** — select up to 4 candidates for a detailed comparison table
- **Batch category override** — manually change any candidate's category with one click
- **Recruiter notes** — add a private note to any candidate card
- **AI follow-up chat** — ask Claude follow-up questions about any individual candidate
- **Score threshold slider** — adjust Shortlist/Hold/Reject cutoffs and re-categorise all results
- **Job profile templates** — pre-built templates for 5 common roles
- **Session history** — past screening sessions are saved to localStorage and reloadable
- **CSV export** — download all results including notes, ranks, and duplicate flags
- **API key persistence** — optional "Remember" checkbox saves your key across sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| PDF parsing | pdf.js (`pdfjs-dist`) |
| File upload | react-dropzone |
| Icons | lucide-react |
| Styling | Plain CSS with CSS variables |
| Storage | Browser localStorage |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/resume-screener.git
cd resume-screener

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

Output goes to the `dist/` folder and can be served with any static host.

---

## How to Use

**Step 1 — Job Requirements**
Fill in the job title, required skills, minimum experience, education level, and a short description. Use the Templates dropdown to pre-fill common roles like Data Scientist or Software Engineer.

**Step 2 — Upload Resumes**
Drag and drop `.pdf` or `.txt` resume files into the upload zone. Multiple files are accepted at once. Click "Screen All Resumes" to start.

**Step 3 — Results Dashboard**
- Use the filter tabs to view All / Shortlist / Hold / Reject
- Use the search bar to find candidates by name or skill
- Click a category badge on any card to manually override it
- Click "Thresholds" to adjust the score cutoffs and re-categorise all results
- Select up to 4 candidates and click "Compare" for a side-by-side table
- Click "Add Note" on any card to save a recruiter note
- Click "Ask AI" to ask Claude a follow-up question about that candidate
- Click "Export CSV" to download all results

---

## Project Structure

```
src/
├── App.tsx                      # Root component, all global state
├── main.tsx                     # Entry point
├── index.css                    # Global styles and design system
├── types.ts                     # Shared TypeScript interfaces
├── vite-env.d.ts                # Vite type declarations
├── lib/
│   ├── screener.ts              # Anthropic API calls + PDF/text extraction
│   └── storage.ts               # localStorage helpers
└── components/
    ├── JobProfileForm.tsx        # Step 1 — job requirements form
    ├── ResumeUpload.tsx          # Step 2 — drag-drop upload + file list
    ├── ResultsDashboard.tsx      # Step 3 — summary, filters, search, export
    ├── ResultCard.tsx            # Individual candidate card
    ├── ScoreRing.tsx             # Animated circular score indicator
    ├── CompareModal.tsx          # Side-by-side candidate comparison table
    └── SessionHistory.tsx        # Past sessions modal
```

---

## API Key Security

Your Anthropic API key is entered directly in the browser and sent only to `api.anthropic.com` when screening resumes. It is never stored on any server. If you use the "Remember" checkbox it is saved in your browser's `localStorage` — do not use this on shared computers.

---

## License

MIT
