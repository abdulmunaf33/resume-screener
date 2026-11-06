export type FileStatus = 'pending' | 'screening' | 'done' | 'failed'
export type Category = 'Shortlist' | 'Hold' | 'Reject'
export type FilterType = 'All' | Category

export interface JobProfile {
  title: string
  skills: string
  minExperience: string
  education: string
  description: string
  certifications: string
}

export interface ResumeFile {
  id: string
  file: File
  status: FileStatus
  error?: string
  extractedText?: string
}

export interface ScreeningResult {
  id: string
  fileName: string
  candidateName: string
  matchScore: number
  category: Category
  matchedSkills: string[]
  missingSkills: string[]
  experienceYears: number
  educationLevel: string
  summary: string
  recommendation: string
  note?: string           // recruiter manual note
  rank?: number           // computed rank by score
  lowConfidence?: boolean
  imagePdf?: boolean      // scanned/image-only PDF — no text extracted
  isDuplicate?: boolean   // same candidate name as another result
}

export interface Session {
  id: string
  createdAt: number
  jobTitle: string
  results: ScreeningResult[]
}

export const JOB_TEMPLATES: Record<string, JobProfile> = {
  'Data Scientist': {
    title: 'Data Scientist',
    skills: 'Python, SQL, Machine Learning, TensorFlow, Pandas, NumPy, Statistics',
    minExperience: '3',
    education: "Master's",
    description:
      'We are looking for a Data Scientist to analyze large datasets, build predictive models, and deliver actionable insights. You will collaborate with product and engineering teams to drive data-informed decisions.',
    certifications: 'AWS Certified Machine Learning, Google Professional Data Engineer',
  },
  'Software Engineer': {
    title: 'Software Engineer',
    skills: 'JavaScript, TypeScript, React, Node.js, REST APIs, Git',
    minExperience: '2',
    education: "Bachelor's",
    description:
      'We are seeking a skilled Software Engineer to design, build, and maintain web applications. You will work in an agile environment, participate in code reviews, and contribute to system architecture.',
    certifications: 'AWS Solutions Architect, Docker',
  },
  'Product Manager': {
    title: 'Product Manager',
    skills: 'Product Strategy, Roadmapping, Agile, Jira, User Research, Analytics',
    minExperience: '4',
    education: "Bachelor's",
    description:
      'As a Product Manager you will define product vision, gather requirements from stakeholders, prioritize the backlog, and coordinate cross-functional teams to deliver high-quality products on time.',
    certifications: 'Certified Scrum Product Owner (CSPO)',
  },
  'UX Designer': {
    title: 'UX Designer',
    skills: 'Figma, User Research, Wireframing, Prototyping, Usability Testing, Design Systems',
    minExperience: '2',
    education: "Bachelor's",
    description:
      'We need a UX Designer to create intuitive and visually appealing user experiences. You will conduct user research, build wireframes and prototypes, and collaborate with engineers to ship polished interfaces.',
    certifications: 'Google UX Design Certificate',
  },
  'DevOps Engineer': {
    title: 'DevOps Engineer',
    skills: 'Kubernetes, Docker, CI/CD, Terraform, AWS, Linux, Bash, Python',
    minExperience: '3',
    education: "Bachelor's",
    description:
      'The DevOps Engineer will build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure reliability, scalability, and security across all deployment environments.',
    certifications: 'AWS DevOps Engineer Professional, CKA (Certified Kubernetes Administrator)',
  },
}
