"use client";

import React, { useState } from "react";
import { TextRoll } from "./ui/text-roll";
import { EXPERIENCE } from "@/lib/constants";

interface WorkLinkProps {
  href: string;
  enText: string;
}

type ExperienceItem = (typeof EXPERIENCE)[number];

const previewItems = [...EXPERIENCE]
  .sort((a, b) => b.start.localeCompare(a.start))
  .slice(0, 3);

const formatDuration = ({ start, end }: ExperienceItem) => `${start} - ${end}`;

export const WorkLink: React.FC<WorkLinkProps> = ({ href, enText }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="about-work">
      <a
        href={href}
        className="about-work-link"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label="查看完整工作经历"
      >
        <div className="about-work-head">
          <span className="about-work-kicker">Recent Work</span>
          <div className="about-work-title-row">
            <span className="about-work-en">
              <TextRoll
                center
                text={enText}
                hovered={hovered}
                className="about-work-en-text"
              />
            </span>
            <span className="about-work-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
          <p className="about-work-description">
            点击进入完整工作经历页面。
          </p>
        </div>

        <div className="about-work-list" aria-hidden="true">
          {previewItems.map((item, index) => (
            <article className="about-work-item" key={`${item.start}-${item.position}`}>
              <div className="about-work-item-meta">
                <span className="about-work-item-date">{formatDuration(item)}</span>
              </div>
              <div className="about-work-item-body">
                <h3 className="about-work-item-title">{item.position}</h3>
                <p className="about-work-item-company">
                  {item.company} · {item.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </a>
    </div>
  );
};
