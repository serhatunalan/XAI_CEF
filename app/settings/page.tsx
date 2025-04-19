"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Upload, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [appName, setAppName] = useState("XAI-CEF")
  const [darkMode, setDarkMode] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load settings from local storage
    const savedSettings = JSON.parse(localStorage.getItem("appSettings") || "{}")
    if (savedSettings.appName) setAppName(savedSettings.appName)
    if (savedSettings.darkMode !== undefined) setDarkMode(savedSettings.darkMode)
    if (savedSettings.logoUrl) setLogoPreview(savedSettings.logoUrl)
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }

      reader.readAsDataURL(file)
    }
  }

  const saveSettings = () => {
    const settings = {
      appName,
      darkMode,
      logoUrl: logoPreview,
    }

    localStorage.setItem("appSettings", JSON.stringify(settings))

    toast({
      title: "Settings saved",
      description: "Your application settings have been saved successfully.",
    })

    // Apply dark mode if needed
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-purple-700">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Enter application name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Application Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="h-16 w-16 rounded-full overflow-hidden border">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="App Logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                    {appName.charAt(0)}
                  </div>
                )}

                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <input ref={fileInputRef} type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode">Dark Mode</Label>
              <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
