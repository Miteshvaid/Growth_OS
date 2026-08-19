const Note = require("../models/Note");

// Helper: Strip HTML tags to pass clean content to Gemini prompt
const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// POST /api/ai/generate-quiz/:noteId
exports.generateQuizFromNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    // 1. Fetch note & verify ownership
    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const cleanContent = stripHtml(note.content);
    if (!cleanContent || cleanContent.length < 20) {
      return res.status(400).json({
        message:
          "Note content is too short to generate a quiz. Please add more details to the note.",
      });
    }

    // 2. Validate Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message:
          "GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.",
      });
    }

    // 3. Construct prompt for Gemini 2.0 Flash
    const prompt = `You are an expert tutor creating an interactive multiple-choice quiz based strictly on the user's note.
Note Title: "${note.title}"
Note Content:
"""
${cleanContent}
"""

Generate 5 high-quality multiple choice questions testing understanding of the key concepts in this note.
You MUST output ONLY a valid raw JSON object conforming strictly to this schema, with no surrounding commentary or markdown other than the JSON:

{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}

Rules:
- Exactly 5 questions.
- Each question must have exactly 4 options.
- correctIndex must be an integer between 0 and 3.
- Questions must be directly relevant and accurate according to the note.
- Output ONLY valid parseable JSON.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error status:", geminiRes.status, errorText);
      return res.status(502).json({
        message: "Failed to communicate with AI service",
        error: errorText,
      });
    }

    const geminiData = await geminiRes.json();
    const rawOutput =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawOutput) {
      return res
        .status(500)
        .json({ message: "Empty response received from AI model" });
    }

    // 4. Safe JSON Parsing
    let cleanJson = rawOutput.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error(
        "JSON parse error from Gemini output:",
        parseError,
        "Raw:",
        rawOutput,
      );
      return res.status(500).json({
        message: "Failed to parse structured quiz data from AI response",
        raw: rawOutput,
      });
    }

    // 5. Validate response structure
    if (
      !parsed ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length === 0
    ) {
      return res.status(500).json({
        message: "AI response did not contain expected questions format",
      });
    }

    // Sanitize questions
    const sanitizedQuestions = parsed.questions.map((q, idx) => ({
      id: idx + 1,
      question: q.question || `Question ${idx + 1}`,
      options:
        Array.isArray(q.options) && q.options.length >= 2
          ? q.options
          : ["True", "False", "Neither", "Both"],
      correctIndex:
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex < (q.options?.length || 4)
          ? q.correctIndex
          : 0,
      explanation: q.explanation || "No explanation provided.",
    }));

    res.json({
      success: true,
      noteId: note._id,
      noteTitle: note.title,
      questionsCount: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error("Quiz generation error:", err);
    res.status(500).json({
      message: "Internal server error during quiz generation",
      error: err.message,
    });
  }
};
