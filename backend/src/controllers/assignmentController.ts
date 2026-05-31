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
