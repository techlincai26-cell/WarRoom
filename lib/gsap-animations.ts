import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import TextPlugin from 'gsap/TextPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

// ============================================
// ANIMATION PRESETS & UTILITIES
// ============================================

export const animationConfig = {
  spring: { type: 'spring', stiffness: 300, damping: 80 },
  ease: {
    in: 'back.in(1.7)',
    out: 'back.out(1.7)',
    inOut: 'back.inOut(1.7)',
  },
};

// FADE IN UP
export const fadeInUp = (
  element: gsap.TweenTarget,
  duration = 0.6,
  delay = 0
) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration, delay, ease: 'power2.out' }
  );
};

// SCALE UP
export const scaleUp = (
  element: gsap.TweenTarget,
  duration = 0.6,
  delay = 0
) => {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration, delay, ease: 'back.out(1.7)' }
  );
};

// STAGGERED FADE IN UP
export const staggerFadeInUp = (
  elements: gsap.TweenTarget,
  duration = 0.6,
  staggerDelay = 0.1,
  delay = 0
) => {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger: staggerDelay,
      delay,
      ease: 'power2.out',
    }
  );
};

// COUNT UP ANIMATION
export const countUp = (
  element: HTMLElement,
  endValue: number,
  duration = 2,
  suffix = ''
) => {
  const counter = { value: 0 };
  return gsap.to(counter, {
    value: endValue,
    duration,
    onUpdate: () => {
      element.textContent = `${Math.round(counter.value)}${suffix}`;
    },
    ease: 'power2.out',
  });
};

// TYPE WRITER EFFECT
export const typeWriter = (
  element: gsap.TweenTarget,
  text: string,
  duration = 1.5,
  delay = 0
) => {
  return gsap.to(element, {
    text,
    duration,
    delay,
    ease: 'none',
  });
};

// WORD REVEAL (character by character)
export const wordReveal = (
  element: gsap.TweenTarget,
  duration = 0.6,
  delay = 0
) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: 'power2.out',
    }
  );
};

// GLOW EFFECT
export const glowPulse = (
  element: gsap.TweenTarget,
  color = 'rgba(99, 102, 241, 0.5)',
  duration = 1.5
) => {
  return gsap.to(element, {
    boxShadow: [
      `0 0 5px ${color}`,
      `0 0 25px ${color}, 0 0 50px rgba(99, 102, 241, 0.2)`,
      `0 0 5px ${color}`,
    ],
    duration,
    repeat: -1,
    ease: 'sine.inOut',
  });
};

// MAGNETIC BUTTON EFFECT (mouse following)
export const setupMagneticButton = (
  element: HTMLElement,
  strength = 0.3
) => {
  let mouseX = 0;
  let mouseY = 0;
  let elementX = 0;
  let elementY = 0;

  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    mouseX = x;
    mouseY = y;
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  // Animate position following mouse
  gsap.to(
    { x: elementX, y: elementY },
    {
      x: () => mouseX * strength,
      y: () => mouseY * strength,
      onUpdate(self) {
        gsap.set(element, {
          x: self.getProperty('x'),
          y: self.getProperty('y'),
        });
      },
      duration: 0.5,
      repeat: -1,
      ease: 'power2.out',
    }
  );
};

// SCROLL TRIGGER FADE IN UP
export const scrollFadeInUp = (
  element: gsap.TweenTarget,
  duration = 0.6
) => {
  gsap.fromTo(
    element,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'top 20%',
        scrub: false,
      },
    }
  );
};

// SCROLL TRIGGER SCALE UP
export const scrollScaleUp = (
  element: gsap.TweenTarget,
  duration = 0.8
) => {
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.8 },
    {
      opacity: 1,
      scale: 1,
      duration,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        end: 'top 15%',
        scrub: false,
      },
    }
  );
};

// TIMELINE CREATOR
export const createTimeline = (
  onComplete?: () => void
): gsap.core.Timeline => {
  return gsap.timeline({
    onComplete,
  });
};

// PARTICLE EFFECT (simple dots)
export const createParticleEffect = (
  container: HTMLElement,
  count = 20,
  duration = 1.5
) => {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(99, 102, 241, 0.6);
      border-radius: 50%;
      pointer-events: none;
    `;
    container.appendChild(particle);

    const randomX = Math.random() * 200 - 100;
    const randomY = Math.random() * 200 - 100;

    gsap.to(particle, {
      x: randomX,
      y: randomY,
      opacity: 0,
      duration,
      ease: 'power2.out',
      onComplete: () => {
        particle.remove();
      },
    });
  }
};

// TILT CARD EFFECT
export const setupTiltCard = (
  element: HTMLElement,
  intensity = 10
) => {
  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y - rect.height / 2) / rect.height) * intensity;
    const rotateY = ((rect.width / 2 - x) / rect.width) * intensity;

    gsap.to(element, {
      rotationX: rotateX,
      rotationY: rotateY,
      duration: 0.2,
      overwrite: 'auto',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
  });
};

// ANIMATED NUMBER COUNTER
export const animateNumber = (
  element: HTMLElement,
  from: number,
  to: number,
  duration = 2,
  format?: (val: number) => string
) => {
  const obj = { value: from };
  return gsap.to(obj, {
    value: to,
    duration,
    onUpdate: () => {
      const formatted = format
        ? format(obj.value)
        : Math.round(obj.value).toString();
      element.textContent = formatted;
    },
    ease: 'power2.out',
  });
};

// GRADIENT ANIMATION
export const animateGradient = (
  element: gsap.TweenTarget,
  colors: string[],
  duration = 4
) => {
  return gsap.to(element, {
    backgroundPosition: ['0% center', '100% center', '0% center'],
    duration,
    repeat: -1,
    ease: 'none',
  });
};

// REVEAL ON SCROLL (staggered elements)
export const revealOnScroll = (
  elements: gsap.TweenTarget,
  staggerAmount = 0.1
) => {
  gsap.utils.toArray(elements).forEach((element: any) => {
    gsap.fromTo(
      element,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
        },
        stagger: staggerAmount,
      }
    );
  });
};

// SPLIT TEXT ANIMATION (for title effects)
export const splitTextAnimation = (
  element: HTMLElement,
  duration = 0.05
) => {
  const text = element.textContent || '';
  element.innerHTML = text
    .split('')
    .map((char) => `<span style="display:inline-block;">${char}</span>`)
    .join('');

  return gsap.fromTo(
    element.querySelectorAll('span'),
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger: 0.03,
      ease: 'back.out(1.7)',
    }
  );
};

// SCROLL BAR ANIMATION
export const animateProgressBar = (
  progressBar: HTMLElement,
  duration = 1
) => {
  return gsap.fromTo(
    progressBar,
    { scaleX: 0 },
    {
      scaleX: 1,
      duration,
      transformOrigin: 'left center',
      ease: 'power2.out',
    }
  );
};

// BLUR IN ANIMATION
export const blurIn = (
  element: gsap.TweenTarget,
  duration = 0.8,
  delay = 0
) => {
  return gsap.fromTo(
    element,
    { opacity: 0, filter: 'blur(10px)' },
    {
      opacity: 1,
      filter: 'blur(0px)',
      duration,
      delay,
      ease: 'power2.out',
    }
  );
};

export default gsap;
