import { visit } from "unist-util-visit";
import { h } from "hastscript";

// 头像 SVG（user = 普通人形；assistant = OpenAI logo）
const avatars = {
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  assistant: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.106v-5.678a.79.79 0 0 0-.407-.668zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.44 5.462a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
};

/**
 * :::chat{role="user|assistant"} 容器指令
 *
 * 用法：
 * :::chat{role="user"}
 * 我说的话
 * :::
 *
 * :::chat{role="assistant"}
 * ChatGPT 的回答（支持完整 markdown：代码块、列表、表格等）
 * :::
 *
 * 渲染为 <div class="chat-msg chat-{role}"><avatar/><bubble/></div>，
 * 复用现有 callout 插件用「paragraph + hName=div 包裹块级子节点」的写法。
 */
export default function remarkChatDirective() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "containerDirective") return;
      if (node.name !== "chat") return;

      const role = (node.attributes.role || "assistant").toLowerCase();
      const safeRole = role === "user" ? "user" : "assistant";

      node.children = [
        {
          type: "paragraph",
          data: { hName: "div", hProperties: { className: ["chat-avatar"] } },
          children: [{ type: "html", value: avatars[safeRole] }],
        },
        {
          type: "paragraph",
          data: { hName: "div", hProperties: { className: ["chat-bubble"] } },
          children: node.children,
        },
      ];

      const data = node.data || (node.data = {});
      const hast = h("div", { class: `chat-msg chat-${safeRole}` });
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
    });
  };
}
