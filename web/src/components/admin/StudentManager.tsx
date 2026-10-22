"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, UserPlus, Edit2, Trash2, Mail, Lock, User, Search, X } from "lucide-react"
import { Profile } from "@/types/database"

interface StudentManagerProps {
  initialStudents: Profile[]
  currentUserRole: string
}

export default function StudentManager({
  initialStudents,
  currentUserRole,
}: StudentManagerProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Profile[]>(initialStudents)
  const [searchTerm, setSearchTerm] = useState("")

  // Create Student Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null)
  const [editName, setEditName] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Filter students based on search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 1. Handle Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const res = await fetch("/api/admin/students", {
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
        throw new Error(data.error || "Failed to create student.")
      }

      setStudents((prev) => [data.student, ...prev])
      setIsCreateOpen(false)
      setCreateName("")
      setCreateEmail("")
      setCreatePassword("")
      router.refresh()
    } catch (err: any) {
      setCreateError(err.message || "Failed to create student account.")
    } finally {
      setIsCreating(false)
    }
  }

  // 2. Open Edit Modal
  const openEditModal = (student: Profile) => {
    setEditingStudent(student)
    setEditName(student.name)
    setEditPassword("")
    setEditError(null)
  }

  // 3. Handle Update Student
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    setIsEditing(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          password: editPassword.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update student.")
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? { ...s, name: editName } : s))
      )
      setEditingStudent(null)
      router.refresh()
    } catch (err: any) {
      setEditError(err.message || "Failed to update student.")
    } finally {
      setIsEditing(false)
    }
  }

  // 4. Handle Delete Student
  const handleDeleteStudent = async (student: Profile) => {
    if (!confirm(`Are you sure you want to permanently delete student "${student.name}" (${student.email})?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete student.")
      }

      setStudents((prev) => prev.filter((s) => s.id !== student.id))
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to delete student.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Student Management</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Create new student accounts, edit details, reset passwords, or remove students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 shadow-2xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 self-end sm:self-auto">
          {filteredStudents.length} {filteredStudents.length === 1 ? "Student" : "Students"}
        </span>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {s.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
                        Student
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 font-mono text-[11px]">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-stone-400">
                    No students match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CREATE STUDENT MODAL                                     */}
      {/* ======================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-600" />
                <span>Add New Student</span>
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

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                    placeholder="rahul@example.com"
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
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isCreating ? "Creating..." : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT STUDENT MODAL                                       */}
      {/* ======================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-stone-700" />
                <span>Edit Student Profile</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
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

            <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={editingStudent.email}
                  disabled
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-700">Full Name</label>
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
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
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
