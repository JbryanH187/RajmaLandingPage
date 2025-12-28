import { MapPin, Phone, Clock } from "lucide-react"

export function Footer() {
    return (
        <footer className="py-20 bg-foreground text-background">
            <div className="container px-6 md:px-8">
                {/* Main Content - Centered */}
                <div className="text-center mb-16">
                    <h3 className="text-3xl md:text-4xl font-bold mb-4">Rajma</h3>
                    <p className="text-background/60 max-w-md mx-auto">
                        Fusión japonesa con el corazón de Sinaloa.
                    </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-center mb-16">
                    {/* Hours */}
                    <div className="space-y-2">
                        <Clock className="h-5 w-5 mx-auto text-background/40" />
                        <p className="font-medium">Lunes - Viernes</p>
                        <p className="text-background/60">3:00 PM - 11:00 PM</p>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <MapPin className="h-5 w-5 mx-auto text-background/40" />
                        <p className="font-medium">Manuel Altamirano 258</p>
                        <p className="text-background/60">Las Cupias, Villa Juárez, Sin.</p>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                        <Phone className="h-5 w-5 mx-auto text-background/40" />
                        <p className="font-medium">Contáctanos</p>
                        <a
                            href="tel:6672733603"
                            className="text-background/60 hover:text-background transition-colors"
                        >
                            667 273 3603
                        </a>
                    </div>
                </div>

                {/* Google Maps - Minimal + Directions Link */}
                <div className="relative group w-full h-[400px] mb-16 grayscale hover:grayscale-0 transition-all duration-700 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    <iframe
                        src="https://maps.google.com/maps?q=24.658070998953598,-107.53876305546336&hl=es&z=14&output=embed"
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ubicación Rajma Sushi"
                    />

                    {/* Directions Overlay Button */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=24.658070998953598,-107.53876305546336"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        >
                            <MapPin className="h-4 w-4" />
                            Cómo llegar
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center text-sm text-background/40 pt-8 border-t border-background/10">
                    © {new Date().getFullYear()} Rajma Sushi. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    )
}
