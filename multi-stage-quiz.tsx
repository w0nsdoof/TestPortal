"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import QuizQuestionComponent from "./components/quiz-question"
import ResultsPage from "./results-page"
import type { QuizState, QuizQuestion } from "./types/quiz"
import { useLanguage } from "./contexts/language-context"

type StageType = "Grammar" | "Vocabulary" | "Reading"
type StageStatus = "not_started" | "in_progress" | "completed"

interface StageInfo {
  type: StageType
  status: StageStatus
  questions: QuizQuestion[]
  currentQuestion: number
  answers: Record<number, string | number>
  timeLimit: number // in minutes
  remainingTime: number // in seconds
  startedAt?: Date
  level?: string
}

interface SessionStatus {
  grammar_started_at?: string
  grammar_finished_at?: string
  vocabulary_started_at?: string
  vocabulary_finished_at?: string
  reading_started_at?: string
  reading_finished_at?: string
  session_complete: boolean
}

export default function MultiStageQuiz() {
  const { t } = useLanguage()
  const [stages, setStages] = useState<StageInfo[]>([
    {
      type: "Grammar",
      status: "not_started",
      questions: [],
      currentQuestion: 0,
      answers: {},
      timeLimit: 20,
      remainingTime: 20 * 60,
      level: undefined
    },
    {
      type: "Vocabulary", 
      status: "not_started",
      questions: [],
      currentQuestion: 0,
      answers: {},
      timeLimit: 20,
      remainingTime: 20 * 60,
      level: undefined
    },
    {
      type: "Reading",
      status: "not_started", 
      questions: [],
      currentQuestion: 0,
      answers: {},
      timeLimit: 15,
      remainingTime: 15 * 60,
      level: undefined
    }
  ])
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitialized = useRef(false)
  const [isWarning, setIsWarning] = useState(false)
  const [isFinalMinute, setIsFinalMinute] = useState(false)
  const [stageIsFinishing, setStageIsFinishing] = useState(false)

  const currentStage = stages[currentStageIndex]

  // Initialize test session
  useEffect(() => {
    if (hasInitialized.current) return
    
    const initializeTest = async () => {
      setLoading(true)
      const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
      const iin = localStorage.getItem("kbtu-iin")
      
      if (!iin) {
        alert("IIN not found. Please log in again.")
        window.location.href = "/"
        return
      }

      // Восстанавливаем ответы из localStorage
      let savedAnswers: Record<string, string | number> = {}
      try {
        const saved = localStorage.getItem("kbtu-answers")
        if (saved) {
          savedAnswers = JSON.parse(saved)
        }
      } catch {}

      try {
        // Check session status first
        const statusResponse = await fetch(`${host}/tests/session-status/?iin=${iin}`)
        let statusData = null
        if (statusResponse.ok) {
          statusData = await statusResponse.json()
          setSessionStatus(statusData)
          // If session is complete, redirect to results
          if (statusData.session_complete) {
            window.location.href = "/already-completed"
            return
          }
        }

        // Новый формат: session_status.stages
        let nextStageIdx = 0
        if (statusData && statusData.session_status && statusData.session_status.stages) {
          const stageOrder = ["Grammar", "Vocabulary", "Reading"]
          const stagesObj = statusData.session_status.stages
          nextStageIdx = stageOrder.findIndex(stage => !stagesObj[stage].finished)
          if (nextStageIdx === -1) {
            // Все этапы завершены
            window.location.href = "/already-completed"
            return
          }
        }
        setCurrentStageIndex(nextStageIdx)
        // Загружаем вопросы для нужного этапа
        await loadStageQuestions(nextStageIdx, savedAnswers)
        hasInitialized.current = true
        setLoading(false)
      } catch (err) {
        console.error("Failed to initialize test:", err)
        setLoading(false)
        alert("Failed to initialize test. Please try again.")
      }
    }

    initializeTest()
  }, [])

  const loadStageQuestions = async (stageIndex: number, savedAnswers?: Record<string, string | number>) => {
    const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
    const iin = localStorage.getItem("kbtu-iin")
    const stageType = stages[stageIndex].type

    try {
      const response = await fetch(`${host}/tests/questions-by-stage/?iin=${iin}&stage_type=${stageType}`)
      
      if (response.status === 403) {
        const data = await response.json()
        if (data && data.error && data.error.includes("Test already completed")) {
          window.location.href = "/already-completed"
          return
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch ${stageType} questions`)
      }

      const data = await response.json()
      
      // Map backend questions to frontend format
      const questions = Array.isArray(data.questions) ? data.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        question: q.prompt,
        readingText: q.paragraph || undefined,
        level: q.level,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          label: opt.label
        }))
      })) : []

      // Восстанавливаем ответы для этого этапа
      let restoredAnswers: Record<string, string | number> = {}
      if (savedAnswers) {
        for (const q of questions) {
          if (savedAnswers[q.id] !== undefined) {
            restoredAnswers[q.id] = savedAnswers[q.id]
          }
        }
      }

      // Update stage with questions, remaining time, и answers
      setStages(prev => prev.map((stage, index) => 
        index === stageIndex 
          ? {
              ...stage,
              questions,
              status: "in_progress",
              startedAt: new Date(),
              remainingTime: data.remaining_time_minutes ? Math.floor(data.remaining_time_minutes * 60) : stage.timeLimit * 60,
              level: data.level,
              answers: restoredAnswers
            }
          : stage
      ))

      // После загрузки вопросов для текущего этапа, обновляем answers для всех этапов из savedAnswers
      if (savedAnswers) {
        setStages(prev => prev.map((stage) => {
          // Для текущего этапа уже обновили выше
          if (stage.type === stages[stageIndex].type) return stage;
          // Для остальных этапов просто обновляем answers из savedAnswers
          const stageAnswers: Record<string, string | number> = {}
          for (const qid in savedAnswers) {
            // qid может быть любого этапа, но мы не знаем вопросы, просто сохраняем
            stageAnswers[qid] = savedAnswers[qid]
          }
          return { ...stage, answers: { ...stage.answers, ...stageAnswers } }
        }))
      }

      // Start timer for this stage
      startStageTimer(stageIndex, data.remaining_time_minutes ? Math.floor(data.remaining_time_minutes * 60) : stages[stageIndex].timeLimit * 60)
    } catch (err) {
      console.error(`Failed to load ${stageType} questions:`, err)
      alert(`Failed to load ${stageType} questions. Please try again.`)
    }
  }

  const startStageTimer = (stageIndex: number, initialTime: number) => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setStages(prev => prev.map((stage, index) => {
        if (index === stageIndex && stage.status === "in_progress") {
          const newRemainingTime = stage.remainingTime - 1
          
          // Каждые 5 минут (300 секунд), кроме последней минуты
          if (newRemainingTime > 60 && newRemainingTime % 300 === 0) {
            setIsWarning(true)
            setTimeout(() => setIsWarning(false), 2000) // 2 секунды анимации
          }
          // Последняя минута
          if (newRemainingTime <= 60) {
            setIsFinalMinute(true)
          } else {
            setIsFinalMinute(false)
          }
          
          if (newRemainingTime <= 0) {
            // Time's up - auto-submit and finish stage
            clearInterval(timerRef.current!)
            finishStage(stageIndex)
            return { ...stage, remainingTime: 0 }
          }
          
          return { ...stage, remainingTime: newRemainingTime }
        }
        return stage
      }))
    }, 1000)
  }

  const handleAnswerSelect = (answerId: string | number) => {
    const currentQuestionId = currentStage.questions[currentStage.currentQuestion]?.id
    setStages(prev => prev.map((stage, index) => 
      index === currentStageIndex 
        ? {
            ...stage,
            answers: {
              ...stage.answers,
              [currentQuestionId]: answerId,
            }
          }
        : stage
    ))
  }

  const handleProceed = () => {
    const currentQuestion = currentStage.questions[currentStage.currentQuestion]
    if (currentQuestion && currentQuestion.options && currentQuestion.options.length === 1) {
      // typing question
      const userInput = currentStage.answers[currentQuestion.id] || ""
      const correct = currentQuestion.options[0].text.trim().toLowerCase()
      const user = (typeof userInput === "string" ? userInput : "").trim().toLowerCase()
      setStages(prev => prev.map((stage, index) => {
        if (index === currentStageIndex) {
          return {
            ...stage,
            answers: {
              ...stage.answers,
              [currentQuestion.id]: user && user === correct ? currentQuestion.options[0].id : ""
            }
          }
        }
        return stage
      }))
    }
    if (currentStage.currentQuestion < currentStage.questions.length - 1) {
      // Move to next question in current stage
      setStages(prev => prev.map((stage, index) => 
        index === currentStageIndex 
          ? { ...stage, currentQuestion: stage.currentQuestion + 1 }
          : stage
      ))
    } else {
      // Finish current stage
      finishStage(currentStageIndex)
    }
  }

  const finishStage = async (stageIndex: number) => {
    setStageIsFinishing(true)
    const stage = stages[stageIndex]
    const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
    const iin = localStorage.getItem("kbtu-iin")
    const isLastStage = stageIndex === stages.length - 1
    const level = stage.level

    try {
      // Сохраняем все ответы в localStorage
      const allAnswers = stages.reduce((acc, stage) => ({ ...acc, ...stage.answers }), {})
      localStorage.setItem("kbtu-answers", JSON.stringify(allAnswers))

      if (isLastStage) {
        // At the last stage, first submit all answers, then finish the last stage
        const submitSuccess = await submitAllAnswers(allAnswers)
        if (!submitSuccess) return // If submit fails, do not proceed
      }

      // Finish the stage (for last stage, this comes after submit)
      const finishResponse = await fetch(`${host}/tests/finish-stage/?iin=${iin}&stage_type=${stage.type}&level=${level}`, {
        method: "POST"
      })

      if (!finishResponse.ok) {
        setStageIsFinishing(false)
        throw new Error("Failed to finish stage")
      }

      const finishData = await finishResponse.json()

      // Update stage status
      setStages(prev => prev.map((s, index) => 
        index === stageIndex 
          ? { ...s, status: "completed" }
          : s
      ))

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (isLastStage) {
        // Only after both submit and finish, show results
        setShowResults(true)
      } else {
        // Move to next stage
        const nextStageIndex = stageIndex + 1
        if (nextStageIndex < stages.length) {
          setCurrentStageIndex(nextStageIndex)
          // Сбросить выбранный вопрос на первом вопросе нового этапа
          setStages(prev => prev.map((stage, idx) => idx === nextStageIndex ? { ...stage, currentQuestion: 0 } : stage))
          await loadStageQuestions(nextStageIndex)
        }
      }
    } catch (err) {
      setStageIsFinishing(false)
      console.error("Failed to finish stage:", err)
      alert("Failed to finish stage. Please try again.")
    }
    setStageIsFinishing(false)
  }

  // Submit all answers at the end, returns true if successful
  const submitAllAnswers = async (allAnswers: Record<number, string | number>) => {
    const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
    const iin = localStorage.getItem("kbtu-iin")
    // Берём level из текущего этапа
    const level = stages[currentStageIndex].level
    // Prepare answers array
    const answersArr = Object.entries(allAnswers).map(([question_id, selected_option]) => ({
      question_id: Number(question_id),
      selected_option
    }))
    try {
      const response = await fetch(`${host}/tests/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iin, level, answers: answersArr })
      })
      if (!response.ok) throw new Error("Failed to submit answers")
      return true
    } catch (err) {
      alert("Failed to submit answers. Please try again.")
      return false
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Show results page after all stages completion
  if (showResults) {
    const allAnswers = stages.reduce((acc, stage) => ({ ...acc, ...stage.answers }), {})
    return <ResultsPage answers={allAnswers} alreadySubmitted={true} />
  }

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

  if (!currentStage || currentStage.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No questions available for this stage</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const currentQuestion = currentStage.questions[currentStage.currentQuestion]
  const selectedAnswer = currentQuestion ? currentStage.answers[currentQuestion.id] : undefined
  const stageProgress = ((currentStage.currentQuestion + 1) / currentStage.questions.length) * 100
  const overallProgress = ((currentStageIndex * 100) + stageProgress) / stages.length

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* KBTU Logo */}
          <div className="h-20 flex items-center justify-center rounded">
            <img src="https://kbtu.edu.kz/images/logo_blue.png" alt="KBTU Logo" className="h-16 object-contain" />
          </div>

          {/* Stage Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {currentStage.type === "Grammar" ? t.grammarStage : 
                 currentStage.type === "Vocabulary" ? t.vocabularyStage : 
                 t.readingStage}
              </h2>
              <div className="text-right">
                <div className={
                  `text-2xl font-bold transition-all duration-300 ` +
                  (isFinalMinute ? "text-red-700 animate-pulse" : "text-red-600") +
                  (isWarning ? " animate-bounce" : "")
                }>
                  {formatTime(currentStage.remainingTime)}
                </div>
                <div className="text-sm text-gray-600">{t.remainingTime}</div>
              </div>
            </div>
            
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t.overallProgress}</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full h-3" />
            </div>

            {/* Stage Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t.stageProgress}</span>
                <span>Question {currentStage.currentQuestion + 1} of {currentStage.questions.length}</span>
              </div>
              <Progress value={stageProgress} className="w-full h-2" />
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
              disabled={selectedAnswer === undefined || stageIsFinishing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 text-lg"
            >
              {currentStage.currentQuestion < currentStage.questions.length - 1 ? t.proceed : t.finishStage}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 