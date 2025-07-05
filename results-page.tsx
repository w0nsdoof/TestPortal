"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { QuizResult } from "./types/results"
import { useLanguage } from "./contexts/language-context"

interface ResultsPageProps {
  answers?: Record<number, string | number>
}

export default function ResultsPage({ answers }: ResultsPageProps) {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasSubmitted = useRef(false)
  const { t, language } = useLanguage()

  // Mock data - replace with actual API call
  const mockResults: Record<string, QuizResult> = {
    A1: {
      level: "A1",
      score: 12,
      totalQuestions: 25,
      congratulationMessage: "Congratulations! You have achieved A1 level proficiency.",
      resultDescription:
        "You have demonstrated basic understanding of fundamental concepts. You can handle simple, familiar situations and communicate basic information.",
      levelDescription:
        "A1 - Beginner Level\n\nYou can understand and use familiar everyday expressions and very basic phrases. You can introduce yourself and ask simple questions about personal details.",
    },
    A2: {
      level: "A2",
      score: 16,
      totalQuestions: 25,
      congratulationMessage: "Excellent work! You have reached A2 level proficiency.",
      resultDescription:
        "You show good grasp of elementary concepts and can handle routine tasks. You can communicate in simple situations requiring direct exchange of information.",
      levelDescription:
        "A2 - Elementary Level\n\nYou can understand sentences and frequently used expressions. You can communicate in simple and routine tasks requiring direct exchange of information.",
    },
    B1: {
      level: "B1",
      score: 19,
      totalQuestions: 25,
      congratulationMessage: "Great achievement! You have attained B1 level proficiency.",
      resultDescription:
        "You demonstrate intermediate understanding and can deal with most situations. You can express yourself on familiar topics and give brief explanations.",
      levelDescription:
        "B1 - Intermediate Level\n\nYou can understand the main points of clear standard input on familiar matters. You can deal with most situations likely to arise while traveling.",
    },
    B2: {
      level: "B2",
      score: 21,
      totalQuestions: 25,
      congratulationMessage: "Outstanding performance! You have achieved B2 level proficiency.",
      resultDescription:
        "You show strong intermediate skills and can handle complex topics. You can interact with native speakers with fluency and spontaneity.",
      levelDescription:
        "B2 - Upper Intermediate Level\n\nYou can understand the main ideas of complex text. You can interact with a degree of fluency and spontaneity with native speakers.",
    },
    C1: {
      level: "C1",
      score: 24,
      totalQuestions: 25,
      congratulationMessage: "Exceptional! You have reached C1 level proficiency.",
      resultDescription:
        "You demonstrate advanced proficiency and can handle complex situations with ease. You can express yourself fluently and spontaneously.",
      levelDescription:
        "C1 - Advanced Level\n\nYou can understand a wide range of demanding, longer texts. You can express yourself fluently and spontaneously without much obvious searching for expressions.",
    },
  }

  useEffect(() => {
    // Prevent multiple API calls
    if (hasSubmitted.current || !answers) return
    
    const fetchResults = async () => {
      hasSubmitted.current = true
      setLoading(true)
      setError(null)
      try {
        const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
        const iin = localStorage.getItem("kbtu-iin")
        if (!iin || !answers) throw new Error("Missing IIN or answers")
        // Find the level from the first answered question (if available)
        let level = "A1"
        const allQuestions = JSON.parse(localStorage.getItem("kbtu-questions") || "[]")
        const firstAnsweredId = Object.keys(answers)[0]
        const firstQuestion = allQuestions.find((q: any) => q.id == firstAnsweredId)
        if (firstQuestion && firstQuestion.level) level = firstQuestion.level
        // Prepare answers array
        const answersArr = Object.entries(answers).map(([question_id, selected_option]) => ({
          question_id: Number(question_id),
          selected_option
        }))
        const response = await fetch(`${host}/users/submit-answers/`, {
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
          levelDescription: `Level: ${data.level}`
        })
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to fetch results. Please try again.")
        setLoading(false)
      }
    }
    fetchResults()
  }, [answers])

  const handleProceed = () => {
    // Handle final proceed action - could navigate to dashboard, certificate page, etc.
    console.log("Final proceed clicked", result)
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
        <div className="text-left mb-8">
          <span className="text-blue-500 text-sm">{t.initialScreen}</span>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* KBTU Logo */}
          <div className="h-20 flex items-center justify-center rounded">
            <img src="https://kbtu.edu.kz/images/logo_blue.png" alt="KBTU Logo" className="h-16 object-contain" />
          </div>

          {/* Congratulation Message */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded">
            <h2 className="text-center font-bold text-xl text-blue-800 mb-4">{t.congratulationsTitle}</h2>
            <p className="text-center font-medium text-lg text-blue-700">
              {language === "EN" &&
                "Congratulations on successfully completing KELET! Your score is XXXX. We are pleased to welcome you as a future student of KBTU and wish you a successful start to your academic journey!"}
              {language === "RU" &&
                "Поздравляем с успешным прохождением KELET! Ваш результат ХХХХ. Мы рады видеть вас среди будущих студентов KBTU и желаем вам успешного старта в учебе!"}
              {language === "KZ" &&
                "KELET-ті сәтті аяқтауыңызбен құттықтаймыз! Сіздің нәтижеңіз - XXXX. Сізді ҚБТУ-дың болашақ студенттерінің қатарында көруге қуаныштымыз және оқуларыңызға сәттілік тілейміз!"}
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

          {/* Proceed Button */}
          <div className="flex justify-center pt-6">
            <Button onClick={handleProceed} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 text-lg">
              {t.finalProceed}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
