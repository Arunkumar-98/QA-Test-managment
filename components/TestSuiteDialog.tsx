"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { TestSuite, TestCase } from "@/types/qa-types"

interface TestSuiteDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'totalTests' | 'passedTests' | 'failedTests' | 'pendingTests'>) => void
  testSuites: TestSuite[]
  testCases: TestCase[]
  onAddTestCaseToSuite: (testCaseId: string, suiteId: string) => void
  onRemoveTestCaseFromSuite: (testCaseId: string, suiteId: string) => void
}

export function TestSuiteDialog({
  isOpen,
  onClose,
  onSubmit,
  testSuites,
  testCases,
  onAddTestCaseToSuite,
  onRemoveTestCaseFromSuite
}: TestSuiteDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    owner: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      projectId: "", // This will be set by the parent component
      testCaseIds: [],
      isActive: true
    })
    setFormData({ name: "", description: "", tags: [], owner: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="text-white">Create Test Suite</DialogTitle>
          <DialogDescription className="text-slate-300">Create a new test suite for organizing test cases.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suite-name" className="text-white">Suite Name *</Label>
            <Input
              id="suite-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter suite name"
              required
              className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="suite-description" className="text-white">Description</Label>
            <Textarea
              id="suite-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter suite description"
              rows={3}
              className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="suite-owner" className="text-white">Owner</Label>
            <Input
              id="suite-owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="Enter suite owner"
              className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="text-slate-200 border-slate-600/50 hover:bg-slate-700/50">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              Create Suite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 