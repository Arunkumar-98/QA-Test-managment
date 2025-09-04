"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { TestCase, Comment } from "@/types/qa-types"
import { getCommentTypeIcon, getCommentTypeColor, formatTimestamp, extractMentions } from "@/lib/utils"
import { COMMENT_TYPES } from "@/lib/constants"
import { commentService } from "@/lib/supabase-service"
import React from "react"
import { MessageSquare, AlertTriangle, HelpCircle, Lightbulb, Activity, CheckCircle, Trash2 } from "lucide-react"

interface CommentsDialogProps {
  isOpen: boolean
  onClose: () => void
  testCase: TestCase & { comments?: Comment[] }
  onUpdateTestCase: (updates: Partial<TestCase>) => void
  onCommentsUpdate?: (comments: Comment[]) => void
}

export function CommentsDialog({
  isOpen,
  onClose,
  testCase,
  onUpdateTestCase,
  onCommentsUpdate
}: CommentsDialogProps) {
  const [newComment, setNewComment] = useState({
    content: "",
    type: "general" as Comment["type"],
    author: "QA Tester"
  })

  const handleAddComment = async () => {
    if (!newComment.content.trim()) return

    try {
      const comment = await commentService.create({
        testCaseId: testCase.id,
        content: newComment.content,
        author: newComment.author,
        timestamp: new Date(),
        type: newComment.type,
        mentions: extractMentions(newComment.content)
      })

      // Refresh comments by fetching them from the database
      const updatedComments = await commentService.getByTestCaseId(testCase.id)
      onCommentsUpdate?.(updatedComments)
      setNewComment({ content: "", type: "general", author: "QA Tester" })
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    try {
      await commentService.update(commentId, {
        isResolved: true,
        resolvedBy: "QA Tester",
        resolvedAt: new Date()
      })

      // Refresh comments by fetching them from the database
      const updatedComments = await commentService.getByTestCaseId(testCase.id)
      onCommentsUpdate?.(updatedComments)
    } catch (error) {
      console.error('Error resolving comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.delete(commentId)

      // Refresh comments by fetching them from the database
      const updatedComments = await commentService.getByTestCaseId(testCase.id)
      onCommentsUpdate?.(updatedComments)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const CommentTypeIcon = getCommentTypeIcon(newComment.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60">
        <DialogHeader>
          <DialogTitle className="text-white">Comments - {testCase.testCase}</DialogTitle>
          <DialogDescription className="text-slate-300">Manage comments and discussions for this test case.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Comment */}
          <div className="space-y-4 p-4 border border-slate-700/60 rounded-lg bg-slate-800/50">
            <h3 className="font-medium text-white">Add New Comment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comment-author" className="text-white">Author</Label>
                <Input
                  id="comment-author"
                  value={newComment.author}
                  onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
                  placeholder="Enter author name"
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment-type" className="text-white">Type</Label>
                <Select
                  value={newComment.type}
                  onValueChange={(value) => setNewComment({ ...newComment, type: value as Comment["type"] })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getCommentTypeIcon(type) && React.createElement(getCommentTypeIcon(type), { className: "w-4 h-4" })}
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment-content" className="text-white">Comment *</Label>
                <Textarea
                  id="comment-content"
                  value={newComment.content}
                  onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                  placeholder="Enter your comment..."
                  rows={3}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CommentTypeIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">
                  Use @mentions to tag team members
                </span>
              </div>
              <Button onClick={handleAddComment} disabled={!newComment.content.trim()}>
                Add Comment
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">
              Comments ({testCase.comments?.length || 0})
            </h3>
            
            {(!testCase.comments || testCase.comments.length === 0) ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No comments yet. Be the first to add a comment!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {testCase.comments.map((comment) => {
                  const CommentIcon = getCommentTypeIcon(comment.type)
                  return (
                    <div
                      key={comment.id}
                      className={`p-4 border rounded-lg ${
                        comment.isResolved ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${getCommentTypeColor(comment.type)}`}>
                            <CommentIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{comment.author}</div>
                            <div className="text-sm text-slate-500">
                              {formatTimestamp(comment.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comment.isResolved && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                          {!comment.isResolved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolveComment(comment.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-slate-700 whitespace-pre-wrap">
                        {comment.content}
                      </div>
                      
                      {comment.mentions && comment.mentions.length > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-sm text-slate-500">Mentioned:</span>
                          {comment.mentions.map((mention, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              @{mention}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {comment.isResolved && (
                        <div className="mt-2 text-sm text-slate-500">
                          Resolved by {comment.resolvedBy} on {comment.resolvedAt && formatTimestamp(comment.resolvedAt)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 