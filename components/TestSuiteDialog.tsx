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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Test Suite</DialogTitle>
          <DialogDescription>Create a new test suite for organizing test cases.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suite-name">Suite Name *</Label>
            <Input
              id="suite-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter suite name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="suite-description">Description</Label>
            <Textarea
              id="suite-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter suite description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="suite-owner">Owner</Label>
            <Input
              id="suite-owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="Enter suite owner"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Suite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 