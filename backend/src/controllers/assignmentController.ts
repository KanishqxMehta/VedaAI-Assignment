import { Response } from 'express';
import { Assignment } from '../models/Assignment';
import { generationQueue } from '../services/geminiService';
import { AuthRequest } from '../middlewares/authMiddleware';
export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { title, subject, classLevel, duration, difficulty, dueDate, questionsConfig, additionalInfo, uploadedImage } = req.body;
    const newAssignment = new Assignment({
      userId: req.user.id,
      title: title || 'New Assignment',
      subject,
      classLevel,
      duration,
      difficulty,
      dueDate,
      questionsConfig,
      additionalInfo,
      uploadedImage,
      status: 'PENDING'
    });
    await newAssignment.save();
    await generationQueue.add('generate', { assignmentId: newAssignment._id });
    newAssignment.status = 'GENERATING';
    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};
export const regenerateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { feedback } = req.body;
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user.id });
    if (!assignment) return res.status(404).json({ error: 'Not found' });
    if (assignment.isLocked) return res.status(403).json({ error: 'Cannot edit a locked assignment' });
    assignment.status = 'GENERATING';
    if (feedback) {
      assignment.regenerateFeedback = feedback;
    }
    await assignment.save();
    await generationQueue.add('generate', { assignmentId: assignment._id });
    res.json({ success: true, status: 'GENERATING' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate' });
  }
};
export const getAssignments = async (req: AuthRequest, res: Response) => {
    try {
        const assignments = await Assignment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};
export const getAssignmentById = async (req: AuthRequest, res: Response) => {
    try {
        const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ error: 'Not found' });
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
};
export const deleteAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ error: 'Not found or not authorized' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};

export const regenerateQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const { feedback, action } = req.body;
        const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ error: 'Not found' });
        if (assignment.isLocked) return res.status(403).json({ error: 'Cannot edit a locked assignment' });

        await generationQueue.add('regenerate_question', {
            assignmentId: assignment._id,
            questionId: req.params.questionId,
            feedback,
            action // e.g. "enhance" or "regenerate"
        });

        res.json({ success: true, status: 'GENERATING' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to queue question regeneration' });
    }
};

export const updateQuestionManual = async (req: AuthRequest, res: Response) => {
    try {
        const { question } = req.body; // updated question object
        const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ error: 'Not found' });
        if (assignment.isLocked) return res.status(403).json({ error: 'Cannot edit a locked assignment' });

        // Update the specific question in MongoDB
        // Since we don't know the exact index easily, we can find and replace it in the JS object and save
        const paper = assignment.generatedPaper;
        let found = false;
        if (paper && paper.sections) {
            for (let i = 0; i < paper.sections.length; i++) {
                const section = paper.sections[i];
                if (!section.questions) continue;
                const qIndex = section.questions.findIndex((q: any, idx: number) => {
                    const id = q.id || `q_${i}_${idx}`;
                    return id === req.params.questionId;
                });
                if (qIndex !== -1) {
                    section.questions[qIndex] = { ...section.questions[qIndex], ...question };
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) return res.status(404).json({ error: 'Question not found' });
        
        assignment.markModified('generatedPaper');
        await assignment.save();
        
        res.json({ success: true, generatedPaper: assignment.generatedPaper });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update question manually' });
    }
};
