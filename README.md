## Inspiration
We built ADHD BDBD because most of us on the team have ADHD, and we know firsthand how hard it can be to study alone. One effective strategy for staying engaged is called body doubling: having someone present while you work.
So we thought… What if that ‘someone’ was a slice of pizza?

## What it does
ADHD BDBD allows students to organize their day in a way that feels fun, structured, and supportive. Users can add their tasks manually, or import them directly from platforms like Gmail and Canvas. Each task can then be broken into subtasks, either manually or through AI-generated recommendations. Once those subtasks are prepared, students can choose the ones they want to focus on that day, which forms their ‘daily pizza’ study plan.

To help maintain focus, users are joined by a customizable pizza-slice body double who acts as a virtual study companion. They can personalize its personality and voice. Then users choose different virtual study environments such as a coffee shop, a library, or a park. A built-in Pomodoro timer helps guide focused work sessions, and at the end of each session, the body double prompts a brief reflection to help the student consolidate what they’ve learned.

In addition, the app includes a planning and overview page where students can evaluate tasks by urgency and importance, view upcoming deadlines, and track streaks to support habit building. 

## How we built it
After researching about study habits of ADHD students, we decided to make the website as accessible as possible by adding many different functions to improve  efficiency. We also fun and dynamic by incorporating our web development with engaging fonts and colors. 

Our backend turns a simple chat UI into a voice-enabled, tool-using, ADHD-friendly companion. It powers:
	•	Stateful AI chat (Letta) that can use tools (email/calendar/files/LMS/tasks) via MCP and composio
	•	Shared To-Do list (DB-backed) that both the agent and the UI can add/edit/complete/delete in real time
	•	Pomodoro coaching with gentle follow-ups and spoken prompts
	•	Voice via Fish Voice (Fish Audio) for real-time TTS
	•	OAuthed integrations (Gmail, Google Calendar, Canvas LMS, Google Drive, Google Tasks) through Composio

## Challenges we ran into
We faced technical challenges, especially with communications between frontend and backend. The integration part was the most difficult for us. We realized that we should have communicated better with clear and meaningful talks, not just yapping.

## Accomplishments that we're proud of
Making something that would actually benefit people with different neural systems and providing them an accessible app. 

## What we learned
Throughout the development process, we learned that ADHD presents itself differently for everyone, and designing for flexibility and accessibility is essential. 

## What's next for ADHD BDBD (ADHD Body Double BuDdy)
1. Partner with a professional, medical institute to conduct research on the effectiveness of the product. 
2. Make a 3D customizable body double based on the users image input and description
3. Include a web extension so that users can move on to other web pages without a loss of time
