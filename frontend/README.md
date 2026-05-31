# VedaAI Frontend Setup

This is the Next.js frontend for the VedaAI Assessment Creator.

## Prerequisites
- Node.js (v18+)
- The backend server running locally on port 4000 (or a deployed backend URL).

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in this directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```
*(If you are connecting to a deployed backend, replace the localhost URL with your live backend domain).*

## Running Locally

To run the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Build

To build the application for production:
```bash
npm run build
npm start
```
