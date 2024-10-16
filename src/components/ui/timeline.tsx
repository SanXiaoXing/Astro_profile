"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { EXPERIENCE } from "@/lib/constants";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = () => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full  dark:bg-neutral-950 font-sans md:px-10"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-4xl mb-4 text-white max-w-4xl">
          Changelog from my working life
        </h2>
        <br />
        <p className="text-neutral-500 text-lg md:text-base max-w-sm">
          I&apos;ve been working in Beijing for the past 1 years. Here&apos;s
          a timeline of my working experiences.
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
      {EXPERIENCE.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-neutral-700 dark:bg-black flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-neutral-600 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-4xl font-bold text-neutral-500 dark:text-neutral-500 ">
                {item.start}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-4xl mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500">
                {item.start}
              </h3>
              <div className="font-semibold text-lg text-primary dark:text-neutral-300">
                {item.position} @ {item.company}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">
                {item.location}
              </div>

              {/* 显示任务 */}
              {item.tasks.map((task, taskIndex) => (
                <div key={taskIndex} className="mt-4">
                  <h4 className="text-lg font-bold text-primary dark:text-neutral-400">
                    {task.title}
                  </h4>
                  <ol className="list-disc list-inside space-y-2"> {/* 为了增加行间距，可以使用 space-y-2 */}
                    {task.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-neutral-400 dark:text-neutral-300">
                        {typeof detail === 'string' ? (
                          detail // 如果是字符串，直接显示
                        ) : (
                          <>
                            <strong className="font-semibold">{detail.subtitle}</strong> {/* 使subtitle加粗 */}
                            <ul className="list-disc list-inside pl-6 mt-1"> {/* 调整子列表的缩进和顶部间距 */}
                              {detail.subdetails.map((subdetail, subIndex) => (
                                <li key={subIndex}>{subdetail}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>

                </div>
              ))}

            </div>
          </div>
        ))}

        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;