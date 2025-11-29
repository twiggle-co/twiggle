"use client"

import Link from "next/link"

interface ProjectCardProps {
  id: string
  title: string
  description: string | null
  updatedAt: string
}

/**
 * Format date to relative time string
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`
}

/**
 * Project card component
 * Displays project preview and metadata
 */
export function ProjectCard({ id, title, description, updatedAt }: ProjectCardProps) {
  return (
    <Link
      href={`/leaflet/${id}`}
      className="group block bg-white rounded-lg border border-gray-200 hover:border-[#7BA4F4] hover:shadow-md transition-all overflow-hidden"
    >
      {/* Preview Area */}
      <div className="h-40 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-br from-[#7BA4F4]/20 to-[#C9D9F8]/40 flex items-center justify-center">
            <div className="w-24 h-16 bg-white rounded border border-gray-200 shadow-sm flex items-center justify-center">
              <div className="w-12 h-8 bg-[#7BA4F4] rounded"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 group-hover:text-[#7BA4F4] transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="h-6 w-6 bg-[#7BA4F4] rounded-full flex items-center justify-center flex-shrink-0 ml-2">
            <div className="h-2 w-2 bg-white rounded-full"></div>
          </div>
        </div>
        <p className="text-xs text-gray-500">Edited {formatRelativeTime(updatedAt)}</p>
      </div>
    </Link>
  )
}
