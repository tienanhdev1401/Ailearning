import express from 'express';
import TranscriptController from '../controllers/transcript.controller.js';

const router = express.Router();

// GET /api/transcript?url=<youtube-url-or-id>&lang=en
router.get('/', TranscriptController.getTranscript);

export default router;