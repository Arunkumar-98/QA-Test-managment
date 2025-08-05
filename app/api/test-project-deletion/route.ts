import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()
    
    if (!projectId) {
      return NextResponse.json({
        error: 'Project ID is required'
      }, { status: 400 })
    }

    // Delete the project
    await projectService.delete(projectId)

    // Get remaining projects
    const remainingProjects = await projectService.getAll()

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      remainingProjects: remainingProjects.length,
      isLastProject: remainingProjects.length === 0
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all projects
    const projects = await projectService.getAll()

    return NextResponse.json({
      success: true,
      projects: projects.map(p => ({ id: p.id, name: p.name })),
      totalProjects: projects.length,
      canDeleteAll: true // No restrictions on backend
    })
  } catch (error) {
    console.error('Error getting projects:', error)
    return NextResponse.json({
      error: 'Failed to get projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 