"use client";
import {
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TaskDetail {
  subtitle?: string;
  subdetails?: string[];
}

interface Task {
  title: string;
  details: (string | TaskDetail)[];
}

interface ExperienceItem {
  company: string;
  location: string;
  position: string;
  start: string;
  end: string;
  link: string;
  tasks: Task[];
}

interface TimelineItemProps {
  item: ExperienceItem;
  index: number;
}

interface TimelineProps {
  experiences: ExperienceItem[];
}

const TimelineItem = ({ item, index }: TimelineItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.5, 0.85, 1], [0.2, 1, 1, 1, 0.2]);

  return (
    <div
      ref={itemRef}
      className={`flex justify-start relative pt-10 md:pt-0`}
    >
      {/* Desktop layout */}
      <div className="hidden md:flex w-full items-start">
        {/* Left side - Time with scroll-linked animation */}
        <div className="w-[35%] lg:w-[30%] flex-shrink-0 pr-8 lg:pr-12 relative z-20">
          <div className="sticky top-40 flex justify-end items-center py-6">
            <motion.div 
              className="text-right"
              style={{
                opacity,
              }}
            >
              <h3 className="text-2xl lg:text-3xl font-black text-[var(--fontc)] tracking-tighter opacity-80 whitespace-nowrap">
                {item.start} - {item.end}
              </h3>
            </motion.div>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute left-[35%] lg:left-[30%] translate-x-[-50%] top-0 pointer-events-none z-10">
          <div className="sticky top-40 mt-1">
            <motion.div
              className="h-10 w-10 rounded-full bg-[var(--bgc)] border border-[var(--current-line)] flex items-center justify-center shadow-[0_0_15px_rgba(155,219,238,0.15)] backdrop-blur-sm z-50"
              style={{
                opacity,
              }}
            >
              <div className="h-3 w-3 rounded-full bg-[var(--hc)] shadow-[0_0_10px_rgba(155,219,238,0.5)]" />
            </motion.div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="w-[65%] lg:w-[70%] pl-8 lg:pl-12 relative z-20">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-3xl"
          >
            <div className="group relative bg-[var(--bgc-light)]/40 backdrop-blur-md border border-[var(--current-line)] hover:border-[var(--hc)]/50 p-6 md:p-8 rounded-2xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(155,219,238,0.15)] hover:-translate-y-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h4 className="font-bold text-2xl md:text-3xl text-[var(--fontc)] mb-2 tracking-tight">
                    {item.position}
                  </h4>
                  <div className="flex items-center gap-2 text-[var(--gray-light)] font-mono text-sm">
                    <span className="text-[var(--orange)] font-semibold">@ {item.company}</span>
                    <span>•</span>
                    <span>{item.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {item.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="relative">
                    <h5 className="text-lg font-semibold text-[var(--fontc)] mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--hc)] inline-block"></span>
                      {task.title}
                    </h5>
                    <ul className="space-y-3">
                      {task.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="text-[var(--gray-light)] text-sm md:text-base leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-[var(--hc)]/40 hover:before:bg-[var(--orange)] hover:before:shadow-[0_0_8px_rgba(255,179,0,0.8)] before:transition-all before:duration-300 before:rounded-sm">
                          {typeof detail === 'string' ? (
                            <span className="block hover:text-[var(--fontc)] transition-colors">{detail}</span>
                          ) : (
                            <div className="space-y-2">
                              <strong className="font-medium text-[var(--fontc)] block">{detail.subtitle}</strong>
                              <ul className="space-y-2 pl-4 border-l border-[var(--current-line)]/50">
                                {detail.subdetails?.map((subdetail, subIndex) => (
                                  <li key={subIndex} className="relative before:content-[''] before:absolute before:-left-4 before:top-2.5 before:w-2 before:h-[1px] before:bg-[var(--hc)]/30 hover:before:bg-[var(--orange)] hover:text-[var(--fontc)] transition-all duration-300">
                                    {subdetail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile layout: Timeline on left, content on right */}
      <div className="md:hidden flex w-full relative pt-10 z-20">
        <div className="sticky z-40 items-center top-40 self-start w-6 flex-shrink-0 relative">
          <div className="h-8 w-8 absolute left-0 -translate-x-1/2 top-5 rounded-full bg-[var(--bgc)] border border-[var(--current-line)] flex items-center justify-center shadow-[0_0_15px_rgba(155,219,238,0.15)] backdrop-blur-sm z-50">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--hc)] shadow-[0_0_10px_rgba(155,219,238,0.5)]" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative pl-6 w-full max-w-3xl"
        >
          <motion.h3 
            className="block text-xl mb-4 text-left font-bold text-[var(--fontc)] pl-2 pt-0 sticky top-40"
            style={{
              opacity,
            }}
          >
            {item.start} - {item.end}
          </motion.h3>
          
          <div className="group relative bg-[var(--bgc-light)]/40 backdrop-blur-md border border-[var(--current-line)] hover:border-[var(--hc)]/50 p-6 rounded-2xl transition-all duration-500 mt-2">
            <div className="flex flex-col mb-6">
              <h4 className="font-bold text-2xl text-[var(--fontc)] mb-2 tracking-tight">
                {item.position}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-[var(--gray-light)] font-mono text-sm">
                <span className="text-[var(--orange)] font-semibold">@ {item.company}</span>
                <span>•</span>
                <span>{item.location}</span>
              </div>
            </div>

            <div className="space-y-6">
              {item.tasks.map((task, taskIndex) => (
                <div key={taskIndex} className="relative">
                  <h5 className="text-lg font-semibold text-[var(--fontc)] mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--hc)] inline-block"></span>
                    {task.title}
                  </h5>
                  <ul className="space-y-3">
                    {task.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-[var(--gray-light)] text-sm leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-[var(--hc)]/40 before:rounded-sm">
                        {typeof detail === 'string' ? (
                          <span className="block">{detail}</span>
                        ) : (
                          <div className="space-y-2">
                            <strong className="font-medium text-[var(--fontc)] block">{detail.subtitle}</strong>
                            <ul className="space-y-2 pl-4 border-l border-[var(--current-line)]/50">
                              {detail.subdetails.map((subdetail, subIndex) => (
                                <li key={subIndex} className="relative before:content-[''] before:absolute before:-left-4 before:top-2.5 before:w-2 before:h-[1px] before:bg-[var(--hc)]/30">
                                  {subdetail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const Timeline = ({ experiences }: TimelineProps) => {
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
      className="w-full bg-transparent font-sans md:px-10 relative overflow-hidden"
      ref={containerRef}
    >
      {/* Decorative background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-[var(--hc)]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-6xl mb-6 font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--fontc)] to-[var(--gray)] max-w-4xl"
        >
          Work Experience
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-[var(--gray-light)] text-lg md:text-xl max-w-xl font-light leading-relaxed"
        >
          {(() => {
            const startDate = new Date('2023-07');
            const now = new Date();
            const years = now.getFullYear() - startDate.getFullYear();
            const months = now.getMonth() - startDate.getMonth();
            const totalMonths = years * 12 + months;
            const displayYears = Math.floor(totalMonths / 12);
            const displayMonths = totalMonths % 12;

            const timeString = displayYears > 0
              ? `${displayYears} year${displayYears > 1 ? 's' : ''} ${displayMonths > 0 ? `and ${displayMonths} month${displayMonths > 1 ? 's' : ''}` : ''}`
              : `${displayMonths} month${displayMonths > 1 ? 's' : ''}`;

            return `I've been working in Beijing for ${timeString}. Here is a timeline of my professional journey.`;
          })()}
        </motion.p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20 pt-10 md:pt-20 overflow-visible">
        {/* Center line */}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute left-6 md:left-[35%] lg:left-[30%] top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-[var(--current-line)] to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:-translate-x-1/2"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[var(--orange)] via-[var(--hc)] to-transparent from-[0%] via-[10%] rounded-full shadow-[0_0_10px_rgba(155,219,238,0.8)]"
          />
        </div>

        <div className="flex flex-col gap-10 md:gap-20">
          {experiences.map((item, index) => (
            <TimelineItem key={index} item={item} index={index} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default Timeline;