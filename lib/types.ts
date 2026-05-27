export type Stage = 'Researching' | 'Applied' | 'Phone Screen' | 'Interview' | 'Final Round' | 'Offer' | 'Rejected' | 'Withdrawn'
export type Priority = 'High' | 'Medium' | 'Low'
export type ContactType = 'PM' | 'Recruiter' | 'Founder' | 'Leader'
export type ContactStatus = 'Connected' | 'Active' | 'Pending' | 'Closed'
export type ContentStatus = 'Idea' | 'Draft' | 'Published'

export interface Application {
  id: string
  user_id: string
  company: string
  role: string
  url: string
  source: string
  stage: Stage
  priority: Priority
  score: number
  date_added: string
  date_applied: string | null
  next_action: string
  next_action_date: string | null
  notes: string
  ats_keywords: string[]
  contact_name: string
  contact_linkedin: string
  response: string
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  title: string
  company: string
  linkedin: string
  type: ContactType
  status: ContactStatus
  last_contact: string | null
  next_follow_up: string | null
  notes: string
  coffee_chat: boolean
  created_at: string
}

export interface CompanyDoc {
  id: string
  user_id: string
  company: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

export interface ContentItem {
  id: string
  user_id: string
  title: string
  type: string
  status: ContentStatus
  target_company: string
  platform: string[]
  date_drafted: string | null
  date_published: string | null
  outline: string
  notes: string
  created_at: string
}
