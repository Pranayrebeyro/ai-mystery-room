import mongoose from "mongoose";

import Case from "../models/Case.js";

import {
  generateMystery
} from "../services/geminiService.js";

import {
  generateCaseSchema,
  difficultyConfig
} from "../validators/caseValidator.js";


// ==========================================
// PUBLIC CASE RESPONSE
// ==========================================

const publicCase = (game) => {
  const discoveredIds = game.discoveredClueIds || [];

  return {
    id: game._id,

    title: game.title,
    premise: game.premise,
    story: game.story,
    difficulty: game.difficulty,

    suspects: game.suspects.map((suspect) => ({
      id: suspect.id,
      name: suspect.name,
      description: suspect.description,
      alibi: suspect.alibi
    })),

    clues: game.clues.map((clue) => {
      const discovered = discoveredIds.includes(clue.id);

      return {
        id: clue.id,
        description: discovered ? clue.description : null,
        discovered
      };
    }),

    progress: {
      discoveredClueIds: discoveredIds,
      hintsUsed: game.hintsUsed,
      score: game.score,
      status: game.status
    }
  };
};


// ==========================================
// CREATE MYSTERY
// POST /api/cases
// ==========================================

export const createCase = async (req, res, next) => {
  console.log("\n========== CREATE CASE ==========");

  try {
    console.log("[Controller] Request received.");

    const validation = generateCaseSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid mystery details.",
        errors: validation.error.flatten()
      });
    }

    const { premise, difficulty } = validation.data;

    console.log("[Controller] Difficulty:", difficulty);
    console.log("[Controller] Calling Gemini...");

    const mystery = await generateMystery(
      premise,
      difficulty
    );

    console.log("[Controller] Gemini generation successful.");

    const newCase = await Case.create({
      title: mystery.title,
      premise,
      story: mystery.story,
      difficulty,

      suspects: mystery.suspects,
      clues: mystery.clues,
      hints: mystery.hints,

      culpritId: mystery.culpritId,
      solutionExplanation: mystery.solutionExplanation,

      discoveredClueIds: [],
      hintsUsed: 0,
      score: 0,
      status: "active"
    });

    console.log(
      "[Controller] Mystery saved successfully:",
      newCase._id
    );

    return res.status(201).json({
      success: true,
      message: "Mystery generated successfully.",
      case: publicCase(newCase)
    });

  } catch (error) {
    console.error(
      "[Controller] Mystery generation failed:",
      error.message
    );

    next(error);
  }
};


// ==========================================
// GET ACTIVE MYSTERY
// GET /api/cases/:id
// ==========================================

export const getCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log("[Controller] Retrieving case:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case identifier."
      });
    }

    const game = await Case.findById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Mystery not found."
      });
    }

    if (game.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "This mystery has already been completed.",
        completed: true
      });
    }

    return res.status(200).json({
      success: true,
      case: publicCase(game)
    });

  } catch (error) {
    console.error(
      "[Controller] Retrieve case failed:",
      error.message
    );

    next(error);
  }
};


// ==========================================
// DISCOVER CLUE
// POST /api/cases/:id/clues/:clueId/discover
// ==========================================

export const discoverClue = async (req, res, next) => {
  try {
    const { id, clueId } = req.params;

    console.log("\n========== DISCOVER CLUE ==========");
    console.log("[Controller] Case ID:", id);
    console.log("[Controller] Clue ID:", clueId);

    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case identifier."
      });
    }

    if (!clueId || !clueId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Clue identifier is required."
      });
    }

    /*
      Atomic update:
      - Only active cases can be updated.
      - Clue must belong to the requested case.
      - Already discovered clues cannot award points again.
      - $addToSet prevents duplicate clue IDs.
      - $inc awards exactly 5 points.
    */

    const updatedGame = await Case.findOneAndUpdate(
      {
        _id: id,
        status: "active",
        discoveredClueIds: {
          $ne: clueId
        },
        "clues.id": clueId
      },
      {
        $addToSet: {
          discoveredClueIds: clueId
        },
        $inc: {
          score: 5
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    // If atomic update failed, identify the reason.
    if (!updatedGame) {
      const game = await Case.findById(id);

      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Mystery not found."
        });
      }

      if (game.status === "completed") {
        return res.status(409).json({
          success: false,
          message: "This mystery has already been completed."
        });
      }

      const clueExists = game.clues.some(
        (clue) => clue.id === clueId
      );

      if (!clueExists) {
        return res.status(404).json({
          success: false,
          message: "Clue not found."
        });
      }

      if (game.discoveredClueIds.includes(clueId)) {
        return res.status(409).json({
          success: false,
          message: "This clue has already been discovered.",
          case: publicCase(game)
        });
      }

      return res.status(400).json({
        success: false,
        message: "Unable to discover this clue."
      });
    }

    // Find the newly discovered clue.
    const discoveredClue = updatedGame.clues.find(
      (clue) => clue.id === clueId
    );

    console.log("[Controller] Clue discovered:", clueId);
    console.log("[Controller] Updated score:", updatedGame.score);
    console.log("========== CLUE DISCOVERED ==========\n");

    return res.status(200).json({
      success: true,
      message: "Clue discovered successfully.",

      clue: {
        id: discoveredClue.id,
        description: discoveredClue.description,
        discovered: true
      },

      case: publicCase(updatedGame)
    });

  } catch (error) {
    console.error(
      "[Controller] Clue discovery failed:",
      error.message
    );

    next(error);
  }
};

// ==========================================
// REQUEST NEXT HINT
// POST /api/cases/:id/hints
// ==========================================

export const requestHint = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log("\n========== REQUEST HINT ==========");
    console.log("[Controller] Case ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case identifier."
      });
    }

    /*
      Atomically:
      1. Check that the case is active.
      2. Check that another hint is available.
      3. Increase hintsUsed.
      4. Deduct 10 points without allowing a negative score.
    */

    const updatedGame = await Case.findOneAndUpdate(
      {
        _id: id,
        status: "active",
        $expr: {
          $lt: [
            "$hintsUsed",
            { $size: "$hints" }
          ]
        }
      },
      [
        {
          $set: {
            hintsUsed: {
              $add: [
                { $ifNull: ["$hintsUsed", 0] },
                1
              ]
            },

            score: {
              $max: [
                0,
                {
                  $subtract: [
                    { $ifNull: ["$score", 0] },
                    10
                  ]
                }
              ]
            }
          }
        }
      ],
      {
        new: true,
        updatePipeline: true
      }
    );

    if (!updatedGame) {
      const game = await Case.findById(id);

      if (!game) {
        return res.status(404).json({
          success: false,
          message: "Mystery not found."
        });
      }

      if (game.status === "completed") {
        return res.status(409).json({
          success: false,
          message: "This mystery has already been completed."
        });
      }

      if (game.hintsUsed >= game.hints.length) {
        return res.status(409).json({
          success: false,
          message: "All available hints have been used."
        });
      }

      return res.status(400).json({
        success: false,
        message: "Unable to retrieve hint."
      });
    }

    // Return the next hint based on the updated counter.
    const hintIndex = updatedGame.hintsUsed - 1;
    const selectedHint = updatedGame.hints[hintIndex];

    console.log(
      "[Controller] Hint provided:",
      selectedHint.id
    );

    console.log(
      "[Controller] Hints used:",
      updatedGame.hintsUsed
    );

    console.log(
      "[Controller] Updated score:",
      updatedGame.score
    );

    console.log("========== HINT PROVIDED ==========\n");

    return res.status(200).json({
      success: true,
      message: "Hint retrieved successfully.",

      hint: {
        id: selectedHint.id,
        text: selectedHint.text,
        order: selectedHint.order
      },

      progress: {
        hintsUsed: updatedGame.hintsUsed,
        score: updatedGame.score,
        status: updatedGame.status
      }
    });

  } catch (error) {
    console.error(
      "[Controller] Hint request failed:",
      error.message
    );

    next(error);
  }
};

// ==========================================
// ACCUSE A SUSPECT
// POST /api/cases/:id/accuse
// ==========================================

export const accuseSuspect = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { suspectId } = req.body;

    console.log("\n========== SUSPECT ACCUSATION ==========");
    console.log("[Controller] Case ID:", id);
    console.log("[Controller] Suspect ID:", suspectId);

    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case identifier."
      });
    }

    // Validate suspect ID
    if (
      typeof suspectId !== "string" ||
      !suspectId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid suspect ID is required."
      });
    }

    // Retrieve private solution fields from MongoDB.
    const game = await Case.findById(id).select(
      "+culpritId +solutionExplanation"
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Mystery not found."
      });
    }

    if (game.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "This mystery has already been completed."
      });
    }

    // Check whether the submitted suspect exists.
    const selectedSuspect = game.suspects.find(
      (suspect) => suspect.id === suspectId
    );

    if (!selectedSuspect) {
      return res.status(400).json({
        success: false,
        message: "The selected suspect does not exist."
      });
    }

    // Compare the selected suspect with the hidden culprit.
    const isCorrect = suspectId === game.culpritId;

    // Get the correct accusation bonus.
    const bonus = isCorrect
      ? difficultyConfig[game.difficulty].bonus
      : 0;

    // Atomically complete the case.
    // $inc preserves any concurrent score updates.
    const completedGame = await Case.findOneAndUpdate(
      {
        _id: id,
        status: "active"
      },
      {
        $set: {
          status: "completed",
          "accusation.suspectId": suspectId,
          "accusation.correct": isCorrect,
          "accusation.submittedAt": new Date()
        },

        $inc: {
          score: bonus
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).select("+culpritId +solutionExplanation");

    // Protect against multiple simultaneous accusations.
    if (!completedGame) {
      return res.status(409).json({
        success: false,
        message: "This mystery has already been completed."
      });
    }

    const culprit = completedGame.suspects.find(
      (suspect) => suspect.id === completedGame.culpritId
    );

    console.log(
      "[Controller] Accusation correct:",
      isCorrect
    );

    console.log(
      "[Controller] Final score:",
      completedGame.score
    );

    console.log("========== CASE COMPLETED ==========\n");

    return res.status(200).json({
      success: true,
      message: isCorrect
        ? "Correct accusation! You solved the mystery."
        : "Incorrect accusation. The mystery has been solved.",

      result: {
        caseId: completedGame._id,
        title: completedGame.title,
        difficulty: completedGame.difficulty,

        selectedSuspect: {
          id: selectedSuspect.id,
          name: selectedSuspect.name
        },

        correct: isCorrect,

        culprit: {
          id: culprit.id,
          name: culprit.name,
          description: culprit.description
        },

        solutionExplanation:
          completedGame.solutionExplanation,

        score: completedGame.score,
        bonusAwarded: bonus,

        discoveredClues:
          completedGame.discoveredClueIds.length,

        hintsUsed: completedGame.hintsUsed,

        status: completedGame.status
      }
    });

  } catch (error) {
    console.error(
      "[Controller] Suspect accusation failed:",
      error.message
    );

    next(error);
  }
};