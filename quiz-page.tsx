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

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
      const iin = localStorage.getItem("kbtu-iin")
      if (!iin) {
        setLoading(false)
        alert("IIN not found. Please log in again.")
        window.location.href = "/"
        return
      }
      try {
        const response = await fetch(`${host}/questions/personalized/?iin=${iin}`)
        if (response.status === 403) {
          const data = await response.json()
          if (data && data.error && data.error.includes("Test already completed")) {
            window.location.href = "/already-completed"
            return
          }
        }
        if (!response.ok) {
          throw new Error("Failed to fetch questions")
        }
        const data = await response.json()
        // Map backend questions to frontend format
        const questions = Array.isArray(data) ? data.map((q: any) => ({
          id: q.id,
          type: q.type, // Keep as Grammar, Reading, Vocabulary
          question: q.prompt,
          readingText: q.paragraph || undefined,
          level: q.level, // Store the level from the backend
          options: q.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            label: opt.label
          }))
        })) : []
        
        // Store questions in localStorage for results page
        localStorage.setItem("kbtu-questions", JSON.stringify(questions))
        
        setQuizState((prev) => ({
          ...prev,
          questions,
          totalQuestions: questions.length,
        }))
        setLoading(false)
      } catch (err) {
        setLoading(false)
        alert("Failed to load questions. Please try again later.")
      }
    }
    fetchQuestions()
  }, [])

  const handleAnswerSelect = (answerId: string | number) => {
    const currentQuestionId = quizState.questions[quizState.currentQuestion]?.id
    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestionId]: answerId,
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
      // Store answers in localStorage before showing results
      localStorage.setItem("kbtu-answers", JSON.stringify(quizState.answers))
      // Show results page
      setShowResults(true)
    }
  }

  // Show results page after quiz completion
  if (showResults) {
    return <ResultsPage answers={quizState.answers} />
  }

  const currentQuestion = quizState.questions[quizState.currentQuestion]
  const selectedAnswer = currentQuestion ? quizState.answers[currentQuestion.id] : undefined
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
