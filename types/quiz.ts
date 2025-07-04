export interface QuizQuestion {
  id: number
  type: "mcq" | "block_selection" | "reading_mcq"
  question: string
  readingText?: string // For reading comprehension questions
  options: QuizOption[]
  correctAnswer?: string | number
}

export interface QuizOption {
  id: string | number
  text: string
  label?: string // A, B, C, D, E for MCQ
}

export interface QuizState {
  currentQuestion: number
  totalQuestions: number
  answers: Record<number, string | number>
  questions: QuizQuestion[]
}
