# VedaAI Assessment Creator

Welcome to my submission for the VedaAI Full Stack Engineer Assignment! 

I built this AI Assessment Creator as a complete, production-ready full-stack application. The goal of this platform is to allow teachers to effortlessly generate highly structured, customized question papers tailored to their specific classroom needs using Generative AI.

## Architecture Overview

I designed this application with a decoupled frontend and backend architecture to ensure scalability, responsiveness, and clear separation of concerns.

### Frontend
- **Framework:** Next.js 14 with TypeScript
- **Styling:** CSS Modules with a modern "Glassmorphism" aesthetic strictly matching the Figma specifications.
- **State Management:** React Context API & Cookies for robust authentication state management and routing.
- **Real-time:** `socket.io-client` handles live WebSocket events from the backend to instantly update the UI when the background AI worker finishes generating a paper.

### Backend
- **Framework:** Node.js + Express (TypeScript)
- **Database:** MongoDB (via Mongoose) to persistently store users, authentication states, and complete generated assignments.
- **Caching & Queues:** Redis combined with BullMQ. This is crucial because LLM generation can take 5-15 seconds. Offloading this to a Redis-backed queue ensures the main Node.js thread never blocks.
- **Real-time:** Socket.io server to emit real-time status updates (`COMPLETED`, `FAILED`) to specific clients based on background job progression.
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`) handles the core logic of intelligently parsing instructions and outputting a highly structured JSON question paper.

## Approach

My approach prioritized **User Experience (UX)** and **System Resilience**.

1. **Robust Background Processing:**
   Instead of forcing the user to wait on a long-running HTTP request (which can easily timeout), the Express server immediately responds with `201 Created` and adds the AI task to a BullMQ queue. A dedicated background worker continuously processes this queue. The frontend listens gracefully via WebSockets and shows a loading screen until the task finishes.
   
2. **Deterministic AI Outputs:**
   One of the hardest parts of LLM integration is getting consistent structures. I achieved this by enforcing a strict JSON schema prompt requirement on the Gemini model. The backend parses this JSON and structures it cleanly into MongoDB, meaning the frontend never renders raw markdown or blocks of AI text.

3. **Pixel-Perfect UI implementation:**
   I faithfully translated the Figma designs into responsive CSS, implementing floating navigational elements, sleek rounded typography, and modern aesthetics.

## Bonus Features Implemented

- **PDF Export:** Integrated `html2pdf.js` on the frontend. The user can click "Download as PDF" to save the beautifully formatted, exam-style question paper natively to their device.
- **Regeneration Action Bar:** Built a "Regenerate" flow that allows the user to provide specific feedback (e.g. "Make Section A harder") and immediately trigger a new AI generation cycle over WebSockets.
- **UI Polish:** Added safe-area insets for mobile layouts, completely custom floating navigation bars, hover transitions, and active-state styling.
- **Caching & Queues:** Completely functional BullMQ & Redis implementation for robust retry mechanisms on AI failure.
- **Code Cleanliness:** Stripped all comments for clean, production-ready code submission.

---
*For detailed setup instructions, please see the README files inside the `/frontend` and `/backend` directories.*
