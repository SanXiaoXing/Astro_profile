// src/components/MarqueeDemo.jsx
import Marquee from "@/components/ui/marquee"; // 确保正确引入 Marquee 组件
import { cn } from "@/lib/utils";

const reviews = [
  {
    name: "AsyncX",
    body: "🌌 Per Aspera Ad Astra ",
    img: "https://blog.asyncx.top/favicon.svg",
    link: "https://blog.asyncx.top/", 
  },
  {
    name: "安知鱼",
    body: "生活明朗，万物可爱",
    img: "https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg",
    link: "https://blog.anheyu.com/",
  },
  {
    name: "张洪Heo",
    body: "分享设计与科技生活",
    img: "https://bu.dusays.com/2022/12/28/63ac2812183aa.png",
    link: "https://blog.zhheo.com/", 
  },
  {
    name: "iMaeGoo’s Blog",
    body: "虹墨空间站",
    img: "https://cdn.jsdelivr.net/npm/imaegoo/avatar.jpg",
    link: "https://www.imaegoo.com", // 添加链接
  },
  {
    name: "椒盐豆豉",
    body: "喜欢就买 不行就分 多喝热水",
    img: "https://blog.douchi.space/dino.gif",
    link: "https://blog.douchi.space/", // 添加链接
  },
  {
    name: "LongTao",
    body: "Ewige Wiederkunft",
    img: "https://pic.longtao.fun/pics/20210916/avatar.71pjc2scvak0.jpg",
    link: "https://longtao.fun", // 添加链接
  },
];


const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({ img, name, body, link }) => {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer">
      <figure className="flex items-center w-70 gap-4 p-4 border rounded-lg bg-gray-800 border-gray-700 hover:shadow-lg hover:bg-gray-500/[.15] transition-shadow duration-300">
        <img className="w-16 h-16 rounded-full" alt={name} src={img} />
        <div className="flex flex-col">
          <figcaption className="font-bold text-white">{name}</figcaption>
          <blockquote1 className="mt-1 text-gray-400 break-words">{body}</blockquote1>
        </div>
      </figure>
    </a>
  );
};



export function MarqueeDemo() {
  return (
    <div className="relative flex h-350px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-transparent md:shadow-xl">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.img} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.img} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent dark:from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-transparent dark:from-background"></div>
    </div>
  );
}

export default MarqueeDemo;
