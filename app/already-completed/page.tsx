"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Result {
  id: number
  level: string
  correct_answers: number
  total_questions: number
  created_at: string
  updated_at: string
  applicant: string
}

export default function AlreadyCompletedPage() {
  const [results, setResults] = useState<Result[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)
      const iin = localStorage.getItem("kbtu-iin")
      if (!iin) {
        setError("IIN not found. Please log in again.")
        setLoading(false)
        return
      }
      try {
        const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
        const response = await fetch(`${host}/users/results/?iin=${iin}`)
        if (!response.ok) throw new Error("Failed to fetch previous results.")
        const data = await response.json()
        setResults(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to fetch previous results.")
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">Loading your previous results...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700 mb-2">Test Already Completed</h1>
          <p className="text-gray-700">You have already completed the test. Here are your previous results:</p>
        </div>
        {results && results.length > 0 ? (
          <div className="space-y-6">
            {results.map((res) => (
              <Card key={res.id} className="p-6 bg-white shadow-md">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                  <div className="text-lg font-semibold text-blue-600">Level: {res.level}</div>
                  <div className="text-sm text-gray-500">Date: {new Date(res.created_at).toLocaleString()}</div>
                </div>
                <div className="text-gray-800 mb-2">Score: {res.correct_answers} / {res.total_questions}</div>
                <div className="text-gray-600 text-sm">Applicant IIN: {res.applicant}</div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">No previous results found.</div>
        )}
        <div className="flex justify-center mt-8">
          <Button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="bg-blue-600 text-white px-8 py-2">Log in as another user</Button>
        </div>
      </div>
    </div>
  )
} 