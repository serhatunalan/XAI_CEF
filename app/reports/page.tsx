"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Report {
  id: string
  date: string
  patientName: string
  reportUrl?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Load reports from local storage
    const savedReports = JSON.parse(localStorage.getItem("savedReports") || "[]")
    setReports(savedReports)
  }, [])

  const deleteReport = (id: string) => {
    const updatedReports = reports.filter((report) => report.id !== id)
    setReports(updatedReports)
    localStorage.setItem("savedReports", JSON.stringify(updatedReports))

    toast({
      title: "Report deleted",
      description: "The report has been deleted successfully.",
    })
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-purple-700">My Health Reports</h1>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">No Reports Yet</h2>
            <p className="text-gray-500 text-center max-w-md">
              Your health summary reports will appear here after you generate them from your conversations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Report for {report.patientName}</span>
                  <span className="text-sm font-normal text-gray-500">{format(new Date(report.date), "PPP")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    <span>Health Summary Report</span>
                  </div>
                  <div className="flex gap-2">
                    {report.reportUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={report.reportUrl} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
