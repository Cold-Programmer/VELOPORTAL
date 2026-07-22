import { motion } from 'motion/react';

// Shared spring easing — matches the CSS custom property --ease-spring in
// index.css so scroll-triggered motion animations feel identical to the
// hover/tap transitions defined in CSS elsewhere in the app.
const SPRING_EASE = [0.16, 1, 0.3, 1];

const VARIANTS = {
  up:    { hidden: { opacity: 0, y: 28 },  visible: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -28 }, visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -28 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 28 },  visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1 } },
};

/**
 * Wraps children in a scroll-triggered reveal animation, powered by Motion.
 * direction: 'up' (default) | 'down' | 'left' | 'right' | 'scale'
 * delay: seconds (number), e.g. 0.1
 */
export default function Reveal({ children, direction = 'up', delay = 0, className = '' }) {
  const variant = VARIANTS[direction] || VARIANTS.up;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variant}
      transition={{ duration: 0.6, delay, ease: SPRING_EASE }}
    >
      {children}
    </motion.div>
  );
}
