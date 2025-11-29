"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Button disabled>
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {/* <span className="text-sm text-gray-600">
          {session.user?.name || session.user?.email}
        </span> */}
        <Button onClick={() => signOut({ callbackUrl: "/" })} variant="outline">
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
      <Button 
        onClick={() => signIn("credentials", {
          username: "admin",
          password: "123456",
          callbackUrl: "/dashboard"
        })}
        variant="outline"
      >
        Test Login (Admin)
      </Button>
    </div>
  )
}

