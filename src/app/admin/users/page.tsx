"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { usePermissions } from "@/hooks/usePermissions"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Users, Shield, Edit2, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"

export default function UsersPage() {
    return (
        <ProtectedRoute module="users">
            <UsersContent />
        </ProtectedRoute>
    )
}

function UsersContent() {
    const { hasPermission, permissions } = usePermissions()
    const [users, setUsers] = useState<any[]>([])
    const [roles, setRoles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Check permissions
    const canManageRoles = hasPermission('roles', 'assign')
    const canManagePermissions = hasPermission('permissions', 'grant')

    useEffect(() => {
        fetchUsers()
        fetchRoles()
    }, [])

    const fetchUsers = async () => {
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

    if (loading) return <div className="p-8 text-center">Cargando usuarios...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Users className="text-red-600" />
                    Gestión de Usuarios
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Usuario</th>
                                <th className="p-4 font-semibold text-gray-600">Email</th>
                                <th className="p-4 font-semibold text-gray-600">Rol</th>
                                <th className="p-4 font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                {user.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500">{user.email}</td>
                                    <td className="p-4">
                                        {canManageRoles ? (
                                            <select
                                                value={user.role_id || ''}
                                                onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">
                                                {user.roles?.name || 'Sin rol'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Gestionar Permisos"
                                            disabled={!canManagePermissions}
                                        >
                                            <Shield size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
