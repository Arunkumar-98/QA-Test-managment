import { projectService } from './supabase-service'
import { DEFAULT_PROJECT } from './constants'

// Cache for project name to ID mapping
const projectCache = new Map<string, string>()

export async function getProjectIdByName(projectName: string): Promise<string> {
  // Check cache first
  if (projectCache.has(projectName)) {
    return projectCache.get(projectName)!
  }

  try {
    // Get all projects
    const projects = await projectService.getAll()
    
    // Find project by name
    const project = projects.find(p => p.name === projectName)
    
    if (project) {
      // Cache the result
      projectCache.set(projectName, project.id)
      return project.id
    }
    
    // If project doesn't exist and it's the default project, create it
    if (projectName === DEFAULT_PROJECT) {
      const newProject = await projectService.create({
        name: DEFAULT_PROJECT,
        description: 'Default project for test cases'
      })
      
      // Cache the result
      projectCache.set(projectName, newProject.id)
      return newProject.id
    }
    
    // If it's not the default project and doesn't exist, throw error
    throw new Error(`Project "${projectName}" not found`)
    
  } catch (error) {
    console.error('Error getting project ID:', error)
    throw error
  }
}

export function clearProjectCache(): void {
  projectCache.clear()
} 