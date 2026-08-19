import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuizFromNote } from "../api/ai";

export default function QuizModal({ note, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (note?._id) {
      loadQuiz();
    }
  }, [note?._id]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);

    try {
      const res = await generateQuizFromNote(note._id);
      const data = res.data;
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setError("No questions could be generated from this note.");
      }
    } catch (err) {
      console.error("Failed to generate quiz:", err);
      const msg =
        err.response?.data?.message ||
        "Could not generate quiz. Check server configuration or Gemini API key.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx) => {
    if (isAnswered) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
    }
  };

  const currentQ = questions[currentIndex];

  const getScoreFeedback = (finalScore, total) => {
    const percentage = Math.round((finalScore / total) * 100);
    if (percentage === 100) {
      return {
        icon: "🏆",
        title: "Mastery Level!",
        desc: "Flawless score. You deeply understand all concepts in this note.",
        color: "text-amber-400",
      };
    }
    if (percentage >= 80) {
      return {
        icon: "🌟",
        title: "Great Job!",
        desc: "Strong grasp of the subject material with just minor gaps.",
        color: "text-emerald-400",
      };
    }
    if (percentage >= 60) {
      return {
        icon: "🌿",
        title: "Good Effort!",
        desc: "You have a solid foundation. Review the note to strengthen key concepts.",
        color: "text-accent-light",
      };
    }
    return {
      icon: "💡",
      title: "Learning Opportunity",
      desc: "Revisit your notes and try generating another quiz to test yourself again!",
      color: "text-cream",
    };
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-ink-light border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-ink/40">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧠</span>
            <div>
              <h2 className="font-display text-base text-cream">AI Note Quiz</h2>
              <p className="text-[11px] text-muted truncate max-w-[280px]">
                {note?.title || "Knowledge Check"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-cream p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Loading View */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center text-3xl mx-auto shadow-lg shadow-accent/20"
              >
                🧠
              </motion.div>
              <div>
                <h3 className="font-display text-lg text-cream mb-1">
                  Synthesizing Note Knowledge...
                </h3>
                <p className="text-muted text-xs max-w-xs mx-auto leading-relaxed">
                  Gemini 2.0 Flash is analyzing your note and drafting 5 customized quiz questions.
                </p>
              </div>
              <div className="w-48 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          {/* Error View */}
          {!loading && error && (
            <div className="py-12 text-center space-y-4">
              <div className="text-4xl">⚠️</div>
              <h3 className="font-display text-lg text-cream">Quiz Generation Failed</h3>
              <p className="text-muted text-xs max-w-sm mx-auto leading-relaxed">
                {error}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={loadQuiz}
                  className="bg-accent hover:bg-accent-light text-white text-xs font-medium px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  🔄 Retry Generation
                </button>
                <button
                  onClick={onClose}
                  className="bg-white/5 hover:bg-white/10 text-muted hover:text-cream text-xs px-4 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active Quiz Question View */}
          {!loading && !error && !completed && currentQ && (
            <div className="space-y-5">
              {/* Progress and Question count */}
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Question <strong className="text-cream">{currentIndex + 1}</strong> of {questions.length}
                </span>
                <span className="text-accent-light font-medium">
                  Score: {score} / {currentIndex + (isAnswered ? 1 : 0)}
                </span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < currentIndex
                        ? "bg-emerald-400"
                        : i === currentIndex
                        ? "bg-accent"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Question Box */}
              <div className="bg-ink border border-white/5 rounded-xl p-4">
                <p className="text-cream font-medium text-sm sm:text-base leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  let btnStyle = "bg-ink border-white/10 text-cream/90 hover:border-accent/40";

                  if (isAnswered) {
                    if (idx === currentQ.correctIndex) {
                      btnStyle = "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-medium";
                    } else if (idx === selectedOption) {
                      btnStyle = "bg-rose-500/20 border-rose-500/60 text-rose-300";
                    } else {
                      btnStyle = "bg-ink border-white/5 text-muted opacity-50";
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[11px] font-mono text-muted shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswered && idx === currentQ.correctIndex && (
                        <span className="text-emerald-400 text-base shrink-0">✓</span>
                      )}
                      {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                        <span className="text-rose-400 text-base shrink-0">✗</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">
                        {selectedOption === currentQ.correctIndex
                          ? "🎯 Correct!"
                          : "💡 Explanation"}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Question / Finish Action */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-2"
                >
                  <button
                    onClick={handleNextQuestion}
                    className="w-full bg-accent hover:bg-accent-light text-white font-medium py-3 rounded-xl text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentIndex + 1 < questions.length
                        ? "Next Question →"
                        : "View Results ✨"}
                    </span>
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Final Score Screen */}
          {!loading && !error && completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-6"
            >
              {(() => {
                const feedback = getScoreFeedback(score, questions.length);
                return (
                  <>
                    <div className="text-5xl mb-2">{feedback.icon}</div>
                    <div>
                      <span className="text-xs uppercase font-mono tracking-widest text-muted">
                        Quiz Completed
                      </span>
                      <h3 className={`font-display text-2xl mt-1 ${feedback.color}`}>
                        {feedback.title}
                      </h3>
                      <p className="text-muted text-xs max-w-sm mx-auto mt-2 leading-relaxed">
                        {feedback.desc}
                      </p>
                    </div>

                    <div className="bg-ink border border-white/5 rounded-2xl p-5 max-w-xs mx-auto grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-display text-3xl text-cream">{score} / {questions.length}</p>
                        <p className="text-[11px] text-muted mt-1">Correct Answers</p>
                      </div>
                      <div>
                        <p className="font-display text-3xl text-accent-light">
                          {Math.round((score / questions.length) * 100)}%
                        </p>
                        <p className="text-[11px] text-muted mt-1">Accuracy</p>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center pt-4">
                      <button
                        onClick={loadQuiz}
                        className="bg-accent hover:bg-accent-light text-white text-xs font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
                      >
                        <span>🔄</span>
                        <span>Generate New Quiz</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="bg-white/5 hover:bg-white/10 text-muted hover:text-cream text-xs px-5 py-3 rounded-xl transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
