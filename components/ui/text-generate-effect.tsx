"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "motion/react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  shouldAnimate = true, // <-- new prop
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  shouldAnimate?: boolean;
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (!shouldAnimate) return;

    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: duration ?? 1,
        delay: stagger(0.05),
      }
    );
  }, [animate, duration, filter, shouldAnimate]);

  return (
    <div className="mt-4">
      <motion.div
        ref={scope}
        initial={{ opacity: 1 }}
        className={cn(
          "font-bold text-2xl leading-snug tracking-wide",
          className
        )}
      >
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            initial={{ opacity: 0 }}
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};
