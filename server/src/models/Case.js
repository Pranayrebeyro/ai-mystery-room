import mongoose from "mongoose";

const suspectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    alibi: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const clueSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    significance: {
      type: String,
      required: true,
      select: false
    }
  },
  { _id: false }
);

const hintSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    premise: {
      type: String,
      required: true
    },

    story: {
      type: String,
      required: true
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true
    },

    suspects: {
      type: [suspectSchema],
      required: true
    },

    clues: {
      type: [clueSchema],
      required: true
    },

    hints: {
      type: [hintSchema],
      required: true
    },

    culpritId: {
      type: String,
      required: true,
      select: false
    },

    solutionExplanation: {
      type: String,
      required: true,
      select: false
    },

    discoveredClueIds: {
      type: [String],
      default: []
    },

    hintsUsed: {
      type: Number,
      default: 0
    },

    accusation: {
      suspectId: String,
      correct: Boolean,
      submittedAt: Date
    },

    score: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

const Case = mongoose.model("Case", caseSchema);

export default Case;