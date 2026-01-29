// D3-based hierarchical playbook diagram (v12-style)
// Data source can be overridden with ?data=<file.json>

function getDataFile() {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (data && data.endsWith('.json')) return data;
  return 'gifting_playbook.json';
}

d3.json(getDataFile()).then((data) => {
  const root = d3.hierarchy(data);

  // Hidden measure div for wrapped text height
  const hiddenMeasure = document.createElement('div');
  hiddenMeasure.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'white-space:normal',
    'word-wrap:break-word',
    'padding:0',
    'margin:0'
  ].join(';');
  document.body.appendChild(hiddenMeasure);

  // Sync font styles from node fo
  (function syncFontStyles() {
    const probe = document.createElement('div');
    probe.className = 'node-fo';
    probe.style.cssText = 'position:absolute;visibility:hidden';
    probe.innerHTML = '<div>A</div>';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe.firstElementChild);
    hiddenMeasure.style.font = c.font;
    hiddenMeasure.style.letterSpacing = c.letterSpacing;
    document.body.removeChild(probe);
  })();

  function measureWrapped(txt, widthPx) {
    hiddenMeasure.style.width = widthPx + 'px';
    hiddenMeasure.textContent = txt;
    return hiddenMeasure.scrollHeight;
  }

  function rectWidth(d) {
    switch (d.depth) {
      case 0:
        return 260;
      case 1:
        return 220;
      case 2:
        return 210;
      default:
        return 190;
    }
  }

  function isGroup(n) {
    return n.children && n.children.length > 0;
  }

  root.each((d) => {
    const w = rectWidth(d);
    const sidePad = 24;
    const tH = measureWrapped(d.data.name, w - sidePad);
    d.data.nodeHeight = tH + 24;
  });

  const siblingSpacing = 18;
  const groupSpacing = 52;
  const horizontalSpacing = 260;

  const treeLayout = d3
    .tree()
    .nodeSize([1, horizontalSpacing])
    .separation((a, b) => {
      const baseGap = a.parent === b.parent ? (isGroup(a) || isGroup(b) ? groupSpacing : siblingSpacing) : groupSpacing;
      return (a.data.nodeHeight + b.data.nodeHeight) / 2 + baseGap;
    });

  treeLayout(root);

  // Swap coordinates for LR layout
  root.descendants().forEach((d) => {
    const treeX = d.x;
    const treeY = d.y;
    d.x = treeY;
    d.y = treeX;
  });

  const svg = d3.select('#mindmap');
  const gAll = svg.append('g').attr('class', 'everything');
  const nodes = root.descendants();
  const links = root.links();

  function leftEdge(d) {
    return d.x - rectWidth(d) / 2;
  }
  function rightEdge(d) {
    return d.x + rectWidth(d) / 2;
  }

  function elbowPath(px, py, cx, cy, radius) {
    const mid = (px + cx) / 2;
    if (py === cy) return `M${px},${py}L${cx},${cy}`;
    if (!radius) return `M${px},${py}L${mid},${py}L${mid},${cy}L${cx},${cy}`;
    if (py < cy) {
      return `M${px},${py}L${mid},${py}L${mid},${cy - radius}Q${mid},${cy} ${mid + radius},${cy}L${cx},${cy}`;
    }
    return `M${px},${py}L${mid},${py}L${mid},${cy + radius}Q${mid},${cy} ${mid + radius},${cy}L${cx},${cy}`;
  }

  // Links
  gAll
    .selectAll('path.link')
    .data(links)
    .join('path')
    .attr('class', (d) => `link level${d.target.depth}-link`)
    .attr('d', (d) => {
      const sx = rightEdge(d.source);
      const sy = d.source.y;
      const tx = leftEdge(d.target);
      const ty = d.target.y;

      const parent = d.source;
      const children = parent.children || [];
      const childIndex = children.indexOf(d.target);
      const isTopChild = childIndex === 0;
      const isBottomChild = childIndex === children.length - 1;

      return elbowPath(sx, sy, tx, ty, isTopChild || isBottomChild ? 14 : 0);
    });

  // Nodes
  const nodeG = gAll
    .selectAll('g.node')
    .data(nodes)
    .join('g')
    .attr('class', (d) => `node level${d.depth}`)
    .attr('transform', (d) => `translate(${d.x},${d.y})`);

  nodeG
    .append('rect')
    .each(function (d) {
      const w = rectWidth(d);
      const h = d.data.nodeHeight;
      d3.select(this)
        .attr('x', -w / 2)
        .attr('y', -h / 2)
        .attr('width', w)
        .attr('height', h);
    });

  nodeG
    .append('foreignObject')
    .attr('class', 'node-fo')
    .each(function (d) {
      const w = rectWidth(d);
      const h = d.data.nodeHeight;
      d3.select(this)
        .attr('x', -w / 2)
        .attr('y', -h / 2)
        .attr('width', w)
        .attr('height', h)
        .append('xhtml:div')
        .text(d.data.name);
    });

  // Fit viewBox
  const bbox = gAll.node().getBBox();
  const margin = 70;
  svg.attr('viewBox', [bbox.x - margin, bbox.y - margin, bbox.width + margin * 2, bbox.height + margin * 2]);

  document.body.removeChild(hiddenMeasure);
});
