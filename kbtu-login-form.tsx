"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone } from "lucide-react"
import { useLanguage } from "./contexts/language-context"

export default function Component() {
  const { language, setLanguage, t } = useLanguage()
  const [iin, setIin] = useState("")
  const [surname, setSurname] = useState("")
  const [firstname, setFirstname] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleIinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 12)
    setIin(value)
  }

  const handleProceed = async () => {
    setError(null)
    setLoading(true)
    const host = process.env.NEXT_PUBLIC_API_HOST || "http://127.0.0.1:8000"
    try {
      const response = await fetch(`${host}/users/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iin,
          first_name: firstname,
          last_name: surname,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.detail || "Registration failed")
      }
      // Navigate to welcome screen
      localStorage.setItem("kbtu-iin", iin)
      window.location.href = "/welcome"
    } catch (err: any) {
      setError(err.message || "Could not connect to backend")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <span className="text-gray-600 font-medium text-lg">{t.login}</span>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-auto border-none p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KZ">KZ</SelectItem>
                <SelectItem value="RU">RU</SelectItem>
                <SelectItem value="EN">EN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KBTU Logo */}
        <div className="h-20 flex items-center justify-center rounded">
          <img src="https://kbtu.edu.kz/images/logo_blue.png" alt="KBTU Logo" className="h-16 object-contain" />
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                value={iin}
                onChange={handleIinChange}
                placeholder={t.iinPlaceholder}
                className="bg-gray-200 border-gray-300 h-12 text-base"
                maxLength={12}
              />
            </div>

            <div>
              <Input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder={t.surnamePlaceholder}
                className="bg-gray-200 border-gray-300 h-12 text-base"
              />
            </div>

            <div>
              <Input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder={t.firstnamePlaceholder}
                className="bg-gray-200 border-gray-300 h-12 text-base"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button variant="outline" className="flex-1 h-12 text-base border-gray-400 hover:bg-gray-50 bg-transparent">
            {t.acceptTerms}
          </Button>
          <Button className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700" onClick={handleProceed} disabled={loading}>
            {loading ? "Loading..." : t.proceed}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-center pt-2">{error}</div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
  
        </div>
      </div>
    </div>
  )
}
