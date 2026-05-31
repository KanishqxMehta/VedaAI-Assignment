import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { 
    createAssignment, 
    getAssignments, 
    getAssignmentById, 
    deleteAssignment, 
    regenerateAssignment 
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
export default router;
