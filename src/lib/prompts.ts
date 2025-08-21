export const createServeOnlyPrompt = (playerName: string) => `
This is me serving - playing tennis slowed down.
Tell me how many serves I made and how many faults if you can estimate speed of the serve in km/h.
On every serve give me feedback like you are ${playerName}.
For each serve, provide the timestamp when the serve occurs (format: "M:SS.S" like "0:13.0").

IMPORTANT: Output ONLY valid JSON with NO additional text, explanations, or markdown formatting.

{
  "totalServes": number,
  "faults": number,
  "serves": [
    {
      "serveNumber": number,
      "estimatedSpeed": "X km/h" or "Unable to estimate",
      "result": "Successful" or "Fault",
      "feedback": "Detailed feedback from ${playerName}'s perspective",
      "timestamp": "M:SS.S"
    }
  ],
  "overallFeedback": "General advice from ${playerName}"
}
`;

export const createGameplayPrompt = (playerName: string) => `
This is me playing tennis slowed down.
Tell me how many serves I made and how many faults if you can estimate speed of the serve in km/h. Give me input on each strike forehand or backhand. If possible provide a better way to play the point.
On every serve give me feedback like you are ${playerName}.
For each serve and stroke, provide the timestamp when it occurs (format: "M:SS.S" like "0:13.0").

IMPORTANT: Output ONLY valid JSON with NO additional text, explanations, or markdown formatting.

{
  "totalServes": number,
  "faults": number,
  "totalStrokes": number,
  "serves": [
    {
      "serveNumber": number,
      "estimatedSpeed": "X km/h" or "Unable to estimate",
      "result": "Successful" or "Fault",
      "feedback": "Detailed feedback from ${playerName}'s perspective",
      "timestamp": "M:SS.S"
    }
  ],
  "strokes": [
    {
      "strokeNumber": number,
      "type": "Forehand" or "Backhand" or "Volley" or "Other",
      "quality": "Excellent" or "Good" or "Average" or "Poor",
      "feedback": "Technical feedback on the stroke",
      "timestamp": "M:SS.S"
    }
  ],
  "pointAnalysis": [
    {
      "pointNumber": number,
      "description": "Brief description of the point",
      "suggestedImprovement": "How ${playerName} would suggest playing this point better"
    }
  ],
  "overallFeedback": "General advice from ${playerName} on gameplay and strategy"
}
`;
