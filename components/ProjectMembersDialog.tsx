"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Crown, 
  Shield, 
  Edit3, 
  Eye, 
  Trash2, 
  X, 
  Check, 
  Clock,
  AlertTriangle,
  Settings,
  MoreHorizontal
} from 'lucide-react'
import type { 
  ProjectMembership, 
  ProjectRole, 
  ProjectInvitation,
  ProjectWithMembership 
} from '@/types/qa-types'
import { projectMembershipService } from '@/lib/supabase-service'
import { useToast } from '@/hooks/use-toast'

interface ProjectMembersDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ProjectWithMembership
}

export function ProjectMembersDialog({ isOpen, onClose, project }: ProjectMembersDialogProps) {
  const [members, setMembers] = useState<ProjectMembership[]>([])
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isRemovingUser, setIsRemovingUser] = useState(false)
  
  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>('viewer')
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Role update state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<ProjectRole>('viewer')

  const { toast } = useToast()

  const roleConfig = {
    owner: { 
      label: 'Owner', 
      icon: Crown, 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Full control over project and members'
    },
    admin: { 
      label: 'Admin', 
      icon: Shield, 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Manage members and project settings'
    },
    editor: { 
      label: 'Editor', 
      icon: Edit3, 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Create and edit test cases'
    },
    viewer: { 
      label: 'Viewer', 
      icon: Eye, 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Read-only access to project'
    }
  }

  // Load members and invitations when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadProjectData()
    }
  }, [isOpen, project.id])

  const loadProjectData = async () => {
    try {
      setIsLoading(true)
      const [projectMembers, pendingInvitations] = await Promise.all([
        projectMembershipService.getProjectMembers(project.id),
        projectMembershipService.getPendingInvitations()
      ])
      
      setMembers(projectMembers)
      setInvitations(pendingInvitations.filter(inv => inv.projectId === project.id))
    } catch (error) {
      console.error('Error loading project data:', error)
      toast({
        title: "Error",
        description: "Failed to load project members. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsInviting(true)
      await projectMembershipService.inviteUser(project.id, inviteEmail.trim(), inviteRole)
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} with ${roleConfig[inviteRole].label} role.`,
      })
      
      setInviteEmail('')
      setInviteRole('viewer')
      setShowInviteForm(false)
      await loadProjectData() // Refresh data
    } catch (error) {
      console.error('Error inviting user:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: ProjectRole) => {
    try {
      setIsUpdatingRole(true)
      const member = members.find(m => m.id === memberId)
      if (!member) return

      await projectMembershipService.updateUserRole(project.id, member.userId, newRole)
      
      toast({
        title: "Role Updated",
        description: `User role updated to ${roleConfig[newRole].label}.`,
      })
      
      setEditingMemberId(null)
      await loadProjectData() // Refresh data
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleRemoveUser = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!confirm(`Are you sure you want to remove this user from the project?`)) {
      return
    }

    try {
      setIsRemovingUser(true)
      await projectMembershipService.removeUser(project.id, member.userId)
      
      toast({
        title: "User Removed",
        description: "User has been removed from the project.",
      })
      
      await loadProjectData() // Refresh data
    } catch (error) {
      console.error('Error removing user:', error)
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRemovingUser(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await projectMembershipService.acceptInvitation(invitationId)
      
      toast({
        title: "Invitation Accepted",
        description: "You are now a member of this project!",
      })
      
      await loadProjectData() // Refresh data
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await projectMembershipService.declineInvitation(invitationId)
      
      toast({
        title: "Invitation Declined",
        description: "Invitation has been declined.",
      })
      
      await loadProjectData() // Refresh data
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const canManageMembers = project.userRole === 'owner' || project.userRole === 'admin'
  const canInviteUsers = canManageMembers

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Project Members
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                Manage team members and collaboration settings for your project
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Invite User Section */}
          {canInviteUsers && (
            <div className="p-4 border-b border-gray-200">
              {!showInviteForm ? (
                <Button 
                  onClick={() => setShowInviteForm(true)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Invite New Member</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInviteForm(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="invite-role">Role</Label>
                      <Select value={inviteRole} onValueChange={(value: ProjectRole) => setInviteRole(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleConfig).map(([role, config]) => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-4 h-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInviteUser}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="flex-1"
                    >
                      {isInviting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowInviteForm(false)}
                      disabled={isInviting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Invitations ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{invitation.projectName}</span>
                        <Badge variant="secondary" className={roleConfig[invitation.role].color}>
                          {roleConfig[invitation.role].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Invited by {invitation.invitedByEmail} • {formatDate(invitation.invitedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvitation(invitation.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="flex-1 p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Project Members ({members.length})
            </h3>
            
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No members found.
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const config = roleConfig[member.role]
                    const Icon = config.icon
                    const isCurrentUser = member.userId === 'current-user-id' // You'll need to get this from auth
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {member.userId} {/* You'll need to get user details */}
                                {isCurrentUser && <span className="text-xs text-blue-600">(You)</span>}
                              </span>
                              <Badge variant="secondary" className={config.color}>
                                <Icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {config.description} • Joined {formatDate(member.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {canManageMembers && !isCurrentUser && (
                          <div className="flex items-center gap-2">
                            {editingMemberId === member.id ? (
                              <div className="flex items-center gap-2">
                                <Select value={newRole} onValueChange={(value: ProjectRole) => setNewRole(value)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(roleConfig).map(([role, config]) => (
                                      <SelectItem key={role} value={role}>
                                        <div className="flex items-center gap-2">
                                          <config.icon className="w-4 h-4" />
                                          {config.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateRole(member.id, newRole)}
                                  disabled={isUpdatingRole}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMemberId(null)}
                                  disabled={isUpdatingRole}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMemberId(member.id)
                                    setNewRole(member.role)
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveUser(member.id)}
                                  disabled={isRemovingUser}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 