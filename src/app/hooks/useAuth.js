
"use client"
import { useEffect, useState } from "react"

export default function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

  const logout = () => {
    localStorage.clear()
    window.location.href = "/login"
  }

  return { isLoggedIn, logout }
}
