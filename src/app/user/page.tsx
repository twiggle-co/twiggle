"use client"

import { useSession } from "next-auth/react"
import { LoginButton } from "@/components/auth/LoginButton"
import { HomeTopNav } from "@/components/navigation/HomeTopNav"

export default function UserPage() {
  const { data: session, status } = useSession()

  return (
    <div className="h-screen w-screen flex flex-col">
      <HomeTopNav />
      <div className="flex-1 flex items-center justify-center">
        {status === "loading" ? (
          <div>Loading...</div>
        ) : !session ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
            <LoginButton />
          </div>
        ) : (
          <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-6">User Profile</h1>
            <div className="space-y-4">
              {session.user?.image && (
                <div className="flex justify-center">
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-24 h-24 rounded-full"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg text-gray-700">{session.user?.name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg text-gray-700">{session.user?.email || "Not provided"}</p>
              </div>
              <div className="pt-4">
                <LoginButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
