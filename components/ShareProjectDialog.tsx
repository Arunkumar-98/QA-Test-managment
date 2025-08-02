"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Share2, Copy, Eye, MessageSquare, Edit, Plus, Trash2, Download, Calendar, Users, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ProjectPermissions, ProjectShare } from '@/types/qa-types'
import { projectShareService } from '@/lib/supabase-service'

interface ShareProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onShareCreated?: (share: ProjectShare) => void
}

const PERMISSION_PRESETS = {
  'view-only': {
    name: 'View Only',
    description: 'Can only view test cases and comments',
    permissions: {
      canView: true,
      canComment: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false
    }
  },
  'comment': {
    name: 'Can Comment',
    description: 'Can view and add comments to test cases',
    permissions: {
      canView: true,
      canComment: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false
    }
  },
  'edit': {
    name: 'Can Edit',
    description: 'Can view, comment, and edit test cases',
    permissions: {
      canView: true,
      canComment: true,
      canEdit: true,
      canCreate: false,
      canDelete: false,
      canExport: false
    }
  },
  'full-access': {
    name: 'Full Access',
    description: 'Can perform all actions except delete',
    permissions: {
      canView: true,
      canComment: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true
    }
  }
}

export function ShareProjectDialog({ isOpen, onClose, projectId, projectName, onShareCreated }: ShareProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('view-only')
  const [permissions, setPermissions] = useState<ProjectPermissions>(PERMISSION_PRESETS['view-only'].permissions)
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [maxViews, setMaxViews] = useState<string>('')
  const [allowedEmails, setAllowedEmails] = useState<string>('')
  const [createdShare, setCreatedShare] = useState<ProjectShare | null>(null)
  const [error, setError] = useState('')
  
  const { toast } = useToast()

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    setPermissions(PERMISSION_PRESETS[preset as keyof typeof PERMISSION_PRESETS].permissions)
  }

  const handlePermissionChange = (permission: keyof ProjectPermissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }))
  }

  const handleCreateShare = async () => {
    setIsLoading(true)
    setError('')

    // Validate required fields
    if (!projectId || !projectName) {
      setError('Project ID and Project Name are required')
      toast({
        title: "Error Sharing Project",
        description: "Project information is missing. Please select a project first.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const options: any = {}
      
      if (expiresAt) {
        options.expiresAt = new Date(expiresAt)
      }
      
      if (maxViews) {
        options.maxViews = parseInt(maxViews)
      }
      
      if (allowedEmails.trim()) {
        options.allowedEmails = allowedEmails.split(',').map(email => email.trim()).filter(Boolean)
      }

      const share = await projectShareService.createShare(projectId, projectName, permissions, options)
      setCreatedShare(share)
      onShareCreated?.(share)
      
      toast({
        title: "Project Shared Successfully!",
        description: "Your project has been shared. Copy the link below to share with others.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
      toast({
        title: "Error Sharing Project",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyShareLink = async () => {
    if (!createdShare) return
    
    const shareUrl = `${window.location.origin}/shared/${createdShare.accessToken}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setSelectedPreset('view-only')
    setPermissions(PERMISSION_PRESETS['view-only'].permissions)
    setExpiresAt('')
    setMaxViews('')
    setAllowedEmails('')
    setCreatedShare(null)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Project: {projectName}</span>
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for this project with customizable permissions.
          </DialogDescription>
        </DialogHeader>

        {!createdShare ? (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Permission Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Permission Presets</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedPreset === key 
                        ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/50' 
                        : 'hover:border-slate-300'
                    }`}
                    onClick={() => handlePresetChange(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{preset.name}</h4>
                          <p className="text-xs text-slate-600 mt-1">{preset.description}</p>
                        </div>
                        {selectedPreset === key && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Permissions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Custom Permissions</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canView"
                    checked={permissions.canView}
                    onCheckedChange={(checked) => handlePermissionChange('canView', checked as boolean)}
                  />
                  <Label htmlFor="canView" className="flex items-center space-x-2 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>View Test Cases</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canComment"
                    checked={permissions.canComment}
                    onCheckedChange={(checked) => handlePermissionChange('canComment', checked as boolean)}
                  />
                  <Label htmlFor="canComment" className="flex items-center space-x-2 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>Add Comments</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canEdit"
                    checked={permissions.canEdit}
                    onCheckedChange={(checked) => handlePermissionChange('canEdit', checked as boolean)}
                  />
                  <Label htmlFor="canEdit" className="flex items-center space-x-2 text-sm">
                    <Edit className="w-4 h-4" />
                    <span>Edit Test Cases</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canCreate"
                    checked={permissions.canCreate}
                    onCheckedChange={(checked) => handlePermissionChange('canCreate', checked as boolean)}
                  />
                  <Label htmlFor="canCreate" className="flex items-center space-x-2 text-sm">
                    <Plus className="w-4 h-4" />
                    <span>Create Test Cases</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canExport"
                    checked={permissions.canExport}
                    onCheckedChange={(checked) => handlePermissionChange('canExport', checked as boolean)}
                  />
                  <Label htmlFor="canExport" className="flex items-center space-x-2 text-sm">
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </Label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Advanced Options</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiresAt" className="text-sm">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxViews" className="text-sm">Max Views (Optional)</Label>
                  <Input
                    id="maxViews"
                    type="number"
                    placeholder="Unlimited"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allowedEmails" className="text-sm">Restrict to Emails (Optional)</Label>
                <Textarea
                  id="allowedEmails"
                  placeholder="Enter email addresses separated by commas"
                  value={allowedEmails}
                  onChange={(e) => setAllowedEmails(e.target.value)}
                  className="h-20"
                />
                <p className="text-xs text-slate-500">Leave empty to allow anyone with the link to access</p>
              </div>
            </div>
          </div>
        ) : (
          /* Share Link Created */
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Your project has been shared successfully! Share the link below with your team members.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={`${window.location.origin}/shared/${createdShare.accessToken}`}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyShareLink} variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Access Token:</span>
                <p className="text-slate-600 font-mono text-xs mt-1">{createdShare.accessToken}</p>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-slate-600 text-xs mt-1">
                  {new Date(createdShare.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!createdShare ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateShare} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Share...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 