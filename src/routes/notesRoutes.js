import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  createNote,
  deleteNote,
  getNoteById,
  getAllNotes,
  updateNote,
} from '../controllers/notesController.js';
import {
  createNoteSchema,
  getAllNotesSchema,
  noteIdSchema,
  updateNoteSchema,
} from '../validations/notesValidation.js';

import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', celebrate(getAllNotesSchema), getAllNotes);
router.get('/:noteId', celebrate(noteIdSchema), getNoteById);
router.post('/', celebrate(createNoteSchema), createNote);
router.patch('/:noteId', celebrate(updateNoteSchema), updateNote);
router.delete('/:noteId', celebrate(noteIdSchema), deleteNote);

export default router;
