import { useState, useEffect } from "react";

export default function CountingGame() {
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState({ a: 1, b: 1 });
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);

  // Generate a new counting question based on level
  const generateQuestion = (lvl) => {
    const max = lvl * 5; // difficulty increases gradually
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    setQuestion({ a, b });
    setAnswer("");
    setFeedback("");
  };

  useEffect(() => {
    generateQuestion(level);
  }, [level]);

  const checkAnswer = () => {
    const correct = question.a + question.b;

    if (Number(answer) === correct) {
      setScore((s) => s + 1);
      setFeedback("✅ Correct! Well done!");

      // Level up every 3 correct answers
      if ((score + 1) % 3 === 0) {
        setLevel((l) => l + 1);
      } else {
        generateQuestion(level);
      }
    } else {
      setLives((l) => l - 1);
      setFeedback(`❌ Try again!`);

      if (lives - 1 <= 0) {
        setGameOver(true);
      }
    }
  };

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFeedback("");
    generateQuestion(1);
  };

  if (gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Game Over
          </h1>
          <p className="text-lg mb-2 text-gray-700 dark:text-gray-300">
            Your Score: <strong>{score}</strong>
          </p>
          <button
            onClick={resetGame}
            className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
          Counting Game
        </h1>

        <div className="flex justify-between text-sm mb-4 text-gray-700 dark:text-gray-300">
          <span>Level: {level}</span>
          <span>Score: {score}</span>
          <span>❤️ {lives}</span>
        </div>

        <div className="text-center mb-6">
          <p className="text-lg text-gray-800 dark:text-gray-100 mb-2">
            Count and add:
          </p>
          <div className="text-3xl font-bold text-blue-600">
            {question.a} + {question.b}
          </div>
        </div>

        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          className="w-full mb-4 px-4 py-3 rounded-xl border text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={checkAnswer}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
        >
          Check Answer
        </button>

        {feedback && (
          <div className="mt-4 text-center text-lg font-medium">
            {feedback}
          </div>
        )}

        <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
          Learn counting step by step. No images. Just thinking!
        </p>
      </div>
    </div>
  );
}
