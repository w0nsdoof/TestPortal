"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { QuizQuestion } from "../types/quiz"

interface QuizQuestionProps {
  question: QuizQuestion
  selectedAnswer: string | number | undefined
  onAnswerSelect: (answerId: string | number) => void
}

export default function QuizQuestionComponent({ question, selectedAnswer, onAnswerSelect }: QuizQuestionProps) {
  const renderMCQOptions = () => {
    const labels = ["A", "B", "C", "D", "E"]
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {question.options.slice(0, 4).map((option, index) => (
            <Button
              key={option.id}
              variant={selectedAnswer === option.id ? "default" : "outline"}
              className={`h-16 text-left justify-start whitespace-normal break-words overflow-hidden ${
                selectedAnswer === option.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => onAnswerSelect(option.id)}
            >
              <span className="font-bold mr-2">{labels[index]}</span>
              <span className="block w-full">{option.text}</span>
            </Button>
          ))}
        </div>
        {question.options[4] && (
          <div className="flex justify-center">
            <Button
              variant={selectedAnswer === question.options[4].id ? "default" : "outline"}
              className={`h-16 w-64 text-left justify-start whitespace-normal break-words overflow-hidden ${
                selectedAnswer === question.options[4].id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => onAnswerSelect(question.options[4].id)}
            >
              <span className="font-bold mr-2">E</span>
              <span className="block w-full">{question.options[4].text}</span>
            </Button>
          </div>
        )}
      </div>
    )
  }

  const renderBlockSelection = () => {
    return (
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => (
          <Button
            key={option.id}
            variant={selectedAnswer === option.id ? "default" : "outline"}
            className={`h-20 text-left justify-start p-4 whitespace-normal break-words overflow-hidden ${
              selectedAnswer === option.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => onAnswerSelect(option.id)}
          >
            <span className="text-sm">{option.text}</span>
          </Button>
        ))}
      </div>
    )
  }

  const renderReadingMCQ = () => {
    return (
      <div className="space-y-6">
        {question.readingText && (
          <Card className="p-6 bg-gray-50">
            <div className="prose max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-line">{question.readingText}</p>
            </div>
          </Card>
        )}
        {renderMCQOptions()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="bg-gray-300 p-6 rounded">
        <h2 className="text-lg font-medium text-center">{question.question || "Question Selection"}</h2>
        {question.readingText && (
          <Card className="p-6 bg-gray-50 mt-4">
            <div className="prose max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-line">{question.readingText}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Answer Options */}
      <div>
        {question.options && question.options.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <Button
                key={option.id}
                variant={selectedAnswer === option.id ? "default" : "outline"}
                className={`h-16 text-left justify-start whitespace-normal break-words overflow-hidden ${
                  selectedAnswer === option.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => onAnswerSelect(option.id)}
              >
                {option.label && <span className="font-bold mr-2">{option.label}</span>}
                <span className="block w-full">{option.text}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
