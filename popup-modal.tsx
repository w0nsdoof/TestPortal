"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "./contexts/language-context"

interface PopupModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
}

export default function PopupModal({ isOpen, onClose, onProceed }: PopupModalProps) {
  const { t } = useLanguage()

  const handleProceed = () => {
    onProceed()
    // Navigate to quiz page
    window.location.href = "/quiz"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white">
        <DialogHeader className="bg-gray-600 text-white p-4 rounded-t-lg">
          <DialogTitle className="text-left text-sm font-normal">{t.popupTitle}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Content Section */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded max-h-80 overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">{t.popupContent}</p>
          </div>

          {/* Proceed Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleProceed}
              className="bg-white border border-gray-300 text-red-500 hover:bg-gray-50 px-8 py-2"
              variant="outline"
            >
              {t.proceed}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
