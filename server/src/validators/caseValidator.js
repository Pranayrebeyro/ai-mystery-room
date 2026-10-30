import { z } from "zod";

export const difficultyConfig = {
  Easy: {
    suspects: 3,
    clues: 5,
    hints: 2,
    bonus: 100
  },
  Medium: {
    suspects: 4,
    clues: 7,
    hints: 3,
    bonus: 150
  },
  Hard: {
    suspects: 5,
    clues: 9,
    hints: 3,
    bonus: 200
  }
};

export const mysterySchema = z.object({
  title: z.string().min(3),
  story: z.string().min(50),

  suspects: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(2),
      description: z.string().min(10),
      alibi: z.string().min(5)
    })
  ),

  clues: z.array(
    z.object({
      id: z.string().min(1),
      description: z.string().min(10),
      significance: z.string().min(10)
    })
  ),

  hints: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(5),
      order: z.number().int().positive()
    })
  ),

  culpritId: z.string().min(1),

  solutionExplanation: z.string().min(30)
}).strict();

export const generateCaseSchema = z.object({
  premise: z.string().trim().min(10).max(500),
  difficulty: z.enum(["Easy", "Medium", "Hard"])
});