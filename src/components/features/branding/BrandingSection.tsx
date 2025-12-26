"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Quote } from "lucide-react"

export function BrandingSection() {
    return (
        <section className="py-24 bg-secondary/30">
            <div className="container px-6 md:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <Quote className="h-8 w-8 text-primary/30 mx-auto mb-6" />
                        <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-relaxed">
                            Equilibrio, frescura y pasión en cada rollo.
                            <span className="block mt-2 text-primary">Eso es Rajma.</span>
                        </blockquote>
                    </motion.div>

                    {/* Story */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto"
                    >
                        Fusionamos la tradición japonesa con los sabores vibrantes de Sinaloa.
                        Cada platillo es una expresión de dedicación artesanal y amor por lo que hacemos.
                    </motion.p>
                </div>
            </div>
        </section>
    )
}
