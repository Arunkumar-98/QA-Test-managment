"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { TestCase } from "@/types/qa-types"
import { getAutomationStatusText, getAutomationStatusColor } from "@/lib/utils"
import { AUTOMATION_TYPES } from "@/lib/constants"
import { Code, Play, CheckCircle, XCircle, Loader2, Circle, Terminal, RefreshCw, Zap } from "lucide-react"

interface AutomationDialogProps {
  isOpen: boolean
  onClose: () => void
  testCase: TestCase
  onUpdateTestCase: (updates: Partial<TestCase>) => void
}

export function AutomationDialog({
  isOpen,
  onClose,
  testCase,
  onUpdateTestCase
}: AutomationDialogProps) {
  const [automationData, setAutomationData] = useState({
    path: testCase.automationScript?.path || "",
    type: testCase.automationScript?.type || "python_selenium",
    command: testCase.automationScript?.command || "",
    headlessMode: testCase.automationScript?.headlessMode || false,
    embeddedCode: testCase.automationScript?.embeddedCode || ""
  })

  const [isRunning, setIsRunning] = useState(false)

  const handleSaveAutomation = () => {
    const automationScript = {
      ...automationData,
      lastRun: testCase.automationScript?.lastRun,
      lastResult: testCase.automationScript?.lastResult || "not_run",
      executionTime: testCase.automationScript?.executionTime,
      output: testCase.automationScript?.output,
      error: testCase.automationScript?.error
    }
    onUpdateTestCase({ automationScript })
  }

  const handleRunAutomation = async () => {
    setIsRunning(true)
    
    // Simulate automation execution
    setTimeout(() => {
      const result = Math.random() > 0.5 ? "pass" as const : "fail" as const
      const automationScript = {
        ...automationData,
        lastRun: new Date(),
        lastResult: result,
        executionTime: Math.floor(Math.random() * 60) + 10,
        output: result === "pass" ? "Test passed successfully" : "Test failed",
        error: result === "fail" ? "Assertion failed" : undefined
      }
      onUpdateTestCase({ automationScript })
      setIsRunning(false)
    }, 2000)
  }

  const getStatusIcon = () => {
    const status = testCase.automationScript?.lastResult || "not_run"
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "fail":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[95vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Automation Settings
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                Configure automation scripts and settings for test case: {testCase.testCase}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Current Status</h3>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={getAutomationStatusColor(testCase)}>
                {getAutomationStatusText(testCase)}
              </span>
            </div>
            {testCase.automationScript?.lastRun && (
              <div className="text-sm text-slate-500 mt-1">
                Last run: {testCase.automationScript.lastRun.toLocaleString()}
              </div>
            )}
            {testCase.automationScript?.executionTime && (
              <div className="text-sm text-slate-500">
                Execution time: {testCase.automationScript.executionTime}s
              </div>
            )}
          </div>

          {/* Automation Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Automation Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="automation-type">Automation Type</Label>
                <Select
                  value={automationData.type}
                  onValueChange={(value) => setAutomationData({ ...automationData, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="automation-path">Script Path</Label>
                <Input
                  id="automation-path"
                  value={automationData.path}
                  onChange={(e) => setAutomationData({ ...automationData, path: e.target.value })}
                  placeholder="Enter script path"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="automation-command">Command</Label>
              <Input
                id="automation-command"
                value={automationData.command}
                onChange={(e) => setAutomationData({ ...automationData, command: e.target.value })}
                placeholder="Enter execution command"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="headless-mode"
                checked={automationData.headlessMode}
                onCheckedChange={(checked) => setAutomationData({ ...automationData, headlessMode: checked as boolean })}
              />
              <Label htmlFor="headless-mode">Run in headless mode</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="embedded-code">Embedded Code</Label>
              <Textarea
                id="embedded-code"
                value={automationData.embeddedCode}
                onChange={(e) => setAutomationData({ ...automationData, embeddedCode: e.target.value })}
                placeholder="Enter automation code here..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Execution Output */}
          {testCase.automationScript?.output && (
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Last Execution Output</h3>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                  {testCase.automationScript.output}
                </pre>
              </div>
            </div>
          )}

          {testCase.automationScript?.error && (
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900">Error</h3>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <pre className="text-sm text-red-700 whitespace-pre-wrap">
                  {testCase.automationScript.error}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAutomation}>
            <Code className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
          <Button 
            onClick={handleRunAutomation} 
            disabled={isRunning || !automationData.path}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Automation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 