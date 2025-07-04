export interface QuizResult {
  level: "A1" | "A2" | "B1" | "B2" | "C1"
  score: number
  totalQuestions: number
  congratulationMessage: string
  resultDescription: string
  levelDescription: string
}

export interface ResultsResponse {
  success: boolean
  result: QuizResult
}
