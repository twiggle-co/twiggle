import { DashboardTopNav } from "@/components/navigation/DashboardTopNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen flex flex-col">
      <DashboardTopNav />
      {children}
    </div>
  )
}

