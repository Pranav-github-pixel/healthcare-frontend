import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "./ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme")
      if (saved === "dark" || saved === "light") return saved
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggle = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"))
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
      className="rounded-full h-11 w-11 border-border/80 bg-card/80 backdrop-blur-md shadow-sm hover:border-secondary transition-all duration-300"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-primary transition-transform duration-300 rotate-0 hover:-rotate-12" />
      ) : (
        <Sun className="h-5 w-5 text-secondary transition-transform duration-300 rotate-0 hover:rotate-45" />
      )}
    </Button>
  )
}
