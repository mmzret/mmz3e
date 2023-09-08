import { useEffect, useRef } from 'react';

export const useAnimationFrame = (nextAnimationFrameHandler: () => any, shouldAnimate = true) => {
  const frame = useRef(0);

  const animate = () => {
    nextAnimationFrameHandler();
    frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // start or continue animation in case of shouldAnimate if true
    if (shouldAnimate) {
      frame.current = requestAnimationFrame(animate);
    } else {
      // stop animation
      cancelAnimationFrame(frame.current);
    }

    return () => cancelAnimationFrame(frame.current);
  }, [shouldAnimate]);
};
