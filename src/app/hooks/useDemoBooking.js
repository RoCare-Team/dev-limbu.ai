
"use client"
import { useState, useCallback } from "react"

export default function useDemoBooking() {

  const [demoDetails, setDemoDetails] = useState({
    name: "",
    contact: "",
    selectedDate: new Date()
  })

  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false)
  const [demoBooked, setDemoBooked] = useState(false)

  const handleBookDemoSubmit = useCallback(async (e) => {
    e.preventDefault()
    // Yaha tumhara pura original fetch logic paste karo
  }, [demoDetails])

  return {
    demoDetails,
    setDemoDetails,
    isSubmittingDemo,
    demoBooked,
    handleBookDemoSubmit
  }
}
