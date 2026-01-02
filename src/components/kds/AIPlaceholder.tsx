"use client"

import { useState } from 'react'
import { X, Sparkles, BrainCircuit, Construction } from 'lucide-react'

interface AIPlaceholderProps {
    isOpen: boolean
    onClose: () => void
    title?: string
}

export function AIPlaceholder({ isOpen, onClose, title = "Función IA" }: AIPlaceholderProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300
                bg-[#09090b] border border-zinc-800">

                {/* Header con gradiente IA */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles size={20} className="animate-pulse" />
                        <h3 className="font-bold text-lg">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                        <BrainCircuit size={64} className="text-purple-500" />
                        <Construction size={24} className="absolute -bottom-1 -right-1 text-yellow-500" />
                    </div>

                    <h4 className="text-xl font-bold text-white mb-2">
                        🚧 En Construcción
                    </h4>

                    <p className="text-zinc-400 text-sm max-w-xs">
                        Las funciones de Inteligencia Artificial estarán disponibles en una próxima actualización.
                    </p>

                    <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-800">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">Powered by Gemini AI</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    )
}
