"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Pin, 
  PinOff, 
  Search, 
  Calendar,
  Tag,
  Palette,
  Save,
  X,
  FileText,
  Clock
} from 'lucide-react'
import type { Note, CreateNoteInput } from '@/types/qa-types'
import { noteService } from '@/lib/supabase-service'
import { useToast } from '@/hooks/use-toast'

interface NotesDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export function NotesDialog({ isOpen, onClose, projectId, projectName }: NotesDialogProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [color, setColor] = useState<string>('')
  const [newTag, setNewTag] = useState('')

  const { toast } = useToast()
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const isValidUuid = (v: string | null | undefined) => !!v && UUID_REGEX.test(v)

  // Color options for notes
  const colorOptions = [
    { name: 'Default', value: '', class: 'bg-gray-100 border-gray-200' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-100 border-blue-200' },
    { name: 'Green', value: 'green', class: 'bg-green-100 border-green-200' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-100 border-yellow-200' },
    { name: 'Red', value: 'red', class: 'bg-red-100 border-red-200' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-100 border-purple-200' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-100 border-pink-200' },
  ]

  // Load notes when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadNotes()
    }
  }, [isOpen, projectId])

  // Filter notes based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotes(notes)
    } else {
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredNotes(filtered)
    }
  }, [notes, searchTerm])

  const loadNotes = async () => {
    if (!isValidUuid(projectId)) {
      toast({
        title: "Error",
        description: "No valid project selected. Please select a project first.",
        variant: "destructive",
      })
      onClose()
      return
    }

    try {
      setIsLoading(true)
      const loadedNotes = await noteService.getAll(projectId)
      setNotes(loadedNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedNote(null)
    resetForm()
  }

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(true)
    setIsCreating(false)
    setTitle(note.title)
    setContent(note.content)
    setTags(note.tags || [])
    setColor(note.color || '')
  }

  const handleViewNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsCreating(false)
    setTitle(note.title)
    setContent(note.content)
    setTags(note.tags || [])
    setColor(note.color || '')
  }

  const handleSaveNote = async () => {
    if (!isValidUuid(projectId)) {
      toast({
        title: "Validation Error",
        description: "No valid project selected. Please select a project first.",
        variant: "destructive",
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title for your note.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      
      if (isCreating) {
        const newNote: CreateNoteInput = {
          title: title.trim(),
          content: content.trim(),
          projectId,
          userId: '', // Will be set by service
          isPinned: false,
          tags: tags.filter(tag => tag.trim()),
          color
        }
        
        const createdNote = await noteService.create(newNote)
        setNotes(prev => [createdNote, ...prev])
        toast({
          title: "Success",
          description: "Note created successfully!",
        })
      } else if (isEditing && selectedNote) {
        const updatedNote = await noteService.update(selectedNote.id, {
          title: title.trim(),
          content: content.trim(),
          tags: tags.filter(tag => tag.trim()),
          color
        })
        
        setNotes(prev => prev.map(note => 
          note.id === selectedNote.id ? updatedNote : note
        ))
        setSelectedNote(updatedNote)
        toast({
          title: "Success",
          description: "Note updated successfully!",
        })
      }
      
      resetForm()
      setIsCreating(false)
      setIsEditing(false)
    } catch (error: any) {
      const message = error?.message || error?.error?.message || 'Failed to save note'
      console.error('Error saving note:', message, error)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      await noteService.delete(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
      
      if (selectedNote?.id === noteId) {
        resetForm()
        setSelectedNote(null)
        setIsEditing(false)
        setIsCreating(false)
      }
      
      toast({
        title: "Success",
        description: "Note deleted successfully!",
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePin = async (noteId: string) => {
    try {
      const updatedNote = await noteService.togglePin(noteId)
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ))
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote)
      }
      
      toast({
        title: "Success",
        description: updatedNote.isPinned ? "Note pinned!" : "Note unpinned!",
      })
    } catch (error) {
      console.error('Error toggling pin:', error)
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTags([])
    setColor('')
    setNewTag('')
  }

  const handleClose = () => {
    if (isCreating || isEditing) {
      if (title.trim() || content.trim()) {
        if (confirm('You have unsaved changes. Are you sure you want to close?')) {
          resetForm()
          setIsCreating(false)
          setIsEditing(false)
          setSelectedNote(null)
          onClose()
        }
      } else {
        resetForm()
        setIsCreating(false)
        setIsEditing(false)
        setSelectedNote(null)
        onClose()
      }
    } else {
      onClose()
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getColorClass = (noteColor: string) => {
    const colorOption = colorOptions.find(option => option.value === noteColor)
    return colorOption?.class || 'bg-gray-100 border-gray-200'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes - {projectName}
          </DialogTitle>
          <DialogDescription>
            Create and manage your project notes. Notes are persistent until you manually delete them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Panel - Notes List */}
          <div className="w-1/3 flex flex-col border-r border-gray-200">
            {/* Search and Create */}
            <div className="p-4 space-y-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleCreateNote}
                className="w-full"
                disabled={isCreating || isEditing}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </div>

            {/* Notes List */}
            <ScrollArea className="flex-1 p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedNote?.id === note.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : getColorClass(note.color)
                      }`}
                      onClick={() => handleViewNote(note)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {note.isPinned && <Pin className="w-3 h-3 text-red-500 flex-shrink-0" />}
                            <h3 className="font-medium text-sm truncate">{note.title}</h3>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {note.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(note.updatedAt)}</span>
                            {note.tags.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {note.tags.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Note Editor/Viewer */}
          <div className="flex-1 flex flex-col">
            {isCreating || isEditing || selectedNote ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {isCreating ? 'Create New Note' : isEditing ? 'Edit Note' : 'View Note'}
                    </h2>
                    <div className="flex items-center gap-2">
                      {selectedNote && !isCreating && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePin(selectedNote.id)}
                            disabled={isSaving}
                          >
                            {selectedNote.isPinned ? (
                              <>
                                <PinOff className="w-4 h-4 mr-1" />
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="w-4 h-4 mr-1" />
                                Pin
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditNote(selectedNote)}
                            disabled={isEditing}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteNote(selectedNote.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter note title..."
                      disabled={!isCreating && !isEditing}
                      className="mt-1"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your note here..."
                      disabled={!isCreating && !isEditing}
                      className="mt-1 min-h-[200px] resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <Label>Tags</Label>
                    <div className="mt-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag..."
                          disabled={!isCreating && !isEditing}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        {(isCreating || isEditing) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              {(isCreating || isEditing) && (
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-1 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <Label>Color</Label>
                    <div className="mt-1 flex gap-2">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => (isCreating || isEditing) && setColor(option.value)}
                          disabled={!isCreating && !isEditing}
                          className={`w-8 h-8 rounded-full border-2 ${
                            option.value === color ? 'border-gray-800' : 'border-gray-300'
                          } ${option.class} hover:scale-110 transition-transform`}
                          title={option.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Note Info */}
                  {selectedNote && !isCreating && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Created: {formatDate(selectedNote.createdAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Updated: {formatDate(selectedNote.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {(isCreating || isEditing) && (
                  <DialogFooter className="p-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setIsCreating(false)
                        setIsEditing(false)
                        setSelectedNote(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveNote}
                      disabled={isSaving || !title.trim()}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Note
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a note to view or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 