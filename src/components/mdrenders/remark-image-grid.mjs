import { visit } from 'unist-util-visit';

export default function remarkImageGrid() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      if (node.name !== 'image-grid') return;
      node.data = { ...node.data, hName: 'div', hProperties: { className: ['image-grid'] } };
    });
  };
}
