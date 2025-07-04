"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import QuizQuestionComponent from "./components/quiz-question"
import ResultsPage from "./results-page"
import type { QuizState, QuizQuestion } from "./types/quiz"
import { useLanguage } from "./contexts/language-context"

export default function QuizPage() {
  const { t } = useLanguage()
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    totalQuestions: 25,
    answers: {},
    questions: [],
  })
  const [loading, setLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)

  // Mock data - replace with actual API call
  const mockQuestions: QuizQuestion[] = [
    {
      id: 1,
      type: "mcq",
      question: "What is the capital of Kazakhstan?",
      options: [
        { id: "a", text: "Almaty", label: "A" },
        { id: "b", text: "Nur-Sultan", label: "B" },
        { id: "c", text: "Shymkent", label: "C" },
        { id: "d", text: "Aktobe", label: "D" },
        { id: "e", text: "Karaganda", label: "E" },
      ],
    },
    {
      id: 2,
      type: "block_selection",
      question: "Select the programming language you prefer:",
      options: [
        { id: 1, text: "JavaScript" },
        { id: 2, text: "Python" },
        { id: 3, text: "Java" },
        { id: 4, text: "C++" },
        { id: 5, text: "TypeScript" },
        { id: 6, text: "Go" },
        { id: 7, text: "Rust" },
        { id: 8, text: "PHP" },
        { id: 9, text: "Ruby" },
        { id: 10, text: "Swift" },
      ],
    },
    {
      id: 3,
      type: "reading_mcq",
      question: "Based on the passage above, what is the main theme?",
      readingText:
        "Artificial Intelligence has revolutionized many aspects of modern life. From healthcare to transportation, AI systems are becoming increasingly sophisticated and capable. Machine learning algorithms can now process vast amounts of data to identify patterns that would be impossible for humans to detect. This technological advancement has opened new possibilities for solving complex problems across various industries.\n\nHowever, with great power comes great responsibility. The ethical implications of AI development must be carefully considered to ensure that these technologies benefit humanity as a whole.",
      options: [
        { id: "a", text: "AI is dangerous", label: "A" },
        { id: "b", text: "AI revolutionizes life but needs ethical consideration", label: "B" },
        { id: "c", text: "AI only works in healthcare", label: "C" },
        { id: "d", text: "Humans are better than AI", label: "D" },
        { id: "e", text: "AI is too complex to understand", label: "E" },
      ],
    },
  ]

  useEffect(() => {
    // Simulate API call
    const fetchQuestions = async () => {
      setLoading(true)
      // Replace with actual API call
      // const response = await fetch('/api/quiz/questions')
      // const questions = await response.json()

      setTimeout(() => {
        setQuizState((prev) => ({
          ...prev,
          questions: mockQuestions,
          totalQuestions: mockQuestions.length,
        }))
        setLoading(false)
      }, 1000)
    }

    fetchQuestions()
  }, [])

  const handleAnswerSelect = (answerId: string | number) => {
    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [prev.currentQuestion]: answerId,
      },
    }))
  }

  const handleProceed = () => {
    if (quizState.currentQuestion < quizState.questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
      }))
    } else {
      // Show results page
      setShowResults(true)
    }
  }

  // Show results page after quiz completion
  if (showResults) {
    return <ResultsPage answers={quizState.answers} />
  }

  const currentQuestion = quizState.questions[quizState.currentQuestion]
  const selectedAnswer = quizState.answers[quizState.currentQuestion]
  const progress = ((quizState.currentQuestion + 1) / quizState.totalQuestions) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t.loadingQuestions}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-left mb-8">
          <span className="text-blue-500 text-sm">{t.initialScreen}</span>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* KBTU Logo */}
          <div className="h-20 flex items-center justify-center rounded">
            <img src="https://kbtu.edu.kz/images/logo_blue.png" alt="KBTU Logo" className="h-16 object-contain" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="bg-gray-300 h-8 flex items-center justify-center rounded">
              <span className="text-gray-600 font-medium">{t.progressBar}</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
            <div className="text-center text-sm text-gray-600">
              Question {quizState.currentQuestion + 1} of {quizState.totalQuestions}
            </div>
          </div>

          {/* Question Component */}
          {currentQuestion && (
            <QuizQuestionComponent
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onAnswerSelect={handleAnswerSelect}
            />
          )}

          {/* Proceed Button */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleProceed}
              disabled={selectedAnswer === undefined}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 text-lg"
            >
              {quizState.currentQuestion < quizState.questions.length - 1 ? t.proceed : t.submit}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
