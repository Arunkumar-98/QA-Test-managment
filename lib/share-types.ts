import type { DynamicColumn, DynamicRow } from '@/lib/google-sheets-service'

export type ShareKind = 'project' | 'list'
export type ShareRole = 'view' | 'edit' | 'full'

export type SharePermissions = {
  canView: boolean
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  canExport: boolean
}

export type SharedList = {
  id: string
  name: string
  kind: 'suite' | 'bugs'
}

export type SharedRow = DynamicRow & {
  suiteId?: string
}

export type ShareRecord = {
  token: string
  kind: ShareKind
  title: string
  projectId: string
  projectName: string
  suiteId?: string
  role: ShareRole
  permissions: SharePermissions
  createdBy: string
  createdAt: string
  updatedAt: string
  revoked: boolean
  allowedEmails: string[]
  columns: DynamicColumn[]
  lists: SharedList[]
  rows: SharedRow[]
}

export type CreateShareInput = {
  kind: ShareKind
  title: string
  projectId: string
  projectName: string
  suiteId?: string
  role: ShareRole
  createdBy: string
  allowedEmails?: string[]
  columns: DynamicColumn[]
  lists: SharedList[]
  rows: SharedRow[]
  senderName?: string
  senderEmail?: string
}

export type PublicShare = Omit<ShareRecord, 'createdBy'> & {
  isOwner?: boolean
  createdBy?: string
}
