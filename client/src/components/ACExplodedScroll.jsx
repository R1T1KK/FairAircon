import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const ACExplodedScroll = ({ imageUrl }) => {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Animation values for splitting
  const leftMove = useTransform(scrollYProgress, [0.3, 0.6], [0, -150]);
  const rightMove = useTransform(scrollYProgress, [0.3, 0.6], [0, 150]);
  const scale = useTransform(scrollYProgress, [0.2, 0.5], [0.8, 1.1]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.3, 0.7, 0.8], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="ac-split-container">
      <motion.div 
        style={{ 
          scale, 
          opacity,
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Layer 1: Internal Components (Static Core) */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6, filter: 'grayscale(0.5) blur(1px)' }}>
           <img 
            src={imageUrl} 
            alt="AC Internal" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', clipPath: 'inset(10% 20% 10% 20%)' }} 
          />
        </div>

        {/* Layer 2: Left Shell */}
        <motion.div 
          style={{ x: leftMove, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          <img 
            src={imageUrl} 
            alt="AC Left Shell" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', clipPath: 'inset(0% 50% 0% 0%)' }} 
          />
        </motion.div>

        {/* Layer 3: Right Shell */}
        <motion.div 
          style={{ x: rightMove, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >
          <img 
            src={imageUrl} 
            alt="AC Right Shell" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', clipPath: 'inset(0% 0% 0% 50%)' }} 
          />
        </motion.div>
        
        {/* Premium Label */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          style={{ position: 'absolute', bottom: '-40px', textAlign: 'center' }}
        >
          <h3 style={{ color: '#0284c7', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.7rem' }}>Precision Engineering</h3>
          <div style={{ height: '1px', width: '80px', background: '#bae6fd', margin: '8px auto 0' }}></div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ACExplodedScroll;
