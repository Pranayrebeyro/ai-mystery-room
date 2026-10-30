import { GoogleGenAI } from "@google/genai";

import {
  mysterySchema,
  difficultyConfig
} from "../validators/caseValidator.js";

// ------------------------------------------
// GEMINI CONFIGURATION
// ------------------------------------------

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in server .env");
  }

  return new GoogleGenAI({
    apiKey
  });
};

// Use the model configured in .env.
// Falls back to Gemini 3.8 Flash.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// Maximum time to wait for Gemini.
const GENERATION_TIMEOUT = 300000;


// ------------------------------------------
// BUILD STRUCTURED JSON SCHEMA
// ------------------------------------------

const buildResponseSchema = (difficulty) => {
  const config = difficultyConfig[difficulty];

  return {
    type: "OBJECT",

    properties: {
      title: {
        type: "STRING",
        description: "A short and engaging mystery title."
      },

      story: {
        type: "STRING",
        description: "The complete public mystery story. Do not reveal the culprit."
      },

      suspects: {
        type: "ARRAY",
        minItems: config.suspects,
        maxItems: config.suspects,

        items: {
          type: "OBJECT",

          properties: {
            id: {
              type: "STRING"
            },
            name: {
              type: "STRING"
            },
            description: {
              type: "STRING"
            },
            alibi: {
              type: "STRING"
            }
          },

          required: [
            "id",
            "name",
            "description",
            "alibi"
          ],

          propertyOrdering: [
            "id",
            "name",
            "description",
            "alibi"
          ]
        }
      },

      clues: {
        type: "ARRAY",
        minItems: config.clues,
        maxItems: config.clues,

        items: {
          type: "OBJECT",

          properties: {
            id: {
              type: "STRING"
            },
            description: {
              type: "STRING"
            },
            significance: {
              type: "STRING"
            }
          },

          required: [
            "id",
            "description",
            "significance"
          ],

          propertyOrdering: [
            "id",
            "description",
            "significance"
          ]
        }
      },

      hints: {
        type: "ARRAY",
        minItems: config.hints,
        maxItems: config.hints,

        items: {
          type: "OBJECT",

          properties: {
            id: {
              type: "STRING"
            },
            text: {
              type: "STRING"
            },
            order: {
              type: "INTEGER"
            }
          },

          required: [
            "id",
            "text",
            "order"
          ],

          propertyOrdering: [
            "id",
            "text",
            "order"
          ]
        }
      },

      culpritId: {
        type: "STRING",
        description: "The ID of the single guilty suspect."
      },

      solutionExplanation: {
        type: "STRING",
        description: "A detailed explanation of how the clues identify the culprit."
      }
    },

    required: [
      "title",
      "story",
      "suspects",
      "clues",
      "hints",
      "culpritId",
      "solutionExplanation"
    ],

    propertyOrdering: [
      "title",
      "story",
      "suspects",
      "clues",
      "hints",
      "culpritId",
      "solutionExplanation"
    ]
  };
};


// ------------------------------------------
// VALIDATE GENERATED MYSTERY
// ------------------------------------------

const validateMystery = (data, difficulty) => {
  console.log("[Gemini] Validating generated mystery...");

  const parsed = mysterySchema.safeParse(data);

  if (!parsed.success) {
    console.error(
      "[Gemini] Validation errors:",
      parsed.error.flatten()
    );

    throw new Error("Gemini generated invalid mystery data.");
  }

  const mystery = parsed.data;
  const config = difficultyConfig[difficulty];

  // Check exact counts
  if (mystery.suspects.length !== config.suspects) {
    throw new Error(
      `Expected ${config.suspects} suspects, received ${mystery.suspects.length}.`
    );
  }

  if (mystery.clues.length !== config.clues) {
    throw new Error(
      `Expected ${config.clues} clues, received ${mystery.clues.length}.`
    );
  }

  if (mystery.hints.length !== config.hints) {
    throw new Error(
      `Expected ${config.hints} hints, received ${mystery.hints.length}.`
    );
  }

  // Check unique suspect IDs
  const suspectIds = mystery.suspects.map(
    (suspect) => suspect.id
  );

  if (new Set(suspectIds).size !== suspectIds.length) {
    throw new Error("Duplicate suspect identifiers.");
  }

  // Check unique clue IDs
  const clueIds = mystery.clues.map(
    (clue) => clue.id
  );

  if (new Set(clueIds).size !== clueIds.length) {
    throw new Error("Duplicate clue identifiers.");
  }

  // Check unique hint IDs
  const hintIds = mystery.hints.map(
    (hint) => hint.id
  );

  if (new Set(hintIds).size !== hintIds.length) {
    throw new Error("Duplicate hint identifiers.");
  }

  // Check culprit exists
  if (!suspectIds.includes(mystery.culpritId)) {
    throw new Error(
      "Culprit identifier does not match any suspect."
    );
  }

  // Check hint sequence
  const sortedHints = [...mystery.hints].sort(
    (a, b) => a.order - b.order
  );

  const validHintSequence = sortedHints.every(
    (hint, index) => hint.order === index + 1
  );

  if (!validHintSequence) {
    throw new Error("Invalid hint sequence.");
  }

  console.log("[Gemini] Mystery validation successful.");

  return mystery;
};


// ------------------------------------------
// GENERATE MYSTERY
// ------------------------------------------

export const generateMystery = async (
  premise,
  difficulty
) => {
  console.log("\n========== GEMINI GENERATION ==========");

  const startTime = Date.now();

  console.log("[Gemini] Difficulty:", difficulty);
  console.log("[Gemini] Model:", MODEL);
  console.log(
    "[Gemini] API key available:",
    Boolean(process.env.GEMINI_API_KEY)
  );

  const difficultySettings = difficultyConfig[difficulty];

  if (!difficultySettings) {
    throw new Error("Invalid difficulty selected.");
  }

  let timeoutId;

  try {
    const ai = getGeminiClient();

    const prompt = `
You are an expert mystery writer and detective game designer.

Create a complete, logically consistent detective mystery.

USER PREMISE:
${premise}

DIFFICULTY:
${difficulty}

EXACT REQUIREMENTS:
- Number of suspects: ${difficultySettings.suspects}
- Number of clues: ${difficultySettings.clues}
- Number of hints: ${difficultySettings.hints}

STRICT STORY RULES:

1. Generate exactly ${difficultySettings.suspects} suspects.
2. Generate exactly ${difficultySettings.clues} clues.
3. Generate exactly ${difficultySettings.hints} hints.
4. Every suspect must have a unique ID.
5. Every clue must have a unique ID.
6. Every hint must have a unique ID.
7. The culpritId must match one of the suspect IDs.
8. There must be exactly one culprit.
9. At least two independent clues must support the solution.
10. All clues must be consistent with the story.
11. Innocent suspects must have plausible alibis.
12. The culprit must be identifiable through logical reasoning.
13. Hints must guide the player without directly revealing the culprit.
14. Never reveal the culprit in the public story.
15. Clue significance is private backend information.
16. Hint orders must start at 1 and be sequential.
17. Do not add extra properties.
18. Return the mystery using the required JSON structure.

QUALITY REQUIREMENTS:

- Make the story engaging and realistic.
- Avoid contradictory statements.
- Give each suspect a believable motive or connection.
- Make clues meaningful rather than random.
- Ensure the solution can be logically deduced.
- Do not make the culprit obvious from the beginning.
`;

    console.log("[Gemini] Sending generation request...");

    // Timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Gemini request timed out after ${GENERATION_TIMEOUT / 1000} seconds.`
          )
        );
      }, GENERATION_TIMEOUT);
    });

    // Gemini generation request
    const generationPromise = ai.models.generateContent({
      model: MODEL,
      contents: prompt,

      config: {
        responseMimeType: "application/json",
        responseJsonSchema: buildResponseSchema(difficulty)
      }
    });

    const response = await Promise.race([
      generationPromise,
      timeoutPromise
    ]);

    clearTimeout(timeoutId);

    const elapsedTime = (
      (Date.now() - startTime) / 1000
    ).toFixed(2);

    console.log(
      `[Gemini] Response received in ${elapsedTime} seconds.`
    );

    // Check response
    if (!response || !response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    // Parse JSON
    let generatedData;

    try {
      generatedData = JSON.parse(response.text);
    } catch (error) {
      console.error(
        "[Gemini] JSON parsing failed:",
        error.message
      );

      throw new Error("Gemini returned invalid JSON.");
    }

    console.log("[Gemini] JSON parsing successful.");

    // Validate generated data
    const validatedMystery = validateMystery(
      generatedData,
      difficulty
    );

    console.log("[Gemini] Generation completed successfully.");
    console.log("[Gemini] Total time:", elapsedTime, "seconds");
    console.log("========================================\n");

    return validatedMystery;

  } catch (error) {
    console.error(
      "[Gemini] Generation failed:",
      error.message
    );

    console.error(
      "[Gemini] Error name:",
      error.name
    );

    if (
      error.message.includes("API key") ||
      error.message.includes("timed out") ||
      error.message.includes("invalid JSON") ||
      error.message.includes("Invalid difficulty") ||
      error.message.includes("Expected") ||
      error.message.includes("Duplicate") ||
      error.message.includes("Culprit identifier") ||
      error.message.includes("hint sequence") ||
      error.message.includes("Validation") ||
      error.message.includes("Gemini returned")
    ) {
      throw error;
    }

    throw new Error(
      `Gemini API error: ${error.message}`
    );

  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};