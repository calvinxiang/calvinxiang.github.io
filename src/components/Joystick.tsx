import React, { useState, useEffect, useCallback } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onStop: () => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setActive(true);
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setOrigin({ x: centerX, y: centerY });
    setPosition({ x: clientX, y: clientY });
  }, []);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!active) return;
    
    e.preventDefault();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setPosition({ x: clientX, y: clientY });
    
    // Calculate joystick movement
    const deltaX = clientX - origin.x;
    const deltaY = clientY - origin.y;
    
    // Limit to a circle with radius of 50px
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 50;
    
    let normX = deltaX;
    let normY = deltaY;
    
    if (distance > maxDistance) {
      normX = (deltaX / distance) * maxDistance;
      normY = (deltaY / distance) * maxDistance;
    }
    
    // Normalize to -1 to 1 range
    const normalizedX = normX / maxDistance;
    const normalizedY = normY / maxDistance;
    
    onMove(normalizedX, normalizedY);
  }, [active, origin, onMove]);

  const handleEnd = useCallback(() => {
    setActive(false);
    onStop();
  }, [onStop]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
      return () => {
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);
      };
    } else {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
      };
    }
  }, [isMobile, handleMove, handleEnd]);

  if (!isMobile) return null;

  const knobStyle = {
    transform: active
      ? `translate(${Math.min(Math.max(position.x - origin.x, -50), 50)}px, ${Math.min(Math.max(position.y - origin.y, -50), 50)}px)`
      : 'translate(0, 0)',
  };

  return (
    <div className="joystick-container">
      <div 
        className="joystick-base"
        onTouchStart={handleStart}
        onMouseDown={handleStart}
      >
        <div 
          className="joystick-knob" 
          style={knobStyle}
        />
      </div>
    </div>
  );
};

export default Joystick; 