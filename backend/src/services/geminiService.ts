import { Queue, Worker } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { redisConnection } from '../config/redis';
import { Assignment } from '../models/Assignment';
export const generationQueue = new Queue('generationQueue', { connection: redisConnection });
export const startGeminiWorker = (io: any) => {
  const worker = new Worker('generationQueue', async job => {
    const { assignmentId } = job.data;
    console.log(`Processing job for assignment: ${assignmentId}`);
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return { success: false, error: 'Not found' };
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: "application/json" } });
      const prompt = `You are an expert teacher. Create a question paper based on the following config.
      Title: ${assignment.title}
      Subject: ${assignment.subject || 'General'}
      Class/Grade: ${assignment.classLevel || 'General'}
      Duration: ${assignment.duration || 'Not specified'}
      Difficulty: ${assignment.difficulty || 'Mixed'}
      Additional Info: ${assignment.additionalInfo || 'None'}
      Questions Configuration: ${JSON.stringify(assignment.questionsConfig)}
      ${assignment.regenerateFeedback ? `USER REGENERATION FEEDBACK: ${assignment.regenerateFeedback}\n(You MUST apply these requested changes to the generated paper).` : ''}
      CRITICAL RULES:
      1. For "Multiple Choice Questions" or "MCQ", you MUST provide 4 distinct options (e.g., A, B, C, D) below the question text.
      2. For "Diagram/Graph-Based Questions", clearly describe the visual scenario in text if an actual image cannot be provided.
      3. Ensure the questions match the specified difficulty level overall.
      4. Strongly adhere to any specific "note" provided inside the Questions Configuration for each category.
      Output the response strictly in the following JSON schema format:
      {
        "aiMessage": "A friendly personalized message addressing the teacher and summarizing what was generated.",
        "metadata": {
          "subject": "${assignment.subject || 'Inferred subject'}",
          "class": "${assignment.classLevel || 'Inferred class'}",
          "timeAllowed": "${assignment.duration || 'Inferred time duration based on config'}"
        },
        "sections": [
          {
            "title": "Section Title (e.g., Section A: Multiple Choice)",
            "instruction": "Instructions for this section",
            "questions": [
              { "text": "Question text", "difficulty": "Easy" | "Moderate" | "Challenging", "marks": <number> }
            ]
          }
        ],
        "answerKey": [
          "1. First answer text here...",
          "2. Second answer text here..."
        ]
      }`;
      let parts: any[] = [prompt];
      if (assignment.uploadedImage && assignment.uploadedImage.data) {
          parts.unshift({
              inlineData: {
                  data: assignment.uploadedImage.data,
                  mimeType: assignment.uploadedImage.mimeType
              }
          });
      }
      const result = await model.generateContent(parts);
      const responseText = result.response.text();
      const generatedPaper = JSON.parse(responseText);
      await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'COMPLETED',
          generatedPaper: generatedPaper
      });
      io.emit('assignmentUpdate', { assignmentId, status: 'COMPLETED' });
      return { success: true };
    } catch (error) {
      console.error("Gemini Error:", error);
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'FAILED' });
      io.emit('assignmentUpdate', { assignmentId, status: 'FAILED' });
      return { success: false, error };
    }
  }, { connection: redisConnection });
  worker.on('error', err => {
      console.error('Worker error:', err);
  });
};
