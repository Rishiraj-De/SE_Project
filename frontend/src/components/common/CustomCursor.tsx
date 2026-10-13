"use client";

import React, { useEffect, useRef, useState } from "react";

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isTextTarget, setIsTextTarget] = useState(false);

  useEffect(() => {
    // Only activate on devices that support hover (mouse/trackpad, not touch)
    if (typeof window === "undefined" || window.matchMedia("(hover: none)").matches) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest(
            'button, a, select, [role="button"], input[type="checkbox"], input[type="radio"], .cursor-pointer, [data-interactive="true"]'
          )
        );
        const isText = Boolean(
          target.closest(
            'input[type="text"], input[type="password"], textarea, [contenteditable="true"], .monaco-editor, pre, code'
          )
        );

        setIsHovered(isInteractive);
        setIsTextTarget(isText);
      }
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Tight, high-precision RAF loop
    const render = () => {
      // Responsive 22% lerp for a snug, tight follow
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [isVisible]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[999999] overflow-hidden transition-opacity duration-200 select-none ${
        isVisible && !isTextTarget ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Minimal Trailing Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color,border-color,opacity] duration-150 ease-out will-change-transform ${
          isClicked
            ? "w-4 h-4 border border-[#E8532E] bg-[#E8532E]/15 opacity-90"
            : isHovered
            ? "w-7 h-7 border border-[#E8532E]/60 bg-[#E8532E]/8 opacity-100"
            : "w-5 h-5 border border-black/25 opacity-70"
        }`}
      />

      {/* Minimal Precision Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,background-color,transform] duration-100 ease-out will-change-transform ${
          isClicked
            ? "w-1 h-1 bg-[#E8532E]"
            : isHovered
            ? "w-1.5 h-1.5 bg-[#E8532E]"
            : "w-1.5 h-1.5 bg-gray-900"
        }`}
      />
    </div>
  );
};
