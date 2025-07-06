"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import PopupModal from "./popup-modal"
import { useLanguage } from "./contexts/language-context"

export default function WelcomeScreen() {
  const [showPopup, setShowPopup] = useState(false)
  const { t } = useLanguage()

  const handleProceed = () => {
    setShowPopup(true)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  const handlePopupProceed = () => {
    setShowPopup(false)
    // Handle next step after popup
    console.log("Proceeding from popup...")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">

        <div className="bg-white border-2 border-blue-400 rounded-lg p-12">
          <div className="flex flex-col items-center space-y-8 max-w-2xl mx-auto">
            {/* KBTU Logo */}
            <div className="w-full max-w-md">
              <div className="h-24 flex items-center justify-center rounded">
                <img src="https://kbtu.edu.kz/images/logo_blue.png" alt="KBTU Logo" className="h-20 object-contain" />
              </div>
            </div>

            {/* Welcome Heading Section */}
            <div className="w-full max-w-md">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded">
                <h2 className="text-xl font-bold text-center text-blue-800 mb-2">{t.welcomeTitle}</h2>
                <h3 className="text-lg font-semibold text-center text-blue-700">{t.welcomeHeading}</h3>
              </div>
            </div>

            {/* Welcome Text Section */}
            <div className="w-full max-w-md">
              <div className="bg-gray-50 border border-gray-200 p-6 rounded max-h-64 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">{t.welcomeText}</p>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="pt-8">
              <Button
                onClick={handleProceed}
                className="bg-blue-600 hover:bg-blue-700 text-white px-16 py-4 text-lg font-medium rounded"
                style={{ width: "337px", height: "82px" }}
              >
                {t.proceed}
              </Button>
            </div>
          </div>
        </div>
        <PopupModal isOpen={showPopup} onClose={handleClosePopup} onProceed={handlePopupProceed} />
      </div>
    </div>
  )
}
