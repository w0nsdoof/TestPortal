"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { QuizResult } from "./types/results"
import { useLanguage } from "./contexts/language-context"

interface ResultsPageProps {
  answers?: Record<number, string | number>
  alreadySubmitted?: boolean
}

export default function ResultsPage({ answers, alreadySubmitted }: ResultsPageProps) {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasSubmitted = useRef(false)
  const { t, language } = useLanguage()

  // Try to get answers from localStorage if not provided as props
  const getAnswers = () => {
    if (answers) {
      return answers
    }
    
    // Try to get from localStorage
    const storedAnswers = localStorage.getItem("kbtu-answers")
    if (storedAnswers) {
      return JSON.parse(storedAnswers)
    }
    
    return null
  }

  useEffect(() => {
    // Prevent multiple API calls
    if (hasSubmitted.current) {
      return
    }
    
    const fetchedAnswers = getAnswers()
    if (!fetchedAnswers && !alreadySubmitted) {
      setLoading(false)
      setError("No answers found")
      return
    }

    const fetchResults = async () => {
      hasSubmitted.current = true
      setLoading(true)
      setError(null)
      try {
        const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
        const iin = localStorage.getItem("kbtu-iin")
        if (!iin) throw new Error("Missing IIN")
        if (alreadySubmitted) {
          // Only fetch results, do not submit again
          const response = await fetch(`${host}/tests/results/?iin=${iin}`)
          if (!response.ok) throw new Error("Failed to fetch results")
          const data = await response.json()
          // If data is an array, use the first (most recent) item
          const resultData = Array.isArray(data) ? data[0] : data
          if (!resultData) throw new Error("No results found")
          setResult({
            level: resultData.level,
            score: resultData.correct_answers,
            totalQuestions: resultData.total_questions,
            congratulationMessage: `Congratulations! You have achieved ${resultData.level} level proficiency.`,
            resultDescription: `You answered ${resultData.correct_answers} out of ${resultData.total_questions} questions correctly.`,
            levelDescription: resultData.level_description || `${resultData.level} - Level achieved`
          })
          setLoading(false)
          return
        }
        // Find the level from the first answered question (if available)
        let level = "A1"
        const allQuestions = JSON.parse(localStorage.getItem("kbtu-questions") || "[]")
        const firstAnsweredId = Object.keys(fetchedAnswers)[0]
        const firstQuestion = allQuestions.find((q: any) => q.id == firstAnsweredId)
        if (firstQuestion && firstQuestion.level) {
          level = firstQuestion.level
        } else {
        }
        // Prepare answers array
        const answersArr = Object.entries(fetchedAnswers).map(([question_id, selected_option]) => ({
          question_id: Number(question_id),
          selected_option
        }))
        const response = await fetch(`${host}/tests/submit/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ iin, level, answers: answersArr })
        })
        if (!response.ok) throw new Error("Failed to submit answers")
        const data = await response.json()
        setResult({
          level: data.level,
          score: data.correct_answers,
          totalQuestions: data.total_questions,
          congratulationMessage: `Congratulations! You have achieved ${data.level} level proficiency.`,
          resultDescription: `You answered ${data.correct_answers} out of ${data.total_questions} questions correctly.`,
          levelDescription: data.level_description || `${data.level} - Level achieved`
        })
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to fetch results. Please try again.")
        setLoading(false)
      }
    }
    fetchResults()
  }, [answers, alreadySubmitted])

  const handleProceed = () => {
    // Handle final proceed action - could navigate to dashboard, certificate page, etc.
    // window.location.href = "/dashboard" or similar
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">{t.calculatingResults}</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t.failedToLoad}</p>
          <Button onClick={() => window.location.reload()}>{t.tryAgain}</Button>
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

          {/* Congratulation Message */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded">
            <h2 className="text-center font-bold text-xl text-blue-800 mb-4">{t.congratulationsTitle}</h2>
            <p className="text-center font-medium text-lg text-blue-700">
              {result.congratulationMessage}
            </p>
            <p className="text-center text-sm text-blue-600 mt-2">
              {language === "EN" && "Admissions Office, KBTU"}
              {language === "RU" && "Admissions Office, KBTU"}
              {language === "KZ" && "Қабылдау комиссиясы, ҚБТУ"}
            </p>
          </div>

          {/* Result Description and Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Result Description */}
            <Card className="bg-gray-300 p-6">
              <h3 className="font-semibold text-red-500 mb-4">{t.resultDescription}</h3>
              <p className="text-sm leading-relaxed">{result.resultDescription}</p>
              <div className="mt-4 pt-4 border-t border-gray-400">
                <p className="text-sm font-medium">
                  {t.score}: {result.score}/{result.totalQuestions}
                </p>
                <p className="text-sm text-gray-600">
                  {t.accuracy}: {Math.round((result.score / result.totalQuestions) * 100)}%
                </p>
              </div>
            </Card>

            {/* Level */}
            <Card className="bg-gray-300 p-6">
              <h3 className="font-semibold text-red-500 mb-4">{t.level}</h3>
              <div className="text-center mb-4">
                <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-2xl font-bold">
                  {result.level}
                </div>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{result.levelDescription}</p>
            </Card>
          </div>

          {/* Next Quiz Button - Only show if score >= 18 (70%) */}
          {result.score >= 18 && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => window.location.href = "/quiz"}
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 text-lg"
              >
                {language === "EN" && "Take Next Level Quiz"}
                {language === "RU" && "Пройти тест следующего уровня"}
                {language === "KZ" && "Келесі деңгей тестін тапсыру"}
              </Button>
            </div>
          )}

          {/* End Message - Show if score < 18 */}
          {result.score < 18 && (
            <div className="flex justify-center pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-4">
                  {language === "EN" && "You have completed the test. Thank you for participating!"}
                  {language === "RU" && "Вы завершили тест. Спасибо за участие!"}
                  {language === "KZ" && "Сіз тестті аяқтадыңыз. Қатысқаныңыз үшін рахмет!"}
                </p>
                <Button
                  disabled
                  className="bg-gray-400 text-white px-12 py-3 text-lg cursor-not-allowed"
                >
                  {language === "EN" && "Test Completed"}
                  {language === "RU" && "Тест завершен"}
                  {language === "KZ" && "Тест аяқталды"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
