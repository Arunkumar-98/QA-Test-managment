import { supabase } from './supabase'
import { DEFAULT_PROJECT } from './constants'

// Cache for project name to ID mapping
const projectCache = new Map<string, string>()

export async function getProjectIdByName(projectName: string): Promise<string> {
  // Check cache first
  if (projectCache.has(projectName)) {
    return projectCache.get(projectName)!
  }

  try {
    // Get all projects directly from Supabase
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Find project by name
    const project = projects?.find((p: any) => p.name === projectName)
    
    if (project) {
      // Cache the result
      projectCache.set(projectName, project.id)
      return project.id
    }
    
    // If project doesn't exist and it's the default project, create it
    if (projectName === DEFAULT_PROJECT) {
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert([{
          name: DEFAULT_PROJECT,
          description: 'Default project for test cases',
          created_at: new Date(),
          is_active: true
        }])
        .select()
        .single()
      
      if (createError) throw createError
      
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