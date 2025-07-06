"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "../contexts/language-context"

interface SessionStatus {
  grammar_started_at?: string
  grammar_finished_at?: string
  vocabulary_started_at?: string
  vocabulary_finished_at?: string
  reading_started_at?: string
  reading_finished_at?: string
  session_complete: boolean
  remaining_time_grammar?: number
  remaining_time_vocabulary?: number
  remaining_time_reading?: number
}

interface SessionStatusProps {
  iin: string
  onStatusChange?: (status: SessionStatus) => void
}

export default function SessionStatusComponent({ iin, onStatusChange }: SessionStatusProps) {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useLanguage()

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
        const response = await fetch(`${host}/tests/session-status/?iin=${iin}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch session status")
        }
        
        const data = await response.json()
        setStatus(data)
        onStatusChange?.(data)
        setLoading(false)
      } catch (err) {
        setError("Failed to load session status")
        setLoading(false)
      }
    }

    fetchStatus()
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    
    return () => clearInterval(interval)
  }, [iin, onStatusChange])

  const formatTime = (minutes?: number) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStageStatus = (startedAt?: string, finishedAt?: string) => {
    if (finishedAt) return "completed"
    if (startedAt) return "in_progress"
    return "not_started"
  }

  const getStageProgress = (startedAt?: string, finishedAt?: string) => {
    if (finishedAt) return 100
    if (startedAt) return 50
    return 0
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    )
  }

  if (error || !status) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">{error || "No session data available"}</p>
      </Card>
    )
  }

  const stages = [
    {
      name: language === "EN" ? "Grammar" : language === "RU" ? "Грамматика" : "Грамматика",
      status: getStageStatus(status.grammar_started_at, status.grammar_finished_at),
      progress: getStageProgress(status.grammar_started_at, status.grammar_finished_at),
      remainingTime: status.remaining_time_grammar
    },
    {
      name: language === "EN" ? "Vocabulary" : language === "RU" ? "Лексика" : "Сөздік",
      status: getStageStatus(status.vocabulary_started_at, status.vocabulary_finished_at),
      progress: getStageProgress(status.vocabulary_started_at, status.vocabulary_finished_at),
      remainingTime: status.remaining_time_vocabulary
    },
    {
      name: language === "EN" ? "Reading" : language === "RU" ? "Чтение" : "Оқу",
      status: getStageStatus(status.reading_started_at, status.reading_finished_at),
      progress: getStageProgress(status.reading_started_at, status.reading_finished_at),
      remainingTime: status.remaining_time_reading
    }
  ]

  const completedStages = stages.filter(stage => stage.status === "completed").length
  const totalStages = stages.length
  const overallProgress = (completedStages / totalStages) * 100

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {language === "EN" ? "Test Progress" : language === "RU" ? "Прогресс теста" : "Тест прогрессі"}
        </h3>
        <div className="text-sm text-gray-600">
          {completedStages}/{totalStages} {language === "EN" ? "stages completed" : language === "RU" ? "этапов завершено" : "кезеңдер аяқталды"}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{language === "EN" ? "Overall Progress" : language === "RU" ? "Общий прогресс" : "Жалпы прогресс"}</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="w-full h-3" />
      </div>

      {/* Individual Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{stage.name}</span>
              <div className="flex items-center space-x-2">
                {stage.remainingTime && stage.status === "in_progress" && (
                  <span className="text-xs text-red-600 font-mono">
                    {formatTime(stage.remainingTime)}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  stage.status === "completed" 
                    ? "bg-green-100 text-green-800" 
                    : stage.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {stage.status === "completed" 
                    ? (language === "EN" ? "Completed" : language === "RU" ? "Завершено" : "Аяқталды")
                    : stage.status === "in_progress"
                    ? (language === "EN" ? "In Progress" : language === "RU" ? "В процессе" : "Жүріп жатыр")
                    : (language === "EN" ? "Not Started" : language === "RU" ? "Не начат" : "Басталмаған")
                  }
                </span>
              </div>
            </div>
            <Progress value={stage.progress} className="w-full h-2" />
          </div>
        ))}
      </div>

      {status.session_complete && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm text-center">
            {language === "EN" ? "All stages completed! You can view your results." : 
             language === "RU" ? "Все этапы завершены! Вы можете просмотреть результаты." :
             "Барлық кезеңдер аяқталды! Нәтижелеріңізді көре аласыз."}
          </p>
        </div>
      )}
    </Card>
  )
} 