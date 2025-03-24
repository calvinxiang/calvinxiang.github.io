import React, { useState, useEffect, useCallback, useRef } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onStop: () => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);

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
      // Store the touch identifier
      touchIdRef.current = e.touches[0].identifier;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setOrigin({ x: centerX, y: centerY });
    setPosition({ x: clientX, y: clientY });
    
    // Stop propagation to prevent camera rotation while using joystick
    e.stopPropagation();
  }, []);

  // Reference to keep track of the active touch ID
  const touchIdRef = useRef<number | null>(null);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!active) return;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Find our touch point
      const touchPoint = Array.from(e.touches).find(
        touch => touch.identifier === touchIdRef.current
      );
      
      // If we lost our touch point, exit
      if (!touchPoint) return;
      
      clientX = touchPoint.clientX;
      clientY = touchPoint.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setPosition({ x: clientX, y: clientY });
    
    // Calculate joystick movement
    const deltaX = clientX - origin.x;
    const deltaY = clientY - origin.y;
    
    // Limit to a circle with radius of 60px (increased from 50px)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 60;
    
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
    
    // Only prevent default if it's our touch point
    if ('touches' in e && touchIdRef.current !== null) {
      // We'll only prevent default for this particular touch event
      // This allows other touch events (like camera control) to still work
      e.preventDefault();
    }
  }, [active, origin, onMove]);

  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    // For touch events, check if our specific touch ended
    if ('changedTouches' in e) {
      const touchEnded = Array.from(e.changedTouches).some(
        touch => touch.identifier === touchIdRef.current
      );
      
      // If it wasn't our touch, ignore
      if (!touchEnded) return;
      
      // Reset touch ID
      touchIdRef.current = null;
    }
    
    setActive(false);
    onStop();
  }, [onStop]);

  useEffect(() => {
    // Only add event listeners if we're on mobile and the component is mounted
    if (isMobile && joystickRef.current) {
      const joystickElement = joystickRef.current;
      
      // Add touch event listeners directly to joystick element
      joystickElement.addEventListener('touchmove', handleMove, { passive: false });
      joystickElement.addEventListener('touchend', handleEnd);
      joystickElement.addEventListener('touchcancel', handleEnd);
      
      return () => {
        joystickElement.removeEventListener('touchmove', handleMove);
        joystickElement.removeEventListener('touchend', handleEnd);
        joystickElement.removeEventListener('touchcancel', handleEnd);
      };
    } else if (!isMobile) {
      // For non-mobile, we need document-wide listeners for mouse
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
      };
    }
    
    // Return empty cleanup if no listeners were added
    return () => {};
  }, [isMobile, handleMove, handleEnd, joystickRef]);

  if (!isMobile) return null;

  const knobStyle = {
    transform: active
      ? `translate(${Math.min(Math.max(position.x - origin.x, -60), 60)}px, ${Math.min(Math.max(position.y - origin.y, -60), 60)}px)`
      : 'translate(0, 0)',
  };

  return (
    <div 
      className="joystick-container"
      ref={joystickRef}
    >
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