"use client"

import { useEffect, useState } from 'react'

type CurrentUser = {
	id?: number
	name?: string
	email?: string
	userRole?: string
} | null

export function useCurrentUser() {
	const [user, setUser] = useState<CurrentUser>(null)

	useEffect(() => {
		let mounted = true

		// First try to read a server-injected global (if the app sets it)
		const globalObj = globalThis as unknown as Record<string, unknown>
		if (globalObj && 'CURRENT_USER' in globalObj) {
			const cu = globalObj['CURRENT_USER'] as CurrentUser
			if (mounted) setUser(cu)
			return () => {
				mounted = false
			}
		}

		// Fallback: fetch current user from the auth check endpoint
		;(async () => {
			try {
				const res = await fetch('/api/auth/check')
				if (!mounted) return
				if (!res.ok) {
					setUser(null)
					return
				}
				const data = await res.json()
				setUser((data && data.user) || null)
			} catch (err) {
				if (mounted) setUser(null)
			}
		})()

		return () => {
			mounted = false
		}
	}, [])

	return { user }
}
