"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, FileText, Download, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

interface ReportData {
  patientInfo: {
    name: string
    role: string
    cancerType: string
    stage: string
    treatments: string
    concerns: string
  }
  messages: {
    id: string
    role: "user" | "assistant"
    content: string
  }[]
  files: string[]
  date: string
}

export default function GenerateReportPage() {
  const [isGenerating, setIsGenerating] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Load report data from local storage
    const data = JSON.parse(localStorage.getItem("currentReport") || "null")
    setReportData(data)

    if (data) {
      generatePdf(data)
    } else {
      setIsGenerating(false)
      toast({
        title: "Error",
        description: "No report data found. Please start a conversation first.",
        variant: "destructive",
      })
    }
  }, [toast])

  const generatePdf = async (data: ReportData) => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()

      // Add a page to the document
      const page = pdfDoc.addPage([600, 800])

      // Get the standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Set some properties for the document
      const { width, height } = page.getSize()
      const margin = 50
      let y = height - margin
      const lineHeight = 15

      // Add title
      page.drawText("XAI-CEF Health Summary Report", {
        x: 50,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0.5, 0, 0.5),
      })

      y -= lineHeight * 2

      // Add patient info
      page.drawText(`Patient Name: ${data.patientInfo.name}`, {
        x: 50,
        y,
        size: 12,
        font: boldFont,
      })

      y -= lineHeight

      page.drawText(`Role: ${data.patientInfo.role}`, {
        x: 50,
        y,
        size: 12,
        font,
      })

      y -= lineHeight

      page.drawText(`Cancer Type: ${data.patientInfo.cancerType}`, {
        x: 50,
        y,
        size: 12,
        font,
      })

      if (data.patientInfo.stage) {
        y -= lineHeight
        page.drawText(`Stage: ${data.patientInfo.stage}`, {
          x: 50,
          y,
          size: 12,
          font,
        })
      }

      if (data.patientInfo.treatments) {
        y -= lineHeight
        page.drawText(`Treatments: ${data.patientInfo.treatments}`, {
          x: 50,
          y,
          size: 12,
          font,
        })
      }

      y -= lineHeight * 2

      // Add date
      const reportDate = new Date(data.date).toLocaleDateString()
      page.drawText(`Report Date: ${reportDate}`, {
        x: 50,
        y,
        size: 12,
        font: boldFont,
      })

      y -= lineHeight * 2

      // Add conversation summary
      page.drawText("Conversation Summary", {
        x: 50,
        y,
        size: 14,
        font: boldFont,
      })

      y -= lineHeight * 1.5

      // Extract key points from the conversation
      const assistantMessages = data.messages.filter((m) => m.role === "assistant")
      const summaryText = "Based on our conversation, here are the key points:\n\n"

      // Add each message with word wrapping
      for (let i = 0; i < assistantMessages.length; i++) {
        const message = assistantMessages[i].content
        const words = message.split(" ")
        let line = ""

        for (const word of words) {
          if ((line + word).length > 70) {
            if (y < margin) {
              // Add a new page if we're at the bottom
              const newPage = pdfDoc.addPage([600, 800])
              page = newPage
              y = height - margin
            }

            page.drawText(line, {
              x: 50,
              y,
              size: 10,
              font,
            })

            y -= lineHeight
            line = word + " "
          } else {
            line += word + " "
          }
        }

        if (line.trim().length > 0) {
          if (y < margin) {
            const newPage = pdfDoc.addPage([600, 800])
            page = newPage
            y = height - margin
          }

          page.drawText(line, {
            x: 50,
            y,
            size: 10,
            font,
          })

          y -= lineHeight
        }

        y -= lineHeight
      }

      // Add uploaded documents section if any
      if (data.files.length > 0) {
        y -= lineHeight

        page.drawText("Uploaded Documents", {
          x: 50,
          y,
          size: 14,
          font: boldFont,
        })

        y -= lineHeight * 1.5

        for (const file of data.files) {
          page.drawText(`• ${file}`, {
            x: 50,
            y,
            size: 10,
            font,
          })

          y -= lineHeight
        }
      }

      // Add disclaimer
      y -= lineHeight * 2

      const disclaimer =
        "DISCLAIMER: This report is generated based on your conversation with XAI-CEF and is not a substitute for professional medical advice. Please consult with your healthcare provider for medical guidance."
      const disclaimerWords = disclaimer.split(" ")
      let disclaimerLine = ""

      for (const word of disclaimerWords) {
        if ((disclaimerLine + word).length > 70) {
          page.drawText(disclaimerLine, {
            x: 50,
            y,
            size: 8,
            font: boldFont,
            color: rgb(0.5, 0, 0),
          })

          y -= lineHeight * 0.8
          disclaimerLine = word + " "
        } else {
          disclaimerLine += word + " "
        }
      }

      if (disclaimerLine.trim().length > 0) {
        page.drawText(disclaimerLine, {
          x: 50,
          y,
          size: 8,
          font: boldFont,
          color: rgb(0.5, 0, 0),
        })
      }

      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save()

      // Convert to blob and create URL
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)

      // Save the report to local storage
      const savedReports = JSON.parse(localStorage.getItem("savedReports") || "[]")
      const newReport = {
        id: Date.now().toString(),
        date: data.date,
        patientName: data.patientInfo.name,
        reportUrl: url,
      }

      savedReports.push(newReport)
      localStorage.setItem("savedReports", JSON.stringify(savedReports))

      setIsGenerating(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setIsGenerating(false)
      toast({
        title: "Error",
        description: "Failed to generate the PDF report.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chat
      </Button>

      <h1 className="text-3xl font-bold mb-6 text-purple-700">Health Summary Report</h1>

      <Card>
        <CardContent className="py-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <h2 className="text-xl font-medium text-gray-600 mb-2">Generating Your Report</h2>
              <p className="text-gray-500 text-center max-w-md">
                Please wait while we create your personalized health summary report...
              </p>
            </div>
          ) : pdfUrl ? (
            <div className="space-y-6">
              <div className="aspect-[3/4] w-full border rounded-lg overflow-hidden">
                <iframe src={pdfUrl} className="w-full h-full" title="Health Summary Report" />
              </div>

              <div className="flex justify-center">
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <a
                    href={pdfUrl}
                    download={`XAI-CEF_Report_${reportData?.patientInfo.name}_${new Date().toISOString().split("T")[0]}.pdf`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </a>
                </Button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                This report has been saved to your "My Reports" section for future reference.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-600 mb-2">Report Generation Failed</h2>
              <p className="text-gray-500 text-center max-w-md">
                We couldn't generate your report. Please try again or start a new conversation.
              </p>
              <Button onClick={() => router.push("/")} className="mt-4 bg-purple-600 hover:bg-purple-700">
                Return to Chat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
