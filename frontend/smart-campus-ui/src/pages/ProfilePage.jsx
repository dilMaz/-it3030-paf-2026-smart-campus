import { motion } from 'framer-motion'
import { CalendarClock, Mail, PencilLine, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Skeleton from '../components/ui/Skeleton'
import { API_BASE_URL } from '../config/env'
import { useAuth } from '../hooks/useAuth'
import EditProfileForm from './EditProfileForm'
import { profileService } from '../services/profileService'

function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${API_BASE_URL}${imageUrl}`
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const { refreshUser } = useAuth()

  useEffect(() => {
    let active = true

    profileService.getMyProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
      })
      .catch((requestError) => {
        if (!active) return
        const message = requestError?.response?.data?.message || requestError?.response?.data?.error || 'Unable to load profile at the moment.'
        setError(message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const avatarUrl = useMemo(() => resolveImageUrl(profile?.profileImageUrl), [profile?.profileImageUrl])

  const handleProfileSaved = async (updatedProfile) => {
    setProfile(updatedProfile)
    setError('')
    try {
      await refreshUser()
    } catch {
      // Keep local profile updated even if context refresh fails.
    }
    toast.success('Profile updated.')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-52 w-full" />
        <div className="glass-panel p-6">
          <Skeleton variant="text" className="mb-3 h-6 w-56" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-700">
        {error}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="relative h-40 bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_48%,#0891b2_100%)]">
          <div className="absolute -bottom-14 left-6 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                <UserRound className="h-12 w-12" />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-16 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">{profile?.name || 'Campus User'}</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {profile?.role || 'USER'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <PencilLine className="h-4 w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <article className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">About</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {profile?.bio || 'No bio added yet. Add a short summary to help your team understand your role and responsibilities.'}
          </p>
        </article>

        <article className="glass-panel p-6">
          <h2 className="text-lg font-bold text-slate-900">Account Details</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-semibold text-slate-800">{profile?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <CalendarClock className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
                <p className="font-semibold text-slate-800">{formatDate(profile?.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <CalendarClock className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Last Updated</p>
                <p className="font-semibold text-slate-800">{formatDate(profile?.updatedAt)}</p>
              </div>
            </div>
          </div>
        </article>
      </motion.section>

      <EditProfileForm
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSaved={handleProfileSaved}
      />
    </div>
  )
}
