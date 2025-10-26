import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface PizzaBodyDoubleProps {
  isTalking?: boolean;
  message?: string;
}

export default function PizzaBodyDouble({ isTalking = false, message }: PizzaBodyDoubleProps) {
  const [blinkLeft, setBlinkLeft] = useState(false);
  const [blinkRight, setBlinkRight] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setBlinkLeft(true);
        setBlinkRight(true);
        setTimeout(() => {
          setBlinkLeft(false);
          setBlinkRight(false);
        }, 150);
      }
    }, 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Talking animation
  useEffect(() => {
    if (isTalking) {
      const talkInterval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 200);

      return () => clearInterval(talkInterval);
    } else {
      setMouthOpen(false);
    }
  }, [isTalking]);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Pizza Body Double */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        }}
        className="relative"
        style={{ width: '280px', height: '280px' }}
      >
        {/* Pizza Slice SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))' }}
        >
          {/* Pizza crust (outer edge) */}
          <path
            d="M 100 30 L 180 170 Q 100 180 20 170 Z"
            fill="#F7A64B"
            stroke="#C88A3D"
            strokeWidth="3"
          />
          
          {/* Pizza sauce/cheese */}
          <path
            d="M 100 40 L 170 160 Q 100 168 30 160 Z"
            fill="#FFD4A3"
          />

          {/* Pepperoni 1 */}
          <circle cx="80" cy="90" r="12" fill="#D84315" />
          <circle cx="80" cy="90" r="10" fill="#E64A19" />
          
          {/* Pepperoni 2 */}
          <circle cx="120" cy="100" r="12" fill="#D84315" />
          <circle cx="120" cy="100" r="10" fill="#E64A19" />
          
          {/* Pepperoni 3 */}
          <circle cx="100" cy="130" r="12" fill="#D84315" />
          <circle cx="100" cy="130" r="10" fill="#E64A19" />

          {/* Cheese highlights */}
          <ellipse cx="70" cy="120" rx="8" ry="5" fill="#FFF9F4" opacity="0.7" />
          <ellipse cx="130" cy="130" rx="8" ry="5" fill="#FFF9F4" opacity="0.7" />
          <ellipse cx="100" cy="75" rx="6" ry="4" fill="#FFF9F4" opacity="0.7" />

          {/* Eyes */}
          {/* Left Eye */}
          <motion.g
            animate={{
              scaleY: blinkLeft ? 0.1 : 1,
            }}
            transition={{ duration: 0.1 }}
          >
            <ellipse cx="80" cy="90" rx="14" ry="16" fill="white" stroke="#2D2D2D" strokeWidth="2" />
            <circle cx="82" cy="92" r="8" fill="#2D2D2D" />
            <circle cx="84" cy="90" r="4" fill="white" />
          </motion.g>

          {/* Right Eye */}
          <motion.g
            animate={{
              scaleY: blinkRight ? 0.1 : 1,
            }}
            transition={{ duration: 0.1 }}
          >
            <ellipse cx="120" cy="100" rx="14" ry="16" fill="white" stroke="#2D2D2D" strokeWidth="2" />
            <circle cx="122" cy="102" r="8" fill="#2D2D2D" />
            <circle cx="124" cy="100" r="4" fill="white" />
          </motion.g>

          {/* Mouth */}
          <motion.g
            animate={{
              y: mouthOpen ? 3 : 0,
            }}
            transition={{ duration: 0.1 }}
          >
            {mouthOpen ? (
              <>
                {/* Open mouth */}
                <ellipse cx="100" cy="130" rx="18" ry="14" fill="#8B5E3C" stroke="#2D2D2D" strokeWidth="2" />
                <ellipse cx="100" cy="127" rx="12" ry="8" fill="#2D2D2D" />
              </>
            ) : (
              <>
                {/* Closed/Smile */}
                <path
                  d="M 85 130 Q 100 140 115 130"
                  fill="none"
                  stroke="#2D2D2D"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            )}
          </motion.g>

          {/* Rosy Cheeks */}
          <circle cx="60" cy="105" r="8" fill="#FFB5A0" opacity="0.6" />
          <circle cx="140" cy="115" r="8" fill="#FFB5A0" opacity="0.6" />
        </svg>

        {/* Speech Bubble */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-24 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl whitespace-nowrap"
            style={{
              background: '#FFF9F4',
              border: '3px solid #F7A64B',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              maxWidth: '400px',
            }}
          >
            <p
              style={{
                fontFamily: 'Lexend Deca, sans-serif',
                color: '#2D2D2D',
                fontSize: '0.95rem',
              }}
            >
              {message}
            </p>
            {/* Speech bubble tail */}
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '16px solid #F7A64B',
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
