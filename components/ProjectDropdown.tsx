"use client"

import React, { forwardRef } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Briefcase, ChevronDown, Settings, Share2, Trash2, Plus } from 'lucide-react'
import { Project, TestSuite } from '@/types/qa-types'
import { cn } from '@/lib/utils'

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
  fullWidth?: boolean
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
  onOpenProjectDialog,
  fullWidth = false
}, ref) => {
  return (
    <div className={cn('relative', fullWidth && 'w-full')} ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleProjectMenu}
        className={cn(
          'h-10 px-3 border-slate-300 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 dark:bg-slate-900/50 dark:border-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-all duration-200 flex items-center gap-2',
          fullWidth && 'w-full justify-between'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
          <span className="truncate text-sm font-medium">
            {currentProject || 'Select Project'}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </Button>
      
      {showProjectMenu && (
        <div className="absolute left-0 top-full z-[80] mt-2 max-h-96 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700/60 dark:bg-slate-900/95">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-200">Projects</p>
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
                  className={`w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-white/10 flex items-center space-x-3 transition-colors group cursor-pointer rounded-lg mx-2 ${
                    currentProject === project.name ? 'bg-blue-50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200' : 'text-slate-800 dark:text-white'
                  }`}
                >
                  <Briefcase className={`w-4 h-4 ${
                    currentProject === project.name ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      currentProject === project.name ? 'text-blue-800 dark:text-blue-200' : 'text-slate-900 dark:text-white'
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
                        className="p-1 hover:bg-blue-100 rounded text-blue-700 hover:text-blue-900 dark:hover:bg-blue-500/20 dark:text-blue-300 dark:hover:text-blue-200 transition-colors"
                        title="Edit Project"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onShareProject(project)
                        }}
                        className="p-1 hover:bg-emerald-100 rounded text-emerald-700 hover:text-emerald-900 dark:hover:bg-green-500/20 dark:text-green-300 dark:hover:text-green-200 transition-colors"
                        title="Share Project"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteProject(project)
                        }}
                        className="p-1 hover:bg-rose-100 rounded text-rose-700 hover:text-rose-900 dark:hover:bg-red-500/20 dark:text-red-300 dark:hover:text-red-200 transition-colors"
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
