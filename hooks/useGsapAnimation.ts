import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Hook for managing GSAP animations with automatic cleanup
 */
export const useGsapAnimation = (
  callback: (element: HTMLElement) => void | gsap.core.Tween | gsap.core.Timeline,
  deps: React.DependencyList = []
) => {
  const elementRef = useRef<HTMLElement>(null);
  const animationRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      const result = callback(elementRef.current);
      if (result instanceof gsap.core.Tween || result instanceof gsap.core.Timeline) {
        animationRef.current = result;
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, deps);

  return elementRef;
};

/**
 * Hook for scroll-triggered animations
 */
export const useScrollTrigger = (
  callback: (element: HTMLElement) => void,
  deps: React.DependencyList = []
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      callback(elementRef.current);
    }

    return () => {
      // ScrollTrigger cleanup happens automatically
    };
  }, deps);

  return elementRef;
};

/**
 * Hook for element intersection observer (entrance animations)
 */
export const useIntersectionAnimation = (
  callback: (isVisible: boolean) => void,
  options?: IntersectionObserverInit
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, options);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return elementRef;
};

/**
 * Hook for mouse trail and magnetic effects
 */
export const useMouseTrail = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!elementRef.current) return;

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = elementRef.current!.getBoundingClientRect();
      mouseX = e.clientX - rect.left - rect.width / 2;
      mouseY = e.clientY - rect.top - rect.height / 2;

      gsap.to(elementRef.current!, {
        x: mouseX * 0.2,
        y: mouseY * 0.2,
        duration: 0.5,
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(elementRef.current!, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const element = elementRef.current;
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef]);
};

/**
 * Hook for tilt card effect
 */
export const useTiltCard = (
  elementRef: React.RefObject<HTMLElement>,
  intensity = 10
) => {
  useEffect(() => {
    if (!elementRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = elementRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotateX = ((y - rect.height / 2) / rect.height) * intensity;
      const rotateY = ((rect.width / 2 - x) / rect.width) * intensity;

      gsap.to(elementRef.current!, {
        rotationX: rotateX,
        rotationY: rotateY,
        duration: 0.2,
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(elementRef.current!, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const element = elementRef.current;
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef, intensity]);
};

/**
 * Hook for animated counter
 */
export const useAnimatedCounter = (
  from = 0,
  to = 100,
  duration = 2,
  format?: (val: number) => string
) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const obj = { value: from };
    const tween = gsap.to(obj, {
      value: to,
      duration,
      onUpdate: () => {
        const formatted = format
          ? format(obj.value)
          : Math.round(obj.value).toString();
        elementRef.current!.textContent = formatted;
      },
      ease: 'power2.out',
    });

    return () => {
      tween.kill();
    };
  }, [from, to, duration, format]);

  return elementRef;
};

/**
 * Hook for parallax scroll effect
 */
export const useParallax = (
  elementRef: React.RefObject<HTMLElement>,
  speed = 0.5
) => {
  useEffect(() => {
    if (!elementRef.current) return;

    const handleScroll = () => {
      if (!elementRef.current) return;
      const scrollY = window.scrollY;
      gsap.set(elementRef.current, {
        y: scrollY * speed,
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [elementRef, speed]);
};

/**
 * Hook for observing prefers-reduced-motion
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};
