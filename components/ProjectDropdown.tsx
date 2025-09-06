"use client"

import React, { forwardRef } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Briefcase, ChevronDown, Settings, Share2, Trash2, Plus } from 'lucide-react'
import { Project, TestSuite } from '@/types/qa-types'

interface ProjectDropdownProps {
  currentProject: string
  projects: Project[]
  testSuites: TestSuite[]
  showProjectMenu: boolean
  onToggleProjectMenu: () => void
  onProjectChange: (projectName: string) => void
  onEditProject: (project: Project) => void
  onShareProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onOpenProjectDialog: () => void
}

export const ProjectDropdown = forwardRef<HTMLDivElement, ProjectDropdownProps>(({
  currentProject,
  projects,
  testSuites,
  showProjectMenu,
  onToggleProjectMenu,
  onProjectChange,
  onEditProject,
  onShareProject,
  onDeleteProject,
  onOpenProjectDialog
}, ref) => {
  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleProjectMenu}
        className="h-10 px-4 bg-slate-900/50 border-slate-700/60 text-slate-200 hover:bg-slate-800/70 transition-all duration-200 flex items-center space-x-2"
      >
        <Briefcase className="w-4 h-4 text-blue-300" />
        <span className="text-sm font-medium truncate max-w-40">
          {currentProject || 'Select Project'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </Button>
      
      {showProjectMenu && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/60 py-2 z-[999999999] max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Projects</p>
          </div>
          
          {projects.length > 0 ? (
            <div className="py-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    onProjectChange(project.name)
                    onToggleProjectMenu()
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors group cursor-pointer rounded-lg mx-2 ${
                    currentProject === project.name ? 'bg-blue-500/20 text-blue-200' : 'text-white'
                  }`}
                >
                  <Briefcase className={`w-4 h-4 ${
                    currentProject === project.name ? 'text-blue-300' : 'text-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      currentProject === project.name ? 'text-blue-200' : 'text-white'
                    }`}>
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {testSuites.filter(suite => suite.projectId === project.id).length} test suites
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentProject === project.name && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-300 font-medium">Active</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditProject(project)
                        }}
                        className="p-1 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-200 transition-colors"
                        title="Edit Project"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onShareProject(project)
                        }}
                        className="p-1 hover:bg-green-500/20 rounded text-green-300 hover:text-green-200 transition-colors"
                        title="Share Project"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteProject(project)
                        }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-300 hover:text-red-200 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-400 mb-3">No projects available</p>
              <Button
                onClick={() => {
                  onOpenProjectDialog()
                  onToggleProjectMenu()
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
          
          <div className="px-4 py-3 border-t border-white/10">
            <button
              onClick={() => {
                onOpenProjectDialog()
                onToggleProjectMenu()
              }}
              className="w-full px-4 py-3 text-left text-sm text-blue-300 hover:bg-blue-500/20 flex items-center space-x-3 transition-colors rounded-lg mx-2"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Create New Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

ProjectDropdown.displayName = 'ProjectDropdown'
