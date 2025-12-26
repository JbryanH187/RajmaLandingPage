"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, MapPin, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Hero() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [statusText, setStatusText] = React.useState("Cerrado")

    React.useEffect(() => {
        const checkStatus = () => {
            const now = new Date();
            const day = now.getDay();
            const hour = now.getHours();
            const mins = now.getMinutes();
            const currentTime = hour + mins / 60;

            const openTime = 15;
            const closeTime = 23;
            const warningTime = 22.5;

            if (day >= 1 && day <= 5) {
                if (currentTime >= openTime && currentTime < closeTime) {
                    setIsOpen(true);
                    setStatusText(currentTime >= warningTime ? "Cierra pronto" : "Abierto");
                } else {
                    setIsOpen(false);
                    setStatusText(currentTime < openTime ? "Abre 3:00 PM" : "Cerrado");
                }
            } else {
                setIsOpen(false);
                setStatusText("Cerrado");
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const [currentSlide, setCurrentSlide] = React.useState(0)

    // Mock Images - Replace these with real files in public/
    // e.g. ["/sushi-1.jpg", "/lifestyle.jpg", "/hero-image.jpg"]
    const slides = [
        "/hero-image.jpg",
        "/hero-image.jpg", // Duplicated for demo - add real photos
        "/hero-image.jpg"
    ]

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const scrollToMenu = () => {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="w-full bg-background pt-32 pb-12 flex flex-col items-center">
            {/* 1. Minimal Header (Centering Enforcement) */}
            <div className="text-center space-y-6 max-w-3xl px-6 mb-16 z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/30 text-xs font-medium tracking-wide uppercase text-muted-foreground"
                >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-green-500" : "bg-red-500")} />
                    {statusText}
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-6xl md:text-8xl font-serif text-foreground tracking-tight leading-[0.9] text-center"
                >
                    Rajma <span className="text-primary italic">Sushi</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed text-center"
                >
                    Fusión japonesa con el alma de Sinaloa.
                    <br />
                    Ingredientes frescos, sabor auténtico.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        onClick={scrollToMenu}
                        size="lg"
                        className="rounded-full px-8 py-6 text-lg bg-foreground text-background hover:bg-foreground/90 transition-all font-serif"
                    >
                        Ver Menú
                    </Button>
                </motion.div>
            </div>

            {/* 2. Carousel Container */}
            <div className="relative w-full max-w-[95%] md:max-w-6xl mx-auto h-[60vh] rounded-3xl overflow-hidden shadow-2xl bg-secondary/20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={slides[currentSlide]}
                            alt={`Rajma Lifestyle ${currentSlide + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 90vw"
                            priority={currentSlide === 0}
                        />
                        {/* Vignette Overlay */}
                        <div className="absolute inset-0 bg-black/10 transition-opacity duration-1000" />
                    </motion.div>
                </AnimatePresence>

                {/* Carousel Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                idx === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                            )}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
