"use client";
import {
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useReducedMotion,
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
  description: string;
  start: string;
  end: string;
  link: string;
  tasks: Task[];
}

interface TimelineProps {
  experiences: ExperienceItem[];
}

/**
 * 滚动跟随的阻尼参数。
 * stiffness 越小 / mass 越大,日期被滚轮"拽"出去的位移越大、回弹越久。
 * 想要更黏手:调小 stiffness(如 220)并调大 mass;想要更跟手:反向调整。
 */
const FOLLOW_SPRING = {
  stiffness: 300,
  damping: 40,
  mass: 0.4,
  // 进度值域只有 0~1,默认 restDelta(0.01) 太大,会在还剩一截时突然停住
  restDelta: 0.0005,
} as const;
/** 静止参数:reduced-motion 下不做任何惯性动画 */
const STILL_SPRING = { stiffness: 1000, damping: 100, mass: 0.2 } as const;

const TimelineItem = ({ item, index }: TimelineItemProps) => {
  const reduceMotion = useReducedMotion();
  const itemRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start end", "end start"],
  });

  const follow = useSpring(
    scrollYProgress,
    reduceMotion ? STILL_SPRING : FOLLOW_SPRING,
  );

  const opacity = useTransform(
    follow,
    [0, 0.12, 0.5, 0.88, 1],
    [0.25, 1, 1, 1, 0.25],
  );

  // 日期的主运动 = CSS sticky(在自己那条内容内跟随滚动)。
  // 这里在滚动瞬间叠一层"被拽住又弹回"的惯性:滚动时偏移几像素,停手立刻归位,
  // 不改变跟随内容的大方向。不想要这点惯性就把 lagY/skew/stretchY 的
  // 输出全改成常量。
  const velocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(
    velocity,
    reduceMotion ? STILL_SPRING : { stiffness: 260, damping: 34, mass: 0.4 },
  );
  const lagY = useTransform(
    smoothVelocity,
    [-0.5, 0, 0.5],
    reduceMotion ? [0, 0, 0] : [-6, 0, 6],
  );
  const skew = useTransform(
    smoothVelocity,
    [-0.5, 0, 0.5],
    reduceMotion ? [0, 0, 0] : [-2, 0, 2],
  );
  const stretchY = useTransform(
    smoothVelocity,
    [-0.5, 0, 0.5],
    reduceMotion ? [1, 1, 1] : [1.05, 1, 0.96],
  );

  // 条目处于"当前"区间时:引线展开、圆点亮起
  const focus = useTransform(follow, [0, 0.25, 0.8, 1], [0, 1, 1, 0]);
  const coreScale = useTransform(focus, [0, 1], [0.7, 1.15]);
  const dotGlow = useTransform(
    focus,
    [0, 1],
    [
      "0px 0px 15px rgba(155,219,238,0.15)",
      "0px 0px 28px rgba(155,219,238,0.45)",
    ],
  );

  return (
    <div
      ref={itemRef}
      className={`flex justify-start relative pt-10 md:pt-0`}
    >
      {/* Desktop layout */}
      <div className="hidden md:flex w-full items-start">
        {/* 左侧日期:sticky 在自己这一条内容里 ——
            跟着卡片进场,滚到吸顶线后钉在视口左侧(始终在"自己项目"的左侧),
            卡片结束时被顶走,由下一条的日期接管 */}
        <div className="w-[34%] lg:w-[26%] flex-shrink-0 pr-6 relative z-20 self-stretch">
          <div className="sticky top-24 mt-8 h-10">
            <motion.div
              className="text-right relative flex h-full items-center justify-end"
              style={{
                y: lagY,
                opacity,
                skewY: skew,
                scaleY: stretchY,
              }}
            >
              <h3 className="whitespace-nowrap font-mono text-lg font-semibold tracking-normal text-[var(--fontc)] opacity-80">
                {item.start} - {item.end}
              </h3>
              {/* 日期 → 轨道圆点 的引线,该条目处于当前区间时展开 */}
              <motion.span
                aria-hidden
                className="absolute top-1/2 -right-6 h-px w-6 origin-left bg-gradient-to-r from-transparent to-[var(--hc)]"
                style={{ scaleX: focus, opacity: focus }}
              />
            </motion.div>
          </div>
        </div>

        {/* Center dot - 与日期同一套 sticky 几何,始终贴着日期对齐 */}
        <div className="absolute left-[34%] lg:left-[26%] translate-x-[-50%] top-0 bottom-0 pointer-events-none z-10">
          <div
            className="sticky top-24 mt-8 h-10 flex items-center justify-center"
          >
            <motion.div
              className="h-10 w-10 rounded-full bg-[var(--bgc)] border border-[var(--current-line)] flex items-center justify-center backdrop-blur-sm z-50"
              style={{
                y: lagY,
                opacity,
                skewY: skew,
                scaleY: stretchY,
                boxShadow: dotGlow,
              }}
            >
              <motion.div
                className="h-3 w-3 rounded-full bg-[var(--hc)] shadow-[0_0_10px_rgba(155,219,238,0.5)]"
                style={{ scale: coreScale }}
              />
            </motion.div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="w-[66%] lg:w-[74%] pl-10 lg:pl-12 relative z-20">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: reduceMotion ? 0.3 : 0.6, ease: "easeOut" }}
            className="w-full max-w-4xl"
          >
            <div className="group relative bg-[var(--bgc-light)]/40 backdrop-blur-md border border-[var(--current-line)] hover:border-[var(--hc)]/50 p-6 md:p-8 lg:p-10 rounded-2xl transition-[transform,border-color,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-out)] hover:shadow-[0_0_30px_rgba(155,219,238,0.15)] hover:-translate-y-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h4 className="font-bold text-2xl md:text-3xl text-[var(--fontc)] mb-2 tracking-tight">
                    {item.position}
                  </h4>
                  <div className="flex items-center gap-2 text-[var(--gray-light)] font-mono text-sm mb-3">
                    <span className="text-[var(--orange)] font-semibold">@ {item.company}</span>
                    <span>•</span>
                    <span>{item.location}</span>
                  </div>
                  {item.description && (
                    <div className="mt-4 mb-3 max-w-3xl">
                      <h6 className="text-sm font-semibold text-[var(--fontc)] mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-[var(--hc)] rounded-sm"></span>
                        项目概述
                      </h6>
                      <blockquote className="text-[var(--gray-light)] text-sm md:text-base leading-relaxed pl-6 py-4 pr-6 border-l-4 border-[var(--hc)] bg-[linear-gradient(90deg,hsla(210,80%,60%,0.08),transparent)] rounded-r-lg italic">
                        {item.description}
                      </blockquote>
                    </div>
                  )}
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
                        <li key={detailIndex} className="text-[var(--gray-light)] text-sm md:text-base leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-[var(--hc)]/40 hover:before:bg-[var(--orange)] hover:before:shadow-[0_0_8px_rgba(255,179,0,0.8)] before:transition-[background-color,box-shadow] before:duration-[var(--duration-base)] before:ease-[var(--ease-out)] before:rounded-sm">
                          {typeof detail === 'string' ? (
                            <span className="block hover:text-[var(--fontc)] transition-colors">{detail}</span>
                          ) : (
                            <div className="space-y-2">
                              <strong className="font-medium text-[var(--fontc)] block">{detail.subtitle}</strong>
                              <ul className="space-y-2 pl-4 border-l border-[var(--current-line)]/50">
                                {detail.subdetails?.map((subdetail, subIndex) => (
                                  <li key={subIndex} className="relative before:content-[''] before:absolute before:-left-4 before:top-2.5 before:w-2 before:h-[1px] before:bg-[var(--hc)]/30 hover:before:bg-[var(--orange)] hover:text-[var(--fontc)] transition-[color] duration-[var(--duration-base)] ease-[var(--ease-out)]">
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
        <div className="z-40 self-start w-6 flex-shrink-0 relative">
          <div className="absolute left-0 -translate-x-1/2 -top-1">
            <motion.div
              className="h-8 w-8 rounded-full bg-[var(--bgc)] border border-[var(--current-line)] flex items-center justify-center backdrop-blur-sm z-50"
              style={{ y: lagY, opacity, boxShadow: dotGlow }}
            >
              <motion.div
                className="h-2.5 w-2.5 rounded-full bg-[var(--hc)] shadow-[0_0_10px_rgba(155,219,238,0.5)]"
                style={{ scale: coreScale }}
              />
            </motion.div>
          </div>
        </div>

        <motion.div 
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
          whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: reduceMotion ? 0.3 : 0.6, ease: "easeOut" }}
          className="relative pl-6 w-full max-w-3xl"
        >
          <motion.h3
            className="block text-base mb-4 text-left font-semibold text-[var(--fontc)] font-mono pl-2 pt-0"
            style={{
              opacity,
              y: lagY,
            }}
          >
            {item.start} - {item.end}
          </motion.h3>
          
          <div className="group relative bg-[var(--bgc-light)]/40 backdrop-blur-md border border-[var(--current-line)] hover:border-[var(--hc)]/50 p-6 rounded-2xl transition-[transform,border-color,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-out)] mt-2">
            <div className="flex flex-col mb-6">
              <h4 className="font-bold text-2xl text-[var(--fontc)] mb-2 tracking-tight">
                {item.position}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-[var(--gray-light)] font-mono text-sm mb-3">
                <span className="text-[var(--orange)] font-semibold">@ {item.company}</span>
                <span>•</span>
                <span>{item.location}</span>
              </div>
              {item.description && (
                <div className="mt-3 mb-3">
                  <h6 className="text-sm font-semibold text-[var(--fontc)] mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[var(--hc)] rounded-sm"></span>
                    项目概述
                  </h6>
                  <blockquote className="text-[var(--gray-light)] text-sm leading-relaxed pl-6 py-4 pr-6 border-l-4 border-[var(--hc)] bg-[linear-gradient(90deg,hsla(210,80%,60%,0.08),transparent)] rounded-r-lg italic">
                    {item.description}
                  </blockquote>
                </div>
              )}
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
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // 轨道总高度:用 ResizeObserver 持续测量,字体/图片加载或窗口缩放后不会量错
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  // 轨道进度条同样过一层弹簧,与日期的跟随节奏保持一致
  const smoothProgress = useSpring(
    scrollYProgress,
    reduceMotion ? STILL_SPRING : FOLLOW_SPRING,
  );

  const heightTransform = useTransform(smoothProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(smoothProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full bg-transparent font-sans md:px-10 relative"
      ref={containerRef}
    >
      {/* 背景光晕。注意:裁剪必须放在它自己的容器里 ——
          根节点一旦挂 overflow-hidden,会变成游标窗口 sticky 的滚动容器,
          导致 sticky 永不生效、整条日期瘫在第一屏内容旁边 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-[var(--hc)]/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10 relative z-10">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-6xl mb-6 font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--fontc)] to-[var(--gray)] max-w-4xl"
        >
          Work Experience
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
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
          className="absolute left-6 md:left-[34%] lg:left-[26%] top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-[var(--current-line)] to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:-translate-x-1/2"
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