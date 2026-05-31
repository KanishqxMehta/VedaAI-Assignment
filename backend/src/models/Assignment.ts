import mongoose from 'mongoose';
const AssignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: String,
  subject: String,
  classLevel: String,
  duration: String,
  difficulty: String,
  dueDate: Date,
  additionalInfo: String,
  uploadedImage: Object,
  regenerateFeedback: String,
  status: { type: String, enum: ['PENDING', 'GENERATING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  questionsConfig: Array,
  generatedPaper: Object,
  createdAt: { type: Date, default: Date.now }
});
export const Assignment = mongoose.model('Assignment', AssignmentSchema);
