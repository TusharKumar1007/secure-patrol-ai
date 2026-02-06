# 🛡️ Secure Patrol - AI-Powered Guard Management

An MVP solution to digitize security patrols, replacing paper logbooks with real-time tracking and AI-driven insights. Built for the Commando360 interview challenge.

🔗 **Live Demo:** [Live webapp](https://secure-patrol-ai.vercel.app/)
🎥 **Video Walkthrough:** [Demo Video](https://www.loom.com/share/e282c69fed3440d9b8a32943c52fd0bb)

## 🚀 Key Features
- **Guard Interface:** Mobile-friendly check-in system.
- **Supervisor Dashboard:** Real-time feed of patrol logs using Server Actions.
- **AI Anomaly Detection:** Uses Google gemini 3 flash preview to analyze patrol patterns and detect low activity or missed rounds.
- **Passwordless Auth:** Simple email-based login for quick access.

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon Serverless) via Prisma ORM
- **AI:** Google Generative AI (Gemini)
- **Styling:** Tailwind CSS

## 🧠 Approach & Trade-offs
**1. Why Next.js?**
I chose Next.js to handle both the Frontend and the Backend API in a single repository, allowing for rapid MVP development within the 4-day limit.

**2. AI Implementation**
I integrated Google Gemini to process unstructured log data into natural language summaries. I implemented a **fallback mechanism**: if the AI API is unreachable, the system switches to a local algorithm to ensure Supervisors always receive a report.

**3. Limitations (Due to time)**
- Authentication is email-only (simulated security).
- GPS is currently simulated via API rather than raw device sensors for easier testing on desktop.

## 📦 Local Setup
1. Clone repo: `git clone https://github.com/TusharKumar1007/secure-patrol-ai.git`
2. Install dependencies: `npm install`
3. Setup Environment:
   - Create `.env` with `DATABASE_URL` and `GEMINI_API_KEY`.
4. Run DB: `npx prisma db push`
5. Start: `npm run dev`