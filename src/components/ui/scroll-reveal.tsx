"use client"

import * as React from "react"
import { motion, useInView, useAnimation, Variant } from "framer-motion"

interface ScrollRevealProps {
    children: React.ReactNode
    width?: "fit-content" | "100%"
    className?: string
    delay?: number
    mode?: "fade-up" | "reveal" | "scale"
}

export function ScrollReveal({
    children,
    width = "fit-content",
    className,
    delay = 0,
    mode = "fade-up"
}: ScrollRevealProps) {
    const ref = React.useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" })
    const mainControls = useAnimation()

    React.useEffect(() => {
        if (isInView) {
            mainControls.start("visible")
        }
    }, [isInView, mainControls])

    const variants: Record<string, { hidden: Variant, visible: Variant }> = {
        "fade-up": {
            hidden: { opacity: 0, y: 40 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: delay }
            }
        },
        "scale": {
            hidden: { opacity: 0, scale: 0.95 },
            visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: delay }
            }
        },
        "reveal": {
            hidden: { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
            visible: {
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: delay }
            }
        }
    }

    return (
        <div ref={ref} style={{ width }} className={className}>
            <motion.div
                variants={variants[mode]}
                initial="hidden"
                animate={mainControls}
            >
                {children}
            </motion.div>
        </div>
    )
}
