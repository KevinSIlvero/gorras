import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Position } from '../types';

interface BubbleProps {
  position: Position;
  size: number;
  onClick: () => void;
  isVisible: boolean;
}

export const Bubble: React.FC<BubbleProps> = ({ position, size, onClick, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.1, type: "spring", stiffness: 300 }}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: size,
            height: size,
            // Use pointer cursor for standard mouse mode, crosshair is global
            cursor: 'pointer', 
          }}
          className="rounded-full border-2 border-white bg-white/10 hover:bg-white/20 active:bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)] touch-manipulation"
          onMouseDown={(e) => {
            // Stop propagation so the background "Miss" click doesn't fire immediately
            // if we are in standard pointer mode.
            e.stopPropagation();
            onClick();
          }}
          onTouchStart={(e) => {
             e.stopPropagation();
             // Prevent default to stop potential double-firing with mouse events on some hybrids, 
             // though strictly onTouchStart is enough for mobile.
             onClick();
          }}
          // Prevent drag behavior
          onDragStart={(e) => e.preventDefault()}
        />
      )}
    </AnimatePresence>
  );
};