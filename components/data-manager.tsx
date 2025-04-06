"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Upload, Trash2 } from "lucide-react"
import { db } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

export function DataManager() {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleExport = () => {
    try {
      db.exportData()
      toast({
        title: "Data Exported",
        description: "Your data has been exported successfully.",
      })
    } catch (err) {
      setError("Failed to export data. Please try again.")
      console.error("Export error:", err)
    }
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)

    try {
      const success = await db.importData(file)

      if (success) {
        toast({
          title: "Data Imported",
          description: "Your data has been imported successfully.",
        })
        // Reload the page to reflect the new data
        document.location.reload()
      } else {
        setError("Failed to import data. The file may be invalid.")
      }
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : "Unknown error"}`)
      console.error("Import error:", err)
    } finally {
      setImporting(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      try {
        const success = db.clearAllData()

        if (success) {
          toast({
            title: "Data Cleared",
            description: "All data has been cleared successfully.",
          })
          // Reload the page to reflect the cleared data
          document.location.reload()
        } else {
          setError("Failed to clear data. Please try again.")
        }
      } catch (err) {
        setError(`Clear data error: ${err instanceof Error ? err.message : "Unknown error"}`)
        console.error("Clear data error:", err)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Backup, restore, or clear your game data</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          Your game data is stored locally in your browser. Use these options to manage your data.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing..." : "Import Data"}
          </Button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        <Button variant="destructive" onClick={handleClearData} className="w-full mt-2 flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </CardFooter>
    </Card>
  )
}

