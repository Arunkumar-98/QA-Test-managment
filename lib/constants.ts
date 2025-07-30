export const STATUS_OPTIONS = ["Pending", "Pass", "Fail", "In Progress", "Blocked"] as const
export const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const
export const PLATFORM_OPTIONS = ["Web", "Mobile", "Desktop", "API", "Database"] as const
export const CATEGORY_OPTIONS = ["Functional", "Non-Functional", "Regression", "Smoke", "Integration", "Unit"] as const
export const ENVIRONMENT_OPTIONS = ["Development", "Staging", "Production", "Testing"] as const

export const COMMENT_TYPES = ["general", "bug", "question", "suggestion", "status_update"] as const

export const AUTOMATION_TYPES = ["python_selenium", "cypress", "playwright", "custom"] as const

export const RELATIONSHIP_TYPES = ["depends_on", "related_to", "blocks", "duplicate"] as const

export const DEFAULT_PROJECT = "Default Project"

export const TABLE_COLUMNS = [
  { key: "id", label: "ID", width: "w-16 min-w-[80px]" },
  { key: "testCase", label: "Test Case", width: "w-48 min-w-[200px]" },
  { key: "description", label: "Description", width: "w-64 min-w-[250px]" },
  { key: "status", label: "Status", width: "w-32 min-w-[120px]" },
  { key: "platform", label: "Platform", width: "w-24 min-w-[100px]" },
  { key: "suiteId", label: "Suite", width: "w-32 min-w-[120px]" },
  { key: "stepsToReproduce", label: "Steps to Reproduce", width: "w-56 min-w-[200px]" },
  { key: "automation", label: "Automation", width: "w-24 min-w-[100px]" },
  { key: "actions", label: "Actions", width: "w-24 min-w-[100px]" },
  { key: "automationStatus", label: "Automation", width: "w-24 min-w-[100px]" }
] as const

export const STATUS_COLORS = {
  Pending: "bg-orange-100 text-orange-800 border-orange-200",
  Pass: "bg-green-100 text-green-800 border-green-200",
  Fail: "bg-red-100 text-red-800 border-red-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Blocked: "bg-gray-100 text-gray-800 border-gray-200"
} as const

export const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Low: "bg-green-100 text-green-800 border-green-200"
} as const

export const COMMENT_TYPE_COLORS = {
  general: "bg-blue-100 text-blue-800",
  bug: "bg-red-100 text-red-800",
  question: "bg-yellow-100 text-yellow-800",
  suggestion: "bg-green-100 text-green-800",
  status_update: "bg-purple-100 text-purple-800"
} as const

export const COMMENT_TYPE_ICONS = {
  general: "MessageSquare",
  bug: "AlertTriangle",
  question: "HelpCircle",
  suggestion: "Lightbulb",
  status_update: "Activity"
} as const

export const AUTOMATION_STATUS_ICONS = {
  pass: "CheckCircle",
  fail: "XCircle",
  running: "Loader2",
  not_run: "Circle"
} as const

export const AUTOMATION_STATUS_COLORS = {
  pass: "text-green-600",
  fail: "text-red-600",
  running: "text-blue-600",
  not_run: "text-gray-400"
} as const

export const STATUS_ICONS = {
  Pending: "Clock",
  Pass: "CheckCircle",
  Fail: "XCircle",
  "In Progress": "Loader2",
  Blocked: "Ban"
} as const

export const PRIORITY_ICONS = {
  High: "AlertTriangle",
  Medium: "Minus",
  Low: "ArrowDown"
} as const 