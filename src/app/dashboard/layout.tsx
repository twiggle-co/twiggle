// import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar"
import { DashboardTopNav } from "@/components/navigation/DashboardTopNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      <DashboardTopNav />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </div>
      {/* <DashboardSidebar /> */}
    </div>
  )
}
