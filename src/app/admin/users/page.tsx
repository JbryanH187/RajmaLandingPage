"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { usePermissions } from "@/hooks/usePermissions"
import { Users, Shield, Search } from "lucide-react"
import { toast } from "sonner"
import { AdminShell } from "@/components/admin/AdminShell"
import { useTheme } from "@/lib/hooks/useTheme"
import { Input } from "@/components/ui/input"

export default function UsersPage() {
    const { hasPermission } = usePermissions()
    const [users, setUsers] = useState<any[]>([])
    const [roles, setRoles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const { isDark } = useTheme()

    const canManageRoles = hasPermission('roles', 'assign')
    const canManagePermissions = hasPermission('permissions', 'grant')

    useEffect(() => {
        fetchUsers()
        fetchRoles()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    roles:role_id (name)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Error al cargar usuarios')
        } finally {
            setLoading(false)
        }
    }

    const fetchRoles = async () => {
        const { data } = await supabase.from('roles').select('*')
        setRoles(data || [])
    }

    const handleRoleUpdate = async (userId: string, roleId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role_id: roleId })
                .eq('id', userId)

            if (error) throw error
            toast.success('Rol actualizado exitosamente')
            fetchUsers()
        } catch (error) {
            toast.error('Error al actualizar rol')
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Theme-aware classes
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
    const headerBg = isDark ? 'bg-zinc-800/50' : 'bg-gray-50'
    const textHead = isDark ? 'text-zinc-400' : 'text-gray-500'
    const textMain = isDark ? 'text-white' : 'text-gray-900'
    const textMuted = isDark ? 'text-zinc-500' : 'text-gray-400'
    const rowHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
    const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white border-gray-200'
    const selectBg = isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200'
    const avatarBg = isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-500'
    const badgeBg = isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-100 text-gray-600'

    return (
        <AdminShell onRefresh={fetchUsers} isRefreshing={loading}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${textMain}`}>
                            <Users className="text-red-500" />
                            Gestión de Usuarios
                        </h1>
                        <p className={textMuted}>{users.length} usuarios registrados</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 ${inputBg}`}
                    />
                </div>

                {/* Users Table */}
                <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={`border-b ${headerBg} ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                                <tr>
                                    <th className={`p-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Usuario</th>
                                    <th className={`p-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Email</th>
                                    <th className={`p-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Rol</th>
                                    <th className={`p-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-gray-100'}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className={`p-12 text-center ${textMuted}`}>
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className={`p-12 text-center ${textMuted}`}>
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className={`${rowHover} transition-colors`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarBg}`}>
                                                        {user.email?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${textMain}`}>
                                                            {user.first_name || ''} {user.last_name || ''}
                                                        </p>
                                                        {!user.first_name && !user.last_name && (
                                                            <p className={textMuted}>Sin nombre</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`p-4 ${textMuted}`}>{user.email}</td>
                                            <td className="p-4">
                                                {canManageRoles ? (
                                                    <select
                                                        value={user.role_id || ''}
                                                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                        className={`rounded-lg px-3 py-1.5 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/20 ${selectBg}`}
                                                    >
                                                        {roles.map(role => (
                                                            <option key={role.id} value={role.id}>
                                                                {role.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`px-2.5 py-1 rounded-lg text-sm ${badgeBg}`}>
                                                        {user.roles?.name || 'Sin rol'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    className={`p-2 rounded-lg transition-colors ${canManagePermissions
                                                            ? isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                                                            : 'text-gray-300 cursor-not-allowed'
                                                        }`}
                                                    title="Gestionar Permisos"
                                                    disabled={!canManagePermissions}
                                                >
                                                    <Shield size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminShell>
    )
}
