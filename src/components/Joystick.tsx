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
  const baseRef = useRef<HTMLDivElement>(null);
  
  // Reference to keep track of the active touch ID
  const touchIdRef = useRef<number | null>(null);

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
    // Completely stop event propagation to prevent camera movement
    e.stopPropagation();
    e.preventDefault();
    
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

    const rect = baseRef.current?.getBoundingClientRect() || 
                (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setOrigin({ x: centerX, y: centerY });
    setPosition({ x: clientX, y: clientY });
  }, []);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!active) return;
    
    // Always prevent default and stop propagation for the joystick move
    e.preventDefault();
    e.stopPropagation();
    
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
  }, [active, origin, onMove]);

  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    // Stop propagation to prevent camera movement
    e.stopPropagation();
    
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

  // Use a separate function to handle touch cancellation
  const handleCancel = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    
    touchIdRef.current = null;
    setActive(false);
    onStop();
  }, [onStop]);

  useEffect(() => {
    if (!isMobile || !joystickRef.current || !baseRef.current) return;
    
    const joystickElement = joystickRef.current;
    const baseElement = baseRef.current;
    
    // Use a more focused approach: only add listeners to the joystick base element
    const touchStartHandler = (e: TouchEvent) => {
      // Prevent the event from reaching the canvas
      e.stopPropagation();
      e.preventDefault();
      
      const rect = baseElement.getBoundingClientRect();
      const touch = e.touches[0];
      
      // Only process touches that start inside the joystick
      if (
        touch.clientX >= rect.left && 
        touch.clientX <= rect.right && 
        touch.clientY >= rect.top && 
        touch.clientY <= rect.bottom
      ) {
        touchIdRef.current = touch.identifier;
        setActive(true);
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        setOrigin({ x: centerX, y: centerY });
        setPosition({ x: touch.clientX, y: touch.clientY });
      }
    };
    
    // Handle touch move events
    const touchMoveHandler = (e: TouchEvent) => {
      if (!active || touchIdRef.current === null) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Find our specific touch
      const touchPoint = Array.from(e.touches).find(
        touch => touch.identifier === touchIdRef.current
      );
      
      if (!touchPoint) return;
      
      setPosition({ x: touchPoint.clientX, y: touchPoint.clientY });
      
      // Calculate movement
      const deltaX = touchPoint.clientX - origin.x;
      const deltaY = touchPoint.clientY - origin.y;
      
      // Limit distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 60;
      
      let normX = deltaX;
      let normY = deltaY;
      
      if (distance > maxDistance) {
        normX = (deltaX / distance) * maxDistance;
        normY = (deltaY / distance) * maxDistance;
      }
      
      // Normalize and send
      onMove(normX / maxDistance, normY / maxDistance);
    };
    
    // Handle touch end
    const touchEndHandler = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      
      e.stopPropagation();
      
      const touchEnded = Array.from(e.changedTouches).some(
        touch => touch.identifier === touchIdRef.current
      );
      
      if (touchEnded) {
        touchIdRef.current = null;
        setActive(false);
        onStop();
      }
    };
    
    // Add event listeners to the base element specifically
    baseElement.addEventListener('touchstart', touchStartHandler, { passive: false });
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);
    document.addEventListener('touchcancel', handleCancel);
    
    return () => {
      baseElement.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('touchend', touchEndHandler);
      document.removeEventListener('touchcancel', handleCancel);
    };
  }, [isMobile, active, origin, onMove, onStop, handleCancel]);

  // For mouse controls (desktop testing)
  useEffect(() => {
    if (isMobile) return;
    
    const mouseDownHandler = (e: MouseEvent) => {
      if (!baseRef.current) return;
      
      const rect = baseRef.current.getBoundingClientRect();
      
      // Only handle clicks inside the joystick
      if (
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom
      ) {
        e.preventDefault();
        e.stopPropagation();
        
        setActive(true);
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        setOrigin({ x: centerX, y: centerY });
        setPosition({ x: e.clientX, y: e.clientY });
      }
    };
    
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!active) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Calculate movement
      const deltaX = e.clientX - origin.x;
      const deltaY = e.clientY - origin.y;
      
      // Limit distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 60;
      
      let normX = deltaX;
      let normY = deltaY;
      
      if (distance > maxDistance) {
        normX = (deltaX / distance) * maxDistance;
        normY = (deltaY / distance) * maxDistance;
      }
      
      // Normalize and send
      onMove(normX / maxDistance, normY / maxDistance);
    };
    
    const mouseUpHandler = (e: MouseEvent) => {
      if (!active) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      setActive(false);
      onStop();
    };
    
    if (baseRef.current) {
      baseRef.current.addEventListener('mousedown', mouseDownHandler);
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    return () => {
      if (baseRef.current) {
        baseRef.current.removeEventListener('mousedown', mouseDownHandler);
      }
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [isMobile, active, origin, onMove, onStop]);

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
        ref={baseRef}
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