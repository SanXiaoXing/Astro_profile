import { visit } from 'unist-util-visit';

export default function removeObsidianLinks() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/\[\[.*?\]\]/g, '');
    });
  };
}
