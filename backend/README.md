# VedaAI Backend Setup

This is the Node.js/Express backend for the VedaAI Assessment Creator.

## Prerequisites
- Node.js (v18+)
- Local MongoDB running (or MongoDB Atlas URI)
- Local Redis running (or cloud Redis URI)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory and configure your variables:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/vedaai
REDIS_URI=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

## Running Locally

To run the backend in development mode (with hot reloading via `ts-node-dev`):
```bash
npm run dev
```

The server will start on `http://localhost:4000` and automatically connect to MongoDB and Redis.
The background worker for BullMQ will start simultaneously to process AI generation tasks.

## Production Build

To compile TypeScript and run the built files:
```bash
npm run build
npm start
```
