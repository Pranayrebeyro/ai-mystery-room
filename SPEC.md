# AI Mystery Room — Project Specification

## 1. Project Overview

AI Mystery Room is an AI-powered web application that allows users to create and solve interactive mysteries generated using the Gemini API.

Players investigate a fictional case by examining suspects, discovering clues, requesting hints, and identifying the culprit. The application evaluates the player's accusation and reveals the verdict, explanation, and final score.

### Problem Statement

Traditional mystery games often offer fixed storylines and limited replayability. AI Mystery Room addresses this limitation by generating mysteries based on user-provided premises and selected difficulty levels.

### Objectives

- Generate unique mysteries using the Gemini API.
- Provide an interactive investigation experience.
- Support Easy, Medium, and Hard difficulty levels.
- Allow players to discover clues and request hints.
- Evaluate accusations and calculate scores on the backend.
- Protect the culprit's identity until an accusation is submitted.
- Provide a responsive interface for desktop, tablet, and mobile.
- Deploy a complete, working application accessible through a public URL.

## 2. Target Users

The application is intended for:
- People who enjoy mystery-solving games.
- Students interested in interactive AI applications.
- Users who want to create and solve fictional detective cases.

## 3. Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Gemini API using the @google/genai SDK
- Zod for request and AI-response validation
- dotenv for environment variables
- CORS for controlled cross-origin access

### Deployment
- Frontend: Vercel
- Backend: A suitable Node.js hosting provider
- Database: MongoDB Atlas

## 4. Application Pages

### 4.1 Home Page

Purpose: Introduce the application and allow users to begin a mystery.

Required elements:
- Application name and introduction.
- Description of the mystery-solving experience.
- Start Mystery button.
- Responsive navigation and layout.

Behavior:
- Clicking Start Mystery navigates to the Create Mystery page.

### 4.2 Create Mystery Page

Purpose: Collect the player's mystery premise and preferred difficulty.

Required elements:
- Text area for the mystery premise.
- Difficulty selector with Easy, Medium, and Hard options.
- Generate Mystery button.
- Input validation.
- Loading indicator while Gemini generates the case.
- Error messages for failed generation requests.

Behavior:
1. Validate the premise and difficulty.
2. Send the request to the backend.
3. Generate and validate the mystery using Gemini.
4. Save the mystery in MongoDB.
5. Return the case identifier and publicly visible case information.
6. Navigate to the Investigation Room.

The frontend must not receive the culprit identity or solution.

### 4.3 Investigation Room

Purpose: Allow the player to investigate the generated mystery.

Required elements:
- Mystery title and story.
- Selected difficulty.
- Suspect cards containing publicly visible descriptions.
- Clue discovery controls.
- Discovered clue descriptions.
- Available hints and hint-request controls.
- Investigation progress.
- Current score.
- Button to proceed to the Accusation page.

Behavior:
- Players can discover eligible clues.
- A discovered clue cannot award points repeatedly.
- Players can request hints within the permitted limit.
- Each hint request deducts 10 points.
- The backend maintains the authoritative game state.
- The culprit and solution remain hidden.

### 4.4 Accusation Page

Purpose: Allow the player to identify the suspected culprit.

Required elements:
- Suspect selection.
- Submit Accusation button.
- Validation when no suspect is selected.
- Loading state while the accusation is evaluated.
- Error handling for invalid requests.

Behavior:
1. Display the available suspects.
2. Allow the player to select one suspect.
3. Submit the suspect identifier to the backend.
4. Evaluate the accusation against the privately stored solution.
5. Calculate the final score on the backend.
6. Complete the case and navigate to Results.

A completed case must not be scored repeatedly through additional requests.

### 4.5 Results Page

Purpose: Present the completed mystery outcome.

Required elements:
- Correct or incorrect verdict.
- Culprit's identity.
- Explanation of the solution.
- Final score.
- Discovered clue count.
- Hints used.
- Start Another Mystery button.

Behavior:
- Retrieve the completed result from the backend.
- Display the correct solution and explanation only after the accusation.
- Allow the player to start another mystery.

## 5. Difficulty Configuration

The following values are mandatory.

| Difficulty | Suspects | Clues | Hints |
|---|---:|---:|---:|
| Easy | 3 | 5 | 2 |
| Medium | 4 | 7 | 3 |
| Hard | 5 | 9 | 3 |

Gemini-generated data must be validated against the selected difficulty.

The application must reject or safely handle generated data that does not satisfy the required counts or structural rules.

## 6. User Flow

1. The user opens the Home page.
2. The user selects Start Mystery.
3. The user enters a mystery premise.
4. The user selects a difficulty level.
5. The frontend submits the request to the backend.
6. The backend requests structured mystery data from Gemini.
7. The backend validates the generated mystery.
8. The backend stores the case in MongoDB.
9. The player enters the Investigation Room.
10. The player examines suspects and discovers clues.
11. The player optionally requests hints.
12. The player proceeds to the Accusation page.
13. The player selects a suspect and submits the accusation.
14. The backend evaluates the accusation and calculates the score.
15. The Results page displays the verdict, culprit, explanation, and score.
16. The player can start another mystery.

## 7. Backend API Specification

All endpoints use JSON request and response bodies where applicable.

### 7.1 Generate a Mystery

Endpoint: POST /api/cases

Request:
{
  "premise": "A valuable diamond disappears during a museum exhibition.",
  "difficulty": "Easy"
}

Validation:
- Premise must be a non-empty string.
- Premise must satisfy configured length limits.
- Difficulty must be Easy, Medium, or Hard.

Success response:
{
  "success": true,
  "case": {
    "id": "case_id",
    "title": "The Missing Diamond",
    "story": "Public mystery narrative...",
    "difficulty": "Easy",
    "suspects": [],
    "clues": [],
    "progress": {
      "discoveredClueIds": [],
      "hintsUsed": 0,
      "status": "active"
    }
  }
}

The response must not contain the culprit identifier, private solution, or any hidden data that would reveal the answer prematurely.

### 7.2 Retrieve an Active Mystery

Endpoint: GET /api/cases/:id

Purpose:
- Retrieve the public mystery information.
- Restore the investigation after a page refresh.
- Return current player progress.

Requirements:
- Validate the case identifier.
- Return only public case information and authorized progress.
- Never expose the private solution for an active case.

### 7.3 Discover a Clue

Endpoint: POST /api/cases/:id/clues/:clueId/discover

Purpose:
- Discover a clue belonging to the specified case.
- Update player progress.
- Award five points for a newly discovered clue.

Requirements:
- Case must exist and remain active.
- Clue must belong to the case.
- Repeated discovery must not award additional points.
- Score changes must be performed by the backend.

### 7.4 Request a Hint

Endpoint: POST /api/cases/:id/hints

Purpose:
- Return the next eligible hint.
- Record hint usage.
- Deduct ten points.

Requirements:
- Case must exist and remain active.
- Hint count must not exceed the configured limit.
- Repeated requests must not return more hints than permitted.
- Each successfully issued hint must be recorded.
- The backend must calculate the score adjustment.

### 7.5 Submit an Accusation

Endpoint: POST /api/cases/:id/accuse

Request:
{
  "suspectId": "suspect_123"
}

Success response:
{
  "success": true,
  "result": {
    "verdict": "correct",
    "score": 115,
    "completed": true
  }
}

Requirements:
- The suspect must belong to the specified case.
- The case must still be active.
- Compare the submitted suspect identifier with the privately stored culprit identifier.
- Calculate the final score on the backend.
- Mark the case as completed.
- Prevent duplicate scoring or repeated completion.
- Do not return the full solution before the accusation is submitted.

The response above is illustrative. Actual identifiers and score values depend on the case and player actions.

### 7.6 Retrieve the Completed Result

Endpoint: GET /api/cases/:id/result

Purpose:
- Retrieve the final verdict.
- Reveal the culprit and solution explanation.
- Return the final score and investigation summary.

Requirements:
- The case must exist.
- The case must be completed.
- An active case must never return its private solution.

### 7.7 Health Check

Endpoint: GET /api/health

Purpose:
- Confirm that the backend is running.
- Support deployment verification.

Example response:
{
  "success": true,
  "message": "AI Mystery Room API is running"
}

## 8. Database Design

Create a Mongoose model named Case.

The document must contain the following information.

### Case fields

- title: String
- premise: String
- story: String
- difficulty: String
- suspects: Array
- clues: Array
- hints: Array
- culpritId: String
- solutionExplanation: String
- discoveredClueIds: Array
- hintsUsed: Number
- accusation: Object or null
- score: Number
- status: String
- createdAt: Date
- updatedAt: Date

### Suspect structure

- id: Unique identifier within the case.
- name: Public suspect name.
- description: Public suspect description.
- alibi: Publicly available alibi.
- relevant information: Information needed for investigation without revealing the answer directly.

### Clue structure

- id: Unique identifier within the case.
- description: Clue text.
- significance: Explanation of its relevance to the case.

If significance would reveal the solution prematurely, keep it private until the result is available.

### Hint structure

- id: Unique identifier within the case.
- text: Hint text.
- order: Position in the hint sequence.

### Accusation structure

- suspectId: Selected suspect identifier.
- correct: Boolean.
- submittedAt: Date.

### Status values

- active
- completed

The database must store the solution separately from the public information returned by the API.

## 9. Gemini AI Behavior

Gemini must generate structured mystery data containing:
- Mystery title.
- Mystery story.
- Suspects.
- Clues.
- Hints.
- Culprit identifier.
- Solution explanation.

The backend must validate the generated response before saving it.

### AI validation requirements

1. Verify that all required fields exist.
2. Verify the selected difficulty.
3. Verify the exact suspect, clue, and hint counts.
4. Verify that identifiers are unique within their respective collections.
5. Verify that the culprit identifier references an existing suspect.
6. Verify that the solution explanation is non-empty.
7. Verify that the story, suspects, and clues are logically consistent.
8. Verify that the clues support the intended solution.
9. Reject malformed or incomplete output.
10. Handle Gemini API failures without crashing the server.

Use Zod to validate the structure.

Do not trust AI-generated data merely because it is valid JSON. Structural validation and logical consistency checks are separate requirements.

The backend must not send the private solution to the frontend while the case remains active.

## 10. Scoring Rules

Use the following exact scoring rules.

| Event | Score adjustment |
|---|---:|
| Correct accusation — Easy | +100 |
| Correct accusation — Medium | +150 |
| Correct accusation — Hard | +200 |
| Each newly discovered clue | +5 |
| Each hint used | -10 |
| Minimum final score | 0 |

Formula:

Base score = Correct accusation bonus + (Unique clues discovered × 5) - (Hints used × 10)

Final score = max(0, Base score)

An incorrect accusation receives no correct-accusation bonus.

The backend must calculate the score from the selected difficulty and recorded player actions. The frontend must never determine or submit the authoritative final score.

## 11. Security Requirements

- Store GEMINI_API_KEY only in backend environment variables.
- Never expose the Gemini API key in frontend code.
- Never commit secrets to GitHub.
- Store the culprit identifier and solution explanation privately.
- Never include the solution in active-case API responses.
- Validate all incoming requests.
- Validate case and suspect identifiers.
- Reject invalid difficulty values.
- Prevent clue and hint limits from being exceeded.
- Prevent repeated scoring and completed-case manipulation.
- Configure CORS for the deployed frontend origin.
- Use safe error messages that do not expose secrets or internal stack traces.

## 12. Environment Variables

Backend .env:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173

Frontend environment:

VITE_API_BASE_URL=http://localhost:5000/api

In production, replace the local API base URL with the deployed backend API URL.

Never commit actual API keys or database credentials.

Create an .env.example file containing placeholders only.

## 13. Frontend Requirements

- Use React components for reusable interface elements.
- Use React Router DOM for page navigation.
- Use Axios for backend requests.
- Use Tailwind CSS for styling.
- Provide loading, success, empty, and error states where appropriate.
- Prevent duplicate submissions while requests are processing.
- Display meaningful error messages.
- Maintain responsive layouts.
- Restore active-case progress by retrieving it from the backend.
- Do not rely exclusively on browser state for authoritative game progress.

## 14. Error Handling

The backend must handle:
- Missing or invalid request fields.
- Unsupported difficulty values.
- Invalid case or suspect identifiers.
- Cases that do not exist.
- Completed cases receiving further actions.
- Invalid Gemini responses.
- Gemini API failures and timeouts.
- MongoDB connection or persistence failures.
- Attempts to exceed clue or hint limits.
- Repeated accusation submissions.

Use appropriate HTTP status codes and consistent JSON error responses.

The frontend must display understandable error messages and must not crash when an API request fails.

## 15. Acceptance Criteria

The project is complete only when all the following conditions are satisfied.

- [ ] The Home page loads successfully.
- [ ] Users can create a mystery from a premise.
- [ ] Easy mysteries contain exactly 3 suspects, 5 clues, and 2 hints.
- [ ] Medium mysteries contain exactly 4 suspects, 7 clues, and 3 hints.
- [ ] Hard mysteries contain exactly 5 suspects, 9 clues, and 3 hints.
- [ ] Gemini generates structured mystery data.
- [ ] Invalid AI responses are rejected or safely handled.
- [ ] Mysteries are stored in MongoDB.
- [ ] Players can retrieve an active mystery.
- [ ] Players can discover clues.
- [ ] Repeated clue discovery does not award duplicate points.
- [ ] Players can request hints within the allowed limit.
- [ ] Each hint deducts ten points.
- [ ] Players can submit an accusation.
- [ ] Correct accusations receive the correct difficulty bonus.
- [ ] Incorrect accusations receive no correct-accusation bonus.
- [ ] The minimum score is zero.
- [ ] The culprit and solution remain hidden until an accusation is submitted.
- [ ] The backend calculates and validates all scores.
- [ ] Completed results display the correct culprit and explanation.
- [ ] Completed cases cannot be manipulated through repeated requests.
- [ ] API failures are handled gracefully.
- [ ] The interface works on desktop and mobile.
- [ ] The frontend is deployed.
- [ ] The backend is deployed.
- [ ] MongoDB Atlas is configured for production.
- [ ] The complete game works on the live website.
- [ ] At least one mystery is created and solved on the deployed website.

## 16. Testing Strategy

Test the following before submission:

1. Generate mysteries at all three difficulty levels.
2. Verify suspect, clue, and hint counts.
3. Test missing and invalid input.
4. Test malformed Gemini responses.
5. Test clue discovery and duplicate discovery.
6. Test hint limits and score deductions.
7. Test correct and incorrect accusations.
8. Test the minimum score rule.
9. Inspect API responses to confirm that active cases do not reveal the culprit.
10. Test repeated accusation requests.
11. Test MongoDB persistence and page refresh recovery.
12. Test backend and Gemini API failure handling.
13. Test mobile and desktop layouts.
14. Test the entire workflow on the production deployment.

## 17. Final Deliverables

The final submission must include:

1. GitHub repository containing the complete source code.
2. Live URL of the deployed application.
3. A completed SPEC.md.
4. A tested mystery-solving experience on the deployed website.

Submission link:
https://bit.ly/ai-mystery-room-sub-form

Deadline:
November 2, 2026, at 11:59 PM.

## 18. Development Order

Implement the project in the following order:

1. Finalize this specification.
2. Set up the React/Vite frontend and Express backend.
3. Configure environment variables.
4. Connect MongoDB Atlas.
5. Create the Case model.
6. Implement Gemini generation and validation.
7. Implement the required API endpoints.
8. Implement clue discovery, hints, accusations, and scoring.
9. Build the five required pages.
10. Test security, persistence, and error handling.
11. Deploy the backend and frontend.
12. Verify the complete production workflow.
13. Submit the repository and live website URL.