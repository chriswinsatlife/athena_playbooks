function getParam(name, fallback) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || fallback;
}

function elbow(points, r) {
  if (!points || points.length < 2) return '';
  const radius = r ?? 10;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    if (!p2) {
      d += `L${p1.x},${p1.y}`;
      break;
    }
    const v1x = p1.x - p0.x;
    const v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const u1x = v1x / len1;
    const u1y = v1y / len1;
    const u2x = v2x / len2;
    const u2y = v2y / len2;

    const dist = Math.min(radius, len1 / 2, len2 / 2);
    const a = { x: p1.x - u1x * dist, y: p1.y - u1y * dist };
    const b = { x: p1.x + u2x * dist, y: p1.y + u2y * dist };
    d += `L${a.x},${a.y}Q${p1.x},${p1.y} ${b.x},${b.y}`;
  }
  return d;
}

function measureTextHeights(nodes, widthFor) {
  const hidden = document.createElement('div');
  hidden.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'white-space:normal',
    'word-wrap:break-word',
    'display:-webkit-box',
    '-webkit-line-clamp:2',
    '-webkit-box-orient:vertical',
    'overflow:hidden',
    'padding:0',
    'margin:0'
  ].join(';');
  document.body.appendChild(hidden);

  // Copy font styles from node fo
  const probe = document.createElement('div');
  probe.className = 'node-fo';
  probe.style.cssText = 'position:absolute;visibility:hidden';
  probe.innerHTML = '<div><span>A</span></div>';
  document.body.appendChild(probe);
  const c = getComputedStyle(probe.querySelector('span'));
  hidden.style.font = c.font;
  hidden.style.letterSpacing = c.letterSpacing;
  document.body.removeChild(probe);

  function wrappedHeight(text, w) {
    hidden.style.width = w + 'px';
    hidden.textContent = text;
    return hidden.scrollHeight;
  }

  for (const n of nodes) {
    const w = widthFor(n);
    const sidePad = 24;
    const tH = wrappedHeight(n.label, w - sidePad);
    n._h = tH + 24;
    n._w = w;
  }

  document.body.removeChild(hidden);
}

function widthForNode(n) {
  if (n.type === 'decision') return 260;
  if ((n.label || '').length > 28) return 290;
  return 260;
}

function labelAt(points) {
  if (!points || points.length < 2) return null;
  const total = points.reduce((acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y)), 0);
  const target = total * 0.5;
  let run = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const seg = Math.hypot(dx, dy);
    if (run + seg >= target) {
      const t = (target - run) / (seg || 1);
      return { x: a.x + t * dx, y: a.y + t * dy };
    }
    run += seg;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

d3.json(getParam('data', 'setup.json')).then((data) => {
  const svg = d3.select('#flow');
  svg.selectAll('*').remove();

  const root = svg.append('g').attr('class', 'everything');

  const nodes = (data.nodes || []).map((n) => ({ ...n }));
  const edges = (data.edges || []).map((e) => ({ ...e }));

  measureTextHeights(nodes, widthForNode);

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: data.rankdir || 'LR',
    nodesep: 40,
    ranksep: 56,
    marginx: 50,
    marginy: 50,
    ranker: 'network-simplex'
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) {
    g.setNode(n.id, { width: n._w, height: n._h, label: n.label, type: n.type || 'process' });
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target, { label: e.label || '' });
  }

  dagre.layout(g);

  // defs: arrow marker
  const defs = svg.append('defs');
  defs
    .append('marker')
    .attr('id', 'arrow')
    .attr('markerWidth', 10)
    .attr('markerHeight', 10)
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
    .attr('fill', 'rgba(5,36,12,0.26)');

  // edges
  const linkG = root.append('g').attr('class', 'links');
  const edgeData = edges.map((e) => ({
    ...e,
    points: (g.edge(e.source, e.target)?.points || []).map((p) => ({ x: p.x, y: p.y }))
  }));

  linkG
    .selectAll('path.edge-hit')
    .data(edgeData)
    .join('path')
    .attr('class', 'edge-hit')
    .attr('d', (d) => elbow(d.points, 10));

  linkG
    .selectAll('path.edge')
    .data(edgeData)
    .join('path')
    .attr('class', 'edge')
    .attr('marker-end', 'url(#arrow)')
    .attr('d', (d) => elbow(d.points, 10));

  // edge labels
  const labelG = root.append('g').attr('class', 'edge-labels');
  const labelData = edgeData
    .filter((d) => (d.label || '').trim().length)
    .map((d) => {
      const p = labelAt(d.points);
      return { ...d, _lx: p?.x, _ly: p?.y };
    })
    .filter((d) => Number.isFinite(d._lx) && Number.isFinite(d._ly));

  labelG
    .selectAll('g.edge-label-wrap')
    .data(labelData)
    .join((enter) => {
      const g = enter.append('g').attr('class', 'edge-label-wrap');
      g.append('rect').attr('class', 'edge-label-bg').attr('rx', 999).attr('ry', 999);
      g.append('text').attr('class', 'edge-label').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle');
      return g;
    })
    .attr('transform', (d) => `translate(${d._lx},${d._ly})`)
    .each(function (d) {
      const group = d3.select(this);
      const text = group.select('text').text(d.label);
      const box = text.node().getBBox();
      const padX = 8;
      const padY = 4;
      group
        .select('rect')
        .attr('x', -box.width / 2 - padX)
        .attr('y', -box.height / 2 - padY)
        .attr('width', box.width + padX * 2)
        .attr('height', box.height + padY * 2);
    });

  // nodes
  const nodeG = root.append('g').attr('class', 'nodes');
  const nodeData = nodes.map((n) => {
    const nn = g.node(n.id);
    return { ...n, x: nn.x, y: nn.y, w: nn.width, h: nn.height, type: nn.type };
  });

  const ng = nodeG
    .selectAll('g.node')
    .data(nodeData)
    .join('g')
    .attr('class', (d) => `node ${d.type === 'decision' ? 'decision' : ''}`)
    .attr('transform', (d) => `translate(${d.x},${d.y})`);

  ng
    .append('rect')
    .attr('x', (d) => -d.w / 2)
    .attr('y', (d) => -d.h / 2)
    .attr('width', (d) => d.w)
    .attr('height', (d) => d.h);

  ng
    .append('foreignObject')
    .attr('class', 'node-fo')
    .attr('x', (d) => -d.w / 2)
    .attr('y', (d) => -d.h / 2)
    .attr('width', (d) => d.w)
    .attr('height', (d) => d.h)
    .append('xhtml:div')
    .append('xhtml:span')
    .text((d) => d.label);

  // Fit based on computed geometry (SVG getBBox is unreliable with foreignObject).
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodeData) {
    minX = Math.min(minX, n.x - n.w / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }

  for (const e of edgeData) {
    for (const p of e.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }

  for (const l of labelData) {
    minX = Math.min(minX, l._lx - 40);
    maxX = Math.max(maxX, l._lx + 40);
    minY = Math.min(minY, l._ly - 24);
    maxY = Math.max(maxY, l._ly + 24);
  }

  const margin = 56;
  const vb = {
    x: minX - margin,
    y: minY - margin,
    w: (maxX - minX) + margin * 2,
    h: (maxY - minY) + margin * 2,
  };

  // Default behavior fits entire diagram into the iframe (viewBox).
  // For extremely wide flows, that makes everything unreadably tiny.
  // In that case we keep a stable height and allow horizontal scrolling.
  const aspect = vb.w / Math.max(1, vb.h);
  const isWide = aspect > 2.2;

  svg.attr('viewBox', [vb.x, vb.y, vb.w, vb.h]);

  if (isWide) {
    document.body.style.overflowX = 'auto';
    document.body.style.overflowY = 'hidden';
    // iOS momentum scroll
    document.body.style.webkitOverflowScrolling = 'touch';
    // prevent "fit to width" scaling; make the SVG its natural width
    svg.style('width', vb.w + 'px');
    svg.style('height', '100%');
  } else {
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = 'hidden';
    svg.style('width', '100%');
    svg.style('height', '100%');
  }
});
