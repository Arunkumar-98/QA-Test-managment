import { CustomColumn } from '@/types/qa-types'
import { customColumnService } from '@/lib/supabase-service'

export class DynamicColumnService {
  static async createColumns(columns: CustomColumn[]): Promise<CustomColumn[]> {
    if (columns.length === 0) return []
    const created: CustomColumn[] = []
    for (const column of columns) {
      created.push(await customColumnService.create(column))
    }
    return created
  }

  static async getProjectColumns(projectId: string): Promise<CustomColumn[]> {
    try {
      return await customColumnService.getAll(projectId)
    } catch (error) {
      console.error('Failed to get project columns:', error)
      return []
    }
  }

  static async createColumn(column: Omit<CustomColumn, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomColumn> {
    return customColumnService.create(column)
  }

  static async updateColumn(id: string, updates: Partial<CustomColumn>): Promise<CustomColumn> {
    return customColumnService.update(id, updates)
  }

  static async deleteColumn(id: string): Promise<void> {
    await customColumnService.delete(id)
  }

  static async columnExists(projectId: string, name: string): Promise<boolean> {
    const columns = await customColumnService.getAll(projectId)
    return columns.some((column) => column.name === name)
  }

  static async getColumnNames(projectId: string): Promise<string[]> {
    const columns = await this.getProjectColumns(projectId)
    return columns.map((column) => column.name)
  }
}
