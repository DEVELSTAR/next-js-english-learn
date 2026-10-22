export type UserRole = "student" | "admin" | "super_admin"

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  created_at?: string
  updated_at?: string
}

export type LessonType = "daily_class" | "foundational_topic"
export type LessonStatus = "draft" | "published"

export interface Lesson {
  id: number
  title: string
  slug: string
  lesson_date: string
  topic?: string | null
  introduction?: string | null
  status: LessonStatus
  lesson_type: LessonType
  content?: string | null
  position: number
  author_id?: string | null
  created_at: string
  updated_at: string
}

export interface LessonCompletion {
  id: number
  user_id: string
  lesson_id: number
  completed: boolean
  needs_revision: boolean
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface LessonChatMessage {
  id: number
  lesson_id: number
  user_id: string
  role: "user" | "model"
  content: string
  created_at: string
}

export interface LessonComment {
  id: number
  lesson_id: number
  user_id: string
  parent_id?: number | null
  content: string
  created_at: string
  user?: Partial<Profile> | null
}

export interface Note {
  id: number
  user_id: string
  lesson_id?: number | null
  content: string
  is_global: boolean
  created_at: string
  updated_at: string
  user?: Partial<Profile> | null
  lesson?: Pick<Lesson, "id" | "title" | "slug" | "lesson_type"> | null
  shares?: NoteShare[]
}

export interface NoteShare {
  id: number
  note_id: number
  user_id: string
  can_edit: boolean
  status: "pending" | "accepted" | "rejected"
  created_at: string
  updated_at: string
  user?: Profile | null
}
