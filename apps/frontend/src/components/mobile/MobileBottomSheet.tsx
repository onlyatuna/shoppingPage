import { useEffect, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function MobileBottomSheet({ isOpen, onClose, title, children }: MobileBottomSheetProps) {
    const [render, setRender] = useState(isOpen);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            setIsFullscreen(false); // Reset to half-screen on open
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            // Also helpful for iOS to prevent overscroll on the body
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            // Unlock body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }

        return () => {
            // Cleanup on unmount or close
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isOpen]);




    const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const { offset, velocity } = info;
        const swipeThreshold = 50;

        // Logic based on drag direction and velocity
        // Dragging UP
        if (offset.y < -swipeThreshold || velocity.y < -300) {
            setIsFullscreen(true);
        }
        // Dragging DOWN
        else if (offset.y > swipeThreshold || velocity.y > 300) {
            if (isFullscreen) {
                setIsFullscreen(false); // Go to half screen
            } else {
                onClose(); // Close
            }
        }
        // If no significant drag, snap back to current state is handled by re-render with current state variables
    };

    if (!render) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center landscape:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
                className={`relative w-full bg-white dark:bg-[#1e1e1e] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden h-[92vh]`}
                initial={{ y: "100%" }}
                animate={{
                    y: isOpen ? (isFullscreen ? 0 : "50%") : "100%",
                }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }} // Snappy spring
                drag="y"
                dragConstraints={{ top: 0 }} // Hard stop at top, free drag down
                dragElastic={0.05} // Minimal elasticity at top edge
                dragMomentum={false} // Stop immediately on release for precise snap
                onDragEnd={onDragEnd}
            >
                {/* Handle Bar Area - Draggable */}
                <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto p-6 pb-safe"
                    // Stop drag propagation on content to allow scrolling
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </motion.div >
        </div >
    );
}
