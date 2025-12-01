"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <Button disabled>Loading...</Button>
  }

  if (session) {
    return (
      <Button onClick={() => signOut({ callbackUrl: "/" })} variant="outline">
        Sign out
      </Button>
    )
  }

  return (
    <Button onClick={() => signIn("google")}>
      Sign in with Google
    </Button>
  )
}
