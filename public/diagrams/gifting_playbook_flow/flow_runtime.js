(() => {
  const vbBySvg = new WeakMap();
  const roBySvg = new WeakMap();

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
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

  function widthForNode(n) {
    if (n.type === 'decision') return 260;
    if ((n.label || '').length > 28) return 290;
    return 260;
  }

  function measureTextHeights(nodes, widthFor, maxLines) {
    const hidden = document.createElement('div');
    const clamp = Math.max(1, Math.min(6, Number(maxLines ?? 2) || 2));
    hidden.style.cssText = [
      'position:absolute',
      'visibility:hidden',
      'white-space:normal',
      'word-wrap:break-word',
      'display:-webkit-box',
      `-webkit-line-clamp:${clamp}`,
      '-webkit-box-orient:vertical',
      'overflow:hidden',
      'padding:0',
      'margin:0'
    ].join(';');
    document.body.appendChild(hidden);

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
      const tH = wrappedHeight(n.label, Math.max(1, w - sidePad));
      n._h = tH + 24;
      n._w = w;
    }

    document.body.removeChild(hidden);
  }

  function labelAt(points) {
    if (!points || points.length < 2) return null;
    const total = points.reduce(
      (acc, p, i) => (i === 0 ? 0 : acc + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y)),
      0
    );
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

  function computeViewBox(nodeData, edgeData, labelData) {
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
    return {
      x: minX - margin,
      y: minY - margin,
      w: (maxX - minX) + margin * 2,
      h: (maxY - minY) + margin * 2,
    };
  }

  function fitToWidth(svgEl, vb) {
    const wrapper = svgEl.closest('.flow-embed') || svgEl.parentElement;
    if (!wrapper) return;

    const update = () => {
      const w = wrapper.clientWidth;
      if (!w || !Number.isFinite(vb?.w) || vb.w <= 0) return;
      const scale = w / vb.w;
      const h = Math.max(160, Math.ceil(vb.h * scale));
      wrapper.style.height = `${h}px`;
    };

    update();

    if (!roBySvg.has(svgEl) && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => update());
      ro.observe(wrapper);
      roBySvg.set(svgEl, ro);
    } else {
      window.addEventListener('resize', update, { passive: true });
    }
  }

  async function renderFlowDiagram(svgEl, dataUrl) {
    if (!svgEl) throw new Error('renderFlowDiagram: svg element required');
    if (!dataUrl || typeof dataUrl !== 'string') throw new Error('renderFlowDiagram: dataUrl required');
    if (!window.d3) throw new Error('renderFlowDiagram: d3 missing');
    if (!window.dagre) throw new Error('renderFlowDiagram: dagre missing');

    const data = await window.d3.json(dataUrl);
    const wrapper = svgEl.closest('.flow-embed') || svgEl.parentElement;
    const maxLines = Number(wrapper?.getAttribute('data-flow-lines') ?? 2) || 2;

    const svg = window.d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('preserveAspectRatio', 'xMidYMid meet');

    const root = svg.append('g').attr('class', 'everything');

    const nodes = (data.nodes || []).map((n) => ({ ...n }));
    const edges = (data.edges || []).map((e) => ({ ...e }));

    measureTextHeights(nodes, widthForNode, maxLines);

    const g = new window.dagre.graphlib.Graph();
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

    window.dagre.layout(g);

    const arrowId = uid('flow-arrow');
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', arrowId)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 Z')
      .attr('fill', 'rgba(5,36,12,0.26)');

    const edgeData = edges.map((e) => ({
      ...e,
      points: (g.edge(e.source, e.target)?.points || []).map((p) => ({ x: p.x, y: p.y }))
    }));

    const linkG = root.append('g').attr('class', 'links');
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
      .attr('marker-end', `url(#${arrowId})`)
      .attr('d', (d) => elbow(d.points, 10));

    const labelData = edgeData
      .filter((d) => (d.label || '').trim().length)
      .map((d) => {
        const p = labelAt(d.points);
        return { ...d, _lx: p?.x, _ly: p?.y };
      })
      .filter((d) => Number.isFinite(d._lx) && Number.isFinite(d._ly));

    const labelG = root.append('g').attr('class', 'edge-labels');
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
        const group = window.d3.select(this);
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

    const nodeData = nodes.map((n) => {
      const nn = g.node(n.id);
      return { ...n, x: nn.x, y: nn.y, w: nn.width, h: nn.height, type: nn.type };
    });

    const nodeG = root.append('g').attr('class', 'nodes');
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

    const vb = computeViewBox(nodeData, edgeData, labelData);
    vbBySvg.set(svgEl, vb);
    svg.attr('viewBox', [vb.x, vb.y, vb.w, vb.h]);
    fitToWidth(svgEl, vb);
  }

  window.renderFlowDiagram = renderFlowDiagram;
})();
