"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, Upload, FileText, User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ChatPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    role: "",
    cancerType: "",
    stage: "",
    treatments: "",
    concerns: "",
  })
  const [showOnboarding, setShowOnboarding] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      // Save chat to local storage
      const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
      chatHistory.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        patientName: patientInfo.name,
        messages: messages.concat({
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        }),
      })
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory))
    },
  })

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) uploaded successfully.`,
      })
    }
  }

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowOnboarding(false)

    // Start the conversation with context from onboarding
    const initialMessage = `Hello, I'm ${patientInfo.name}. I'm a ${patientInfo.role} dealing with ${patientInfo.cancerType} cancer${patientInfo.stage ? ` at stage ${patientInfo.stage}` : ""}. ${patientInfo.treatments ? `I've been undergoing ${patientInfo.treatments}.` : ""} ${patientInfo.concerns ? `My main concerns are: ${patientInfo.concerns}` : ""}`

    // Submit the initial message
    const form = new FormData()
    form.append("message", initialMessage)
    handleSubmit(e as any)
  }

  const generateReport = () => {
    // Save current chat for report generation
    localStorage.setItem(
      "currentReport",
      JSON.stringify({
        patientInfo,
        messages,
        files: uploadedFiles.map((f) => f.name),
        date: new Date().toISOString(),
      }),
    )

    // Navigate to report page
    router.push("/generate-report")
  }

  if (showOnboarding) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-center mb-6 text-purple-700">Welcome to XAI-CEF</h1>
            <p className="text-center mb-6 text-gray-600">
              To provide you with the best support, we'd like to learn a bit about you. This information helps us
              personalize our conversation.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <Input
                  id="name"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Are you a patient or a caregiver?
                </label>
                <select
                  id="role"
                  value={patientInfo.role}
                  onChange={(e) => setPatientInfo({ ...patientInfo, role: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                >
                  <option value="">Please select</option>
                  <option value="patient">Patient</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              <div>
                <label htmlFor="cancerType" className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Cancer
                </label>
                <Input
                  id="cancerType"
                  value={patientInfo.cancerType}
                  onChange={(e) => setPatientInfo({ ...patientInfo, cancerType: e.target.value })}
                  placeholder="E.g., Breast, Lung, Colon"
                  required
                />
              </div>

              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                  Stage (if known)
                </label>
                <Input
                  id="stage"
                  value={patientInfo.stage}
                  onChange={(e) => setPatientInfo({ ...patientInfo, stage: e.target.value })}
                  placeholder="E.g., Stage 2, Early Stage"
                />
              </div>

              <div>
                <label htmlFor="treatments" className="block text-sm font-medium text-gray-700 mb-1">
                  Current or Planned Treatments
                </label>
                <Input
                  id="treatments"
                  value={patientInfo.treatments}
                  onChange={(e) => setPatientInfo({ ...patientInfo, treatments: e.target.value })}
                  placeholder="E.g., Chemotherapy, Surgery, Radiation"
                />
              </div>

              <div>
                <label htmlFor="concerns" className="block text-sm font-medium text-gray-700 mb-1">
                  Main Concerns or Questions
                </label>
                <Textarea
                  id="concerns"
                  value={patientInfo.concerns}
                  onChange={(e) => setPatientInfo({ ...patientInfo, concerns: e.target.value })}
                  placeholder="What would you like help with today?"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Start Conversation
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex flex-col h-[calc(100vh-4rem)] max-w-4xl py-4">
      <div className="flex-1 overflow-y-auto pb-4 px-4">
        <div className="space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-purple-700 mb-2">Welcome, {patientInfo.name}</h2>
              <p className="text-gray-600 mb-4">
                I'm here to support you through your cancer journey. Feel free to ask me anything or share how you're
                feeling.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-4 rounded-lg p-4",
                  message.role === "user" ? "bg-purple-50 ml-12" : "bg-white mr-12 border border-gray-100",
                )}
              >
                <div
                  className={cn(
                    "rounded-full p-2 flex items-center justify-center",
                    message.role === "user" ? "bg-purple-100" : "bg-purple-600 text-white",
                  )}
                >
                  {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    {message.role === "user" ? patientInfo.name : "XAI-CEF"}
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="px-4 py-2 border-t">
          <p className="text-sm font-medium mb-2">Uploaded Documents:</p>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-3 py-1">
                <FileText className="h-3 w-3" />
                {file.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Upload file</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />

            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="min-h-10 flex-1 resize-none"
              rows={1}
            />

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>

          <Button
            type="button"
            onClick={generateReport}
            disabled={messages.length < 2}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Generate Health Summary Report
          </Button>
        </form>
      </div>
    </div>
  )
}
