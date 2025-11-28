import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen flex bg-[#C9D9F8]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

