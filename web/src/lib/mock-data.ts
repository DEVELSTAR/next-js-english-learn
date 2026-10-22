import { Lesson } from "@/types/database"

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 1,
    title: "Everyday Hinglish to Fluent English",
    slug: "everyday-hinglish-to-fluent-english",
    lesson_date: new Date().toISOString().split("T")[0],
    topic: "Daily Speaking",
    introduction: "Learn how to replace common Hinglish phrases with natural, confident English expressions.",
    status: "published",
    lesson_type: "daily_class",
    content: `
<h2>How to Stop Translating Word-by-Word</h2>
<p>Most English learners in India think in Hindi/Urdu first and then translate word-by-word into English. This causes hesitation and unnatural sentences!</p>

<blockquote>
  <strong>Golden Rule:</strong> Think in concepts, not direct word-for-word translations.
</blockquote>

<h3>Common Fixes:</h3>
<ul>
  <li><strong>Don't say:</strong> <em>"What is your good name?"</em> &rarr; <strong>Say:</strong> <em>"May I know your name?"</em> or <em>"What's your name?"</em></li>
  <li><strong>Don't say:</strong> <em>"I will revert back tomorrow."</em> &rarr; <strong>Say:</strong> <em>"I will get back to you tomorrow."</em></li>
  <li><strong>Don't say:</strong> <em>"Open the fan / AC."</em> &rarr; <strong>Say:</strong> <em>"Turn on the fan / AC."</em></li>
  <li><strong>Don't say:</strong> <em>"Close the light."</em> &rarr; <strong>Say:</strong> <em>"Turn off the light."</em></li>
  <li><strong>Don't say:</strong> <em>"I gave exam yesterday."</em> &rarr; <strong>Say:</strong> <em>"I took the exam yesterday."</em> (Students 'take' tests; teachers 'give' tests!)</li>
</ul>

<h3>Daily Practice Challenge:</h3>
<p>Use at least two of these corrected phrases today when speaking to friends or colleagues. Ask your AI Tutor on the right if you are unsure of how to use them!</p>
`,
    position: 1,
    author_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Ordering Food & Coffee Naturally",
    slug: "ordering-food-and-coffee-naturally",
    lesson_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    topic: "Social Situations",
    introduction: "Polite and confident ways to place orders at cafes and restaurants without awkward pauses.",
    status: "published",
    lesson_type: "daily_class",
    content: `
<h2>Ordering with Confidence</h2>
<p>Instead of saying <em>"Give me one coffee"</em> or <em>"I want burger"</em>, polite native phrasing uses modal verbs.</p>

<h3>Key Expressions:</h3>
<ul>
  <li><em>"Could I please get a medium latte with oat milk?"</em></li>
  <li><em>"I'll have the grilled chicken sandwich, please."</em></li>
  <li><em>"Excuse me, could we get the check (bill) whenever you're ready?"</em></li>
</ul>
`,
    position: 2,
    author_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "English Tenses Made Simple",
    slug: "english-tenses-made-simple",
    lesson_date: new Date().toISOString().split("T")[0],
    topic: "Grammar Foundations",
    introduction: "Master Past, Present, and Future tenses with simple real-life Hinglish analogies.",
    status: "published",
    lesson_type: "foundational_topic",
    content: `
<h2>The 3 Core Tenses in Daily Life</h2>
<p>Understand when to use Simple Present vs Present Continuous:</p>

<ul>
  <li>
    <strong>Habitual / Daily Routine (Simple Present):</strong><br />
    <em>"I drink tea every morning."</em> (Main roz subah chai peeta hoon)
  </li>
  <li>
    <strong>Happening Right Now (Present Continuous):</strong><br />
    <em>"I am drinking tea right now."</em> (Main abhi chai pee raha hoon)
  </li>
</ul>

<blockquote>
  <strong>Common Mistake:</strong> Saying <em>"I am understanding"</em> or <em>"I am knowing him"</em>.<br />
  Stative verbs (understand, know, like, love) are not used in continuous form! Always say: <em>"I understand"</em> and <em>"I know him"</em>.
</blockquote>
`,
    position: 1,
    author_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: "Articles Demystified: A, An, and The",
    slug: "articles-demystified-a-an-the",
    lesson_date: new Date().toISOString().split("T")[0],
    topic: "Grammar Foundations",
    introduction: "Clear rules to know exactly when to use 'A', 'An', or 'The' without guessing.",
    status: "published",
    lesson_type: "foundational_topic",
    content: `
<h2>Mastering Articles</h2>
<p>In Hindi or Urdu, we don't have direct words for 'A', 'An', or 'The', which is why this is a very common difficulty for Indian learners.</p>

<h3>1. Use 'A' vs 'An' based on SOUND, not letters:</h3>
<ul>
  <li><strong>An hour</strong> (silent H, sounds like 'our' - vowel sound)</li>
  <li><strong>A university</strong> (starts with 'yu' consonant sound!)</li>
  <li><strong>An honest person</strong> (vowel sound)</li>
</ul>

<h3>2. Use 'The' for specific things:</h3>
<ul>
  <li><em>"I saw <strong>a</strong> dog."</em> (Any dog)</li>
  <li><em>"<strong>The</strong> dog was barking loudly."</em> (The specific dog I just mentioned)</li>
</ul>
`,
    position: 2,
    author_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

