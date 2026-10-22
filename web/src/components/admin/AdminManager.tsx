"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, UserPlus, Edit2, Trash2, Mail, Lock, User, Search, X, ShieldAlert } from "lucide-react"
import { Profile } from "@/types/database"

interface AdminManagerProps {
  initialAdmins: Profile[]
  currentUserId: string
}

export default function AdminManager({
  initialAdmins,
  currentUserId,
}: AdminManagerProps) {
  const router = useRouter()
  const [admins, setAdmins] = useState<Profile[]>(initialAdmins)
  const [searchTerm, setSearchTerm] = useState("")

  // Create Admin Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Admin Modal State
  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null)
  const [editName, setEditName] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Filter admins
  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 1. Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create administrator.")
      }

      setAdmins((prev) => [data.admin, ...prev])
      setIsCreateOpen(false)
      setCreateName("")
      setCreateEmail("")
      setCreatePassword("")
      router.refresh()
    } catch (err: any) {
      setCreateError(err.message || "Failed to create administrator account.")
    } finally {
      setIsCreating(false)
    }
  }

  // 2. Open Edit Modal (prevent editing super admin)
  const openEditModal = (admin: Profile) => {
    if (admin.role === "super_admin") {
      alert("Super Admin account is protected and cannot be edited.")
      return
    }
    setEditingAdmin(admin)
    setEditName(admin.name)
    setEditPassword("")
    setEditError(null)
  }

  // 3. Update Admin
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    setIsEditing(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          password: editPassword.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update administrator.")
      }

      setAdmins((prev) =>
        prev.map((a) => (a.id === editingAdmin.id ? { ...a, name: editName } : a))
      )
      setEditingAdmin(null)
      router.refresh()
    } catch (err: any) {
      setEditError(err.message || "Failed to update administrator.")
    } finally {
      setIsEditing(false)
    }
  }

  // 4. Delete Admin
  const handleDeleteAdmin = async (admin: Profile) => {
    if (admin.role === "super_admin") {
      alert("Super Admin account is permanently protected and cannot be deleted.")
      return
    }

    if (!confirm(`Are you sure you want to permanently delete administrator "${admin.name}" (${admin.email})?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete administrator.")
      }

      setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to delete administrator.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Administrator Management</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Super Admin exclusive portal: create, edit, or remove staff administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search admins by name or email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 shadow-2xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 self-end sm:self-auto">
          {filteredAdmins.length} {filteredAdmins.length === 1 ? "Admin Account" : "Admin Accounts"}
        </span>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((a) => {
                  const isSuper = a.role === "super_admin"
                  return (
                    <tr key={a.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-stone-900 flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                            isSuper
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{a.name}</span>
                          {a.id === currentUserId && (
                            <span className="text-[10px] text-stone-400 font-normal">(You)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          {a.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuper
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isSuper ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 font-mono text-[11px]">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuper ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-semibold">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>Protected Super Admin</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(a)}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                              title="Edit Admin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(a)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-stone-400">
                    No administrators found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CREATE ADMIN MODAL                                       */}
      {/* ======================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Create Administrator</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Admin Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Admin Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                    placeholder="sarah.admin@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Initial Password (min 6 characters)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isCreating ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT ADMIN MODAL                                         */}
      {/* ======================================================== */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-stone-700" />
                <span>Edit Administrator</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={editingAdmin.email}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Admin Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">
                  Reset Password <span className="text-stone-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                  placeholder="New password (optional)"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
