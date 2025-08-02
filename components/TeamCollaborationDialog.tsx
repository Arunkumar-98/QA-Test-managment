"use client"

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from '@/hooks/use-toast'
import { projectService } from '@/lib/supabase-service'
import { User, Share2, Users, History, Trash2, Mail, Shield, Eye, Edit, Crown } from 'lucide-react'

interface TeamCollaborationDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  isOwner: boolean
}

interface ProjectMember {
  id: string
  user_id: string
  owner_id: string
  permission_level: 'view' | 'edit' | 'admin'
  shared_at: string
  user: { email: string }
  owner: { email: string }
}

interface ActivityLog {
  id: string
  user_id: string
  action_type: string
  entity_type: string
  description: string
  timestamp: string
  user: { email: string }
}

export function TeamCollaborationDialog({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName, 
  isOwner 
}: TeamCollaborationDialogProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'members' | 'activity'>('share')
  const [userEmail, setUserEmail] = useState('')
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit' | 'admin'>('view')
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [removingUser, setRemovingUser] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadMembers()
      loadActivity()
    }
  }, [isOpen, projectId])

  const loadMembers = async () => {
    try {
      const data = await projectService.getProjectMembers(projectId)
      setMembers(data)
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: "Error",
        description: "Failed to load project members",
        variant: "destructive",
      })
    }
  }

  const loadActivity = async () => {
    try {
      const data = await projectService.getProjectActivity(projectId, 20)
      setActivity(data)
    } catch (error) {
      console.error('Error loading activity:', error)
      toast({
        title: "Error",
        description: "Failed to load project activity",
        variant: "destructive",
      })
    }
  }

  const handleShareProject = async () => {
    if (!userEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user email",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await projectService.shareProject(projectId, userEmail.trim(), permissionLevel)
      toast({
        title: "Success",
        description: `Project shared with ${userEmail}`,
      })
      setUserEmail('')
      setPermissionLevel('view')
      loadMembers()
      loadActivity()
    } catch (error) {
      console.error('Error sharing project:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userEmail: string) => {
    setRemovingUser(userEmail)
    try {
      await projectService.removeUserFromProject(projectId, userEmail)
      toast({
        title: "Success",
        description: `Removed ${userEmail} from project`,
      })
      loadMembers()
      loadActivity()
    } catch (error) {
      console.error('Error removing user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove user",
        variant: "destructive",
      })
    } finally {
      setRemovingUser(null)
    }
  }

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />
      case 'edit': return <Edit className="w-4 h-4 text-blue-600" />
      case 'view': return <Eye className="w-4 h-4 text-gray-600" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const getPermissionLabel = (level: string) => {
    switch (level) {
      case 'admin': return 'Admin'
      case 'edit': return 'Edit'
      case 'view': return 'View'
      default: return level
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Collaboration - {projectName}
          </DialogTitle>
          <DialogDescription>
            Manage project sharing, team members, and view activity history
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-2 mb-4">
          <Button
            variant={activeTab === 'share' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('share')}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Project
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('members')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Members ({members.length})
          </Button>
          <Button
            variant={activeTab === 'activity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('activity')}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Activity
          </Button>
        </div>

        {activeTab === 'share' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share with Team Member
                </CardTitle>
                <CardDescription>
                  Invite team members to collaborate on this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">User Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="Enter user email address"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-level">Permission Level</Label>
                  <Select value={permissionLevel} onValueChange={(value: any) => setPermissionLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Only
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleShareProject} 
                  disabled={loading || !userEmail.trim()}
                  className="w-full"
                >
                  {loading ? 'Sharing...' : 'Share Project'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Project Members
                </CardTitle>
                <CardDescription>
                  Manage team members and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No team members yet</p>
                    <p className="text-sm">Share the project to add team members</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{member.user.email}</p>
                            <p className="text-sm text-gray-500">
                              Shared by {member.owner.email} • {formatTimestamp(member.shared_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getPermissionIcon(member.permission_level)}
                            {getPermissionLabel(member.permission_level)}
                          </Badge>
                          {isOwner && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(member.user.email)}
                              disabled={removingUser === member.user.email}
                            >
                              {removingUser === member.user.email ? 'Removing...' : 'Remove'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Project Activity
                </CardTitle>
                <CardDescription>
                  Recent activity and changes in this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No activity yet</p>
                    <p className="text-sm">Activity will appear here as team members make changes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activity.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{log.user.email}</p>
                          <p className="text-sm text-gray-600">{log.description}</p>
                          <p className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 