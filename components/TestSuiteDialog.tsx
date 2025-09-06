"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { TestSuite, TestCase } from "@/types/qa-types"
import { Folder } from "lucide-react"

interface TestSuiteDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt' | 'totalTests' | 'passedTests' | 'failedTests' | 'pendingTests'>) => void
  testSuites: TestSuite[]
  testCases: TestCase[]
  onAddTestCaseToSuite: (testCaseId: string, suiteId: string) => void
  onRemoveTestCaseFromSuite: (testCaseId: string, suiteId: string) => void
  testSuite?: TestSuite // Added for editing
}

export function TestSuiteDialog({
  isOpen,
  onClose,
  onSubmit,
  testSuites,
  testCases,
  onAddTestCaseToSuite,
  onRemoveTestCaseFromSuite,
  testSuite
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
      <DialogContent className="max-w-3xl w-[90vw]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle>
                {testSuite ? 'Edit Test Suite' : 'Create Test Suite'}
              </DialogTitle>
              <DialogDescription>
                {testSuite ? 'Update your test suite details' : 'Create a new test suite to organize your test cases'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-6 py-4">
          <form id="test-suite-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="suite-name" className="text-sm font-medium text-slate-700">Suite Name *</Label>
              <Input
                id="suite-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter suite name"
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suite-description" className="text-sm font-medium text-slate-700">Description</Label>
              <Textarea
                id="suite-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter suite description"
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suite-owner" className="text-sm font-medium text-slate-700">Owner</Label>
              <Input
                id="suite-owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="Enter suite owner"
                className="w-full"
              />
            </div>
          </form>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="test-suite-form" className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white">
            {testSuite ? 'Update Suite' : 'Create Suite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 