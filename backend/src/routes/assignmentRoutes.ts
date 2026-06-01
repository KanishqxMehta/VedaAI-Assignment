import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { 
    createAssignment, 
    getAssignments, 
    getAssignmentById, 
    deleteAssignment, 
    regenerateAssignment,
    regenerateQuestion,
    updateQuestionManual
} from '../controllers/assignmentController';
const router = Router();
router.use(protect);
router.route('/')
    .get(getAssignments)
    .post(createAssignment);
router.route('/:id')
    .get(getAssignmentById)
    .delete(deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.post('/:id/questions/:questionId/regenerate', regenerateQuestion);
router.put('/:id/questions/:questionId', updateQuestionManual);
export default router;
