"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import MultiStageQuiz from "../../multi-stage-quiz"
import SessionStatusComponent from "../../components/session-status"
import { useLanguage } from "../../contexts/language-context"

export default function TestMultiStagePage() {
  const [showQuiz, setShowQuiz] = useState(false)
  const [iin, setIin] = useState("123456789012")
  const { t, language } = useLanguage()

  const handleStartTest = () => {
    if (iin.length === 12) {
      localStorage.setItem("kbtu-iin", iin)
      setShowQuiz(true)
    } else {
      alert("Please enter a valid 12-digit IIN")
    }
  }

  if (showQuiz) {
    return <MultiStageQuiz />
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {language === "EN" ? "Multi-Stage Test Demo" : 
             language === "RU" ? "Демо многоэтапного теста" : 
             "Көп кезеңді тест демо"}
          </h1>
          <p className="text-gray-600">
            {language === "EN" ? "Test the new multi-stage KELET system" :
             language === "RU" ? "Протестируйте новую многоэтапную систему KELET" :
             "Жаңа көп кезеңді KELET жүйесін сынап көріңіз"}
          </p>
        </div>

        {/* IIN Input */}
        <Card className="p-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              {language === "EN" ? "Enter Test IIN (12 digits):" :
               language === "RU" ? "Введите тестовый ИИН (12 цифр):" :
               "Тест ЖСН-ін енгізіңіз (12 сан):"}
            </label>
            <input
              type="text"
              value={iin}
              onChange={(e) => setIin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456789012"
              maxLength={12}
            />
            <Button
              onClick={handleStartTest}
              disabled={iin.length !== 12}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {language === "EN" ? "Start Multi-Stage Test" :
               language === "RU" ? "Начать многоэтапный тест" :
               "Көп кезеңді тестті бастау"}
            </Button>
          </div>
        </Card>

        {/* Session Status Demo */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === "EN" ? "Session Status Demo" :
             language === "RU" ? "Демо статуса сессии" :
             "Сессия күйінің демо"}
          </h2>
          <SessionStatusComponent iin={iin} />
        </Card>

        {/* Test Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === "EN" ? "Test Information" :
             language === "RU" ? "Информация о тесте" :
             "Тест туралы ақпарат"}
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{language === "EN" ? "Grammar Stage:" : language === "RU" ? "Этап грамматики:" : "Грамматика кезеңі:"}</span>
              <span>20 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>{language === "EN" ? "Vocabulary Stage:" : language === "RU" ? "Этап лексики:" : "Сөздік кезеңі:"}</span>
              <span>20 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>{language === "EN" ? "Reading Stage:" : language === "RU" ? "Этап чтения:" : "Оқу кезеңі:"}</span>
              <span>15 minutes</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between font-medium">
                <span>{language === "EN" ? "Total Time:" : language === "RU" ? "Общее время:" : "Жалпы уақыт:"}</span>
                <span>55 minutes</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Backend Requirements */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === "EN" ? "Required Backend Endpoints" :
             language === "RU" ? "Требуемые эндпоинты бэкенда" :
             "Қажетті бэкенд эндпоинттері"}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <code>GET /session-status/?iin=123</code>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <code>GET /questions-by-stage/?iin=123&stage_type=Grammar</code>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <code>POST /submit/</code>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <code>POST /finish-stage/?iin=123&stage_type=Grammar</code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 