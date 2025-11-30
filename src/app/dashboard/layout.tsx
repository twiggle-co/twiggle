import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen flex bg-white">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </div>
    </div>
  )
}
