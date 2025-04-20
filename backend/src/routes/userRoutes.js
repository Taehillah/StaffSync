import express from 'express';
import { auditLogger } from '../middleware/auditLogger';
import { updateUser } from '../controllers/userController';

const router = express.Router();

router.patch('/:id', auditLogger, updateUser); // Example protected route