import express from "express";

import {
  createCase,
  getCase,
  discoverClue,
  requestHint,
  accuseSuspect
} from "../controllers/caseController.js";

const router = express.Router();

// Create mystery
router.post("/", createCase);

// Discover clue
router.post("/:id/clues/:clueId/discover", discoverClue);

// Request hint
router.post("/:id/hints", requestHint);

// Accuse suspect
router.post("/:id/accuse", accuseSuspect);

// Retrieve mystery
router.get("/:id", getCase);

export default router;