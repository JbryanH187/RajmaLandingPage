
export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido al panel de administración de Rajma Sushi.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats functionality coming soon */}
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase">Ventas Hoy</h3>
                    <p className="text-2xl font-bold mt-2">$0.00</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase">Pedidos Activos</h3>
                    <p className="text-2xl font-bold mt-2">0</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase">Platillos</h3>
                    <p className="text-2xl font-bold mt-2">--</p>
                </div>
            </div>
        </div>
    )
}
