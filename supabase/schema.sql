-- ========================================================
-- Learn English Web App - Supabase PostgreSQL Schema
-- Migration from Ruby on Rails to Supabase (Vercel)
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 2. LESSONS & TOPICS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    lesson_date DATE NOT NULL,
    topic TEXT,
    introduction TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    lesson_type TEXT NOT NULL DEFAULT 'daily_class' CHECK (lesson_type IN ('daily_class', 'foundational_topic')),
    content TEXT, -- Rendered ActionText / Markdown / HTML
    position INTEGER NOT NULL DEFAULT 0,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(lesson_date DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_type_status ON public.lessons(lesson_type, status);

-- --------------------------------------------------------
-- 3. LESSON COMPLETIONS & REVISION
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id BIGINT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    needs_revision BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON public.lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_lesson ON public.lesson_completions(lesson_id);

-- --------------------------------------------------------
-- 4. AI TUTOR CHAT MESSAGES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_lesson_user ON public.lesson_chat_messages(lesson_id, user_id, created_at ASC);

-- --------------------------------------------------------
-- 5. CLASSROOM CHATROOM (Comments)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_comments (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_lesson_created ON public.lesson_comments(lesson_id, created_at ASC);

-- Enable Supabase Realtime replication on lesson_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_comments;

-- --------------------------------------------------------
-- 6. NOTES SYSTEM
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id BIGINT REFERENCES public.lessons(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_global BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_lesson ON public.notes(lesson_id);

-- --------------------------------------------------------
-- 7. NOTE SHARES & INVITATIONS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_shares (
    id BIGSERIAL PRIMARY KEY,
    note_id BIGINT NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(note_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_note_shares_user_status ON public.note_shares(user_id, status);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile name"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Super Admins can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_super_admin());

-- 2. Lessons Policies
CREATE POLICY "Anyone can read published lessons"
    ON public.lessons FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can insert lessons"
    ON public.lessons FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update lessons"
    ON public.lessons FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Super Admins can delete lessons"
    ON public.lessons FOR DELETE
    TO authenticated
    USING (public.is_super_admin());

-- 3. Lesson Completions Policies
CREATE POLICY "Users can manage own completions"
    ON public.lesson_completions FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. AI Tutor Chat Messages Policies
CREATE POLICY "Users can read own AI chat messages"
    ON public.lesson_chat_messages FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI chat messages"
    ON public.lesson_chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can clear own AI chat messages"
    ON public.lesson_chat_messages FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 5. Lesson Comments Policies
CREATE POLICY "Authenticated users can read comments"
    ON public.lesson_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert comments"
    ON public.lesson_comments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "Users can delete own comments or admins can moderate"
    ON public.lesson_comments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- 6. Notes Policies
CREATE POLICY "Users can read visible notes"
    ON public.notes FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR is_global = TRUE
        OR EXISTS (
            SELECT 1 FROM public.note_shares
            WHERE note_shares.note_id = notes.id
              AND note_shares.user_id = auth.uid()
              AND note_shares.status = 'accepted'
        )
    );

CREATE POLICY "Authenticated users can create notes"
    ON public.notes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "Authors or editors can update notes"
    ON public.notes FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.note_shares
            WHERE note_shares.note_id = notes.id
              AND note_shares.user_id = auth.uid()
              AND note_shares.can_edit = TRUE
              AND note_shares.status = 'accepted'
        )
    );

CREATE POLICY "Authors can delete notes"
    ON public.notes FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 7. Note Shares Policies
CREATE POLICY "Users can read note shares"
    ON public.note_shares FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_shares.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Note authors can create note shares"
    ON public.note_shares FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_shares.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Invited users can accept or reject shares"
    ON public.note_shares FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Note authors can delete shares"
    ON public.note_shares FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_shares.note_id AND notes.user_id = auth.uid()
        )
    );

