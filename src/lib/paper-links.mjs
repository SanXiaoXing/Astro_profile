export function relatedPapers(papers, article) {
  return papers.filter((paper) => !paper.data.draft && paper.data.article === article)
}

export function paperLink(paper) {
  return `/papers?paper=${encodeURIComponent(paper.slug)}`
}
