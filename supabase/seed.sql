-- ========================================================
-- Learn English - Supabase Seed Data
-- ========================================================

-- Insert Initial Lessons & Foundational Topics
INSERT INTO public.lessons (title, slug, lesson_date, topic, introduction, status, lesson_type, content, position)
VALUES
(
    'Everyday Hinglish to Fluent English',
    'everyday-hinglish-to-fluent-english',
    CURRENT_DATE,
    'Daily Speaking',
    'Learn how to replace common Hinglish phrases with natural, confident English expressions.',
    'published',
    'daily_class',
    '<h2>How to Stop Translating Word-by-Word</h2><p>Most English learners in India think in Hindi/Urdu first and then translate. This causes hesitation!</p><blockquote><strong>Rule:</strong> Think in concepts, not direct word-for-word translations.</blockquote><h3>Common Fixes:</h3><ul><li><strong>Don''t say:</strong> <em>"What is your good name?"</em> &rarr; <strong>Say:</strong> <em>"May I know your name?"</em> or <em>"What''s your name?"</em></li><li><strong>Don''t say:</strong> <em>"I will revert back tomorrow."</em> &rarr; <strong>Say:</strong> <em>"I will get back to you tomorrow."</em></li><li><strong>Don''t say:</strong> <em>"Open the fan."</em> &rarr; <strong>Say:</strong> <em>"Turn on the fan."</em></li></ul>',
    1
),
(
    'English Tenses Made Simple',
    'english-tenses-made-simple',
    CURRENT_DATE - INTERVAL '1 day',
    'Grammar Foundations',
    'Master Past, Present, and Future tenses with simple real-life Hinglish analogies.',
    'published',
    'foundational_topic',
    '<h2>The 3 Core Tenses in Daily Life</h2><p>Understand when to use Simple Present vs Present Continuous:</p><ul><li><strong>Habitual / Daily Routine:</strong> <em>"I drink tea every morning." (Main roz subah chai peeta hoon)</em></li><li><strong>Happening Right Now:</strong> <em>"I am drinking tea right now." (Main abhi chai pee raha hoon)</em></li></ul>',
    2
)
ON CONFLICT (slug) DO NOTHING;

