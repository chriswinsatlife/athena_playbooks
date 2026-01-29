#!/usr/bin/env bun
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = { format: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in' || a === '-i') args.in = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--format' || a === '-f') args.format = argv[++i];
    else if (a === '--debug') args.debug = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function usage() {
  return 'Usage: bun flowrender_athena.js --in <file.md|.mmd> --out <file.{svg,png,jpg,pdf}> [--format svg|png|jpg|pdf]\n';
}

function toDataUrlTtf(ttfBuf) {
  const b64 = Buffer.from(ttfBuf).toString('base64');
  return `data:font/ttf;base64,${b64}`;
}

async function loadFontDataUrls() {
  const figtree = await readFile(resolve(process.cwd(), 'dataviz/fonts/Figtree[wght].ttf'));
  const figtreeItalic = await readFile(resolve(process.cwd(), 'dataviz/fonts/Figtree-Italic[wght].ttf'));
  return {
    figtree: toDataUrlTtf(figtree),
    figtreeItalic: toDataUrlTtf(figtreeItalic),
  };
}

const PAGE_HTML = (fonts) => String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @font-face{
      font-family: 'Figtree';
      src: url('${fonts.figtree}') format('truetype');
      font-weight: 300 900;
      font-style: normal;
      font-display: swap;
    }
    @font-face{
      font-family: 'Figtree';
      src: url('${fonts.figtreeItalic}') format('truetype');
      font-weight: 300 900;
      font-style: italic;
      font-display: swap;
    }
    :root{ --font-family:'Figtree', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif; }
    body{ margin:0; background:#fff; }
    #chart{ padding:0; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script src="https://cdn.jsdelivr.net/npm/@dagrejs/dagre@1.1.5/dist/dagre.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.min.js"></script>
  <script type="module">
    import { parse as parseMermaidAst } from 'https://cdn.jsdelivr.net/npm/@mermaid-js/parser@0.6.3/+esm';
    import { load as yamlLoad } from 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/+esm';

    function stripHtml(s){
      return String(s==null?'':s)
        .replace(/<br\s*\/?>/gi,' ')
        .replace(/<[^>]*>/g,'')
        .trim();
    }

    function mapShape(t){
      const x=(t||'').toLowerCase();
      if(x==='diamond'||x==='rhombus') return 'diamond';
      if(['circle','ellipse','round','stadium'].includes(x)) return 'ellipse';
      return 'rect';
    }

    function detectDir(code){
      const m=code.match(/\bflowchart\s+(TB|BT|LR|RL|TD)\b/i);
      return m? m[1].toUpperCase() : 'LR';
    }

    function extractFromAst(ast){
      const res={nodes:[],links:[]};
      const nodeMap=new Map();
      const addNode=(id,label,type)=>{
        if(!id) return;
        if(!nodeMap.has(id)) nodeMap.set(id,{id,label:stripHtml(label||id),type:mapShape(type)});
      };
      const addEdge=(a,b,label)=>{
        if(!a||!b) return;
        res.links.push({source:a,target:b,label:stripHtml(label)||undefined});
        addNode(a); addNode(b);
      };
      const walk=o=>{
        if(!o||typeof o!=='object') return;
        if(o.type==='node'&&(o.id||o.identifier)) addNode(o.id||o.identifier,o.text||o.label||o.value,o.shape||o.nodeType||o.typeName);
        if(o.type==='edge'||(o.start&&o.end)||(o.from&&o.to)) addEdge(o.start||o.from,o.end||o.to,o.text||o.label);
        for(const k of Object.keys(o)){
          const v=o[k];
          if(Array.isArray(v)) v.forEach(walk);
          else if(v&&typeof v==='object') walk(v);
        }
      };
      walk(ast);
      res.nodes=Array.from(nodeMap.values());
      return res;
    }

    function getNodeEdgeIntersection(node, fromX, fromY){
      const dx=fromX-node.x, dy=fromY-node.y;
      const absDx=Math.abs(dx), absDy=Math.abs(dy);
      const w=(node.width)/2, h=(node.height)/2;
      if(node.type==='ellipse'){
        const a=w,b=h, angle=Math.atan2(dy,dx);
        const cos=Math.cos(angle), sin=Math.sin(angle);
        const t=Math.sqrt(a*a*sin*sin + b*b*cos*cos);
        return { x: node.x + (a*b*cos)/t, y: node.y + (a*b*sin)/t };
      } else if(node.type==='diamond'){
        const t=1/(absDx/w + absDy/h);
        return { x: node.x + dx*t, y: node.y + dy*t };
      } else {
        if(absDx===0&&absDy===0) return {x:node.x,y:node.y};
        const tx=absDx>0? w/absDx : Infinity;
        const ty=absDy>0? h/absDy : Infinity;
        const t=Math.min(tx,ty);
        return { x: node.x + dx*t, y: node.y + dy*t };
      }
    }

    function createSvgEl(name){
      return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    function textSize(label, fontFamily, fontWeight, fontSizePx){
      const svg = createSvgEl('svg');
      svg.setAttribute('width','0');
      svg.setAttribute('height','0');
      svg.style.visibility = 'hidden';
      const t = createSvgEl('text');
      t.textContent = label;
      t.setAttribute('font-family', fontFamily);
      t.setAttribute('font-weight', String(fontWeight));
      t.setAttribute('font-size', String(fontSizePx) + 'px');
      svg.appendChild(t);
      document.body.appendChild(svg);
      const box = t.getBBox();
      svg.remove();
      return { w: Math.ceil(box.width), h: Math.ceil(box.height) };
    }

    async function renderFromText(mdText, options={}){
      const chart = document.getElementById('chart');
      chart.innerHTML='';

      const defaults = {
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Figtree, sans-serif',
        fontWeight: 650,
        labelOffset: 14,
        nodePadX: 30,
        nodePadY: 20,
        nodesep: 90,
        ranksep: 90,
        startGap: 12,
        endGap: 18,
        diamondMinW: 150,
        diamondMinH: 90,
        fontMinPx: 12,
        fontMaxPx: 18,
        nodeStroke: '#05240C',
        nodeFill: '#f6fbf7',
        nodeStrokeWidth: 2.2,
        nodeRadius: 12,
        edgeStroke: 'rgba(0,0,0,0.55)',
        edgeStrokeWidth: 2.0
      };
      const settings = Object.assign({}, defaults, options||{});

      let fm = {};
      let body = mdText;
      if (mdText.startsWith('---')) {
        const idx = mdText.indexOf('\n---', 3);
        if (idx !== -1) {
          const yaml = mdText.slice(3, idx).replace(/^\n/, '');
          fm = yaml ? yamlLoad(yaml) || {} : {};
          body = mdText.slice(idx + 4);
        }
      }

      const mermaidBlockRE = new RegExp("\x60\x60\x60\\s*mermaid\\s*\\n([\\s\\S]*?)\\n\x60\x60\x60","i");
      const m = body.match(mermaidBlockRE);
      const mermaidCode = m ? m[1].trim() : body.trim();

      for (const [k,v] of Object.entries(fm)){
        if (k==='stroke') settings.nodeStroke=v;
        else if (k==='fill') settings.nodeFill=v;
        else if (k in settings) settings[k]=v;
      }

      const rankdir = fm.rankdir || detectDir(mermaidCode);

      let nodes=[], links=[];
      try {
        const ast = parseMermaidAst('flowchart', mermaidCode);
        const g0 = extractFromAst(ast);
        nodes = g0.nodes;
        links = g0.links;
      } catch {
        // fallback to Mermaid DB parsing
      }

      if (!nodes.length && window.mermaid?.mermaidAPI) {
        window.mermaid.mermaidAPI.initialize({ startOnLoad:false });
        const diagram = await window.mermaid.mermaidAPI.getDiagramFromText(mermaidCode);
        const db = diagram.db;
        const verts = typeof db.getVertices === 'function' ? db.getVertices() : null;
        if (verts) {
          const iter = verts instanceof Map ? verts.entries() : Object.entries(verts);
          for (const [id,v] of iter) {
            nodes.push({ id, label: stripHtml(v.text||id), type: mapShape(v.type) });
          }
        }
        const edges = typeof db.getEdges === 'function' ? db.getEdges() : [];
        for (const e of edges) {
          links.push({ source: e.start, target: e.end, label: stripHtml(e.text)||undefined });
        }
      }

      if (!nodes.length) throw new Error('No nodes parsed from diagram');

      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir, nodesep: settings.nodesep, ranksep: settings.ranksep, marginx:30, marginy:30, ranker:'network-simplex' });
      g.setDefaultEdgeLabel(function(){return {};});

      function pickFontSize(label, type){
        const maxW = type==='diamond'? 320:260;
        let size = settings.fontMaxPx;
        for (; size>=settings.fontMinPx; size--){
          const t = textSize(label, settings.fontFamily, settings.fontWeight, size);
          if (t.w <= maxW-32) return { size, t };
        }
        return { size: settings.fontMinPx, t: textSize(label, settings.fontFamily, settings.fontWeight, settings.fontMinPx) };
      }

      nodes.forEach((node) => {
        const fs = pickFontSize(node.label||node.id, node.type);
        node.fontSize = fs.size;
        const padX=settings.nodePadX, padY=settings.nodePadY;
        let baseMinW = node.type==='diamond'? settings.diamondMinW : 120;
        let baseMinH = node.type==='diamond'? settings.diamondMinH : 56;
        let width=Math.max(fs.t.w+padX, baseMinW);
        let height=Math.max(fs.t.h+padY, baseMinH);
        if (node.type==='diamond'){
          width=Math.max(width, Math.ceil(fs.t.w*1.6)+padX);
          if (width < height+50) width = height+50;
        }
        node.width=width;
        node.height=height;
        g.setNode(node.id, { label: node.label, width, height, type: node.type });
      });

      links.forEach((link) => {
        g.setEdge(link.source, link.target, { label: link.label, weight: link.label?5:1, minlen:1 });
      });

      dagre.layout(g);

      nodes.forEach((n) => {
        const gn = g.node(n.id);
        n.x=gn.x; n.y=gn.y; n.width=gn.width; n.height=gn.height;
      });

      const graphInfo = g.graph();
      const width = graphInfo.width + 60;
      const height = graphInfo.height + 60;

      const svg = createSvgEl('svg');
      svg.setAttribute('id','chartSvg');
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      // Styling lives inside the SVG so it works when embedded via <img>.
      // Keep the palette close to athena.com: deep green ink + soft mint surfaces.
      const fontFamilyCss = String(settings.fontFamily || "Figtree, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif").replace(/'/g, '');
      const styleEl = createSvgEl('style');
      styleEl.textContent = [
        ':root{',
          '  --a-ink: #05240C;',
          '  --a-ink-2: #062812;',
        '  --a-node-fill: url(#nodeGrad);',
          '  --a-node-stroke: #05240C;',
          '  --a-edge: rgba(0,0,0,0.46);',
          '  --a-edge-label-bg: rgba(255,255,255,0.92);',
          '  --a-edge-label-stroke: rgba(0,0,0,0.08);',
          '  --a-text: rgba(0,0,0,0.86);',
        '}',
        '.canvas-bg{',
        '  fill: url(#canvasGrad);',
        '  stroke: rgba(0,0,0,0.05);',
        '  stroke-width: 1;',
        '}',
        '.node-shape{',
        '  fill: var(--a-node-fill);',
        '  stroke: var(--a-node-stroke);',
        '  stroke-width: ' + settings.nodeStrokeWidth + ';',
        '  filter: url(#nodeShadow);',
        '}',
        '.node-decision{',
        '  fill: url(#decisionGrad);',
        '  stroke-dasharray: 6 6;',
        '}',
        '.edge-path{',
        '  stroke: var(--a-edge);',
        '  stroke-width: ' + settings.edgeStrokeWidth + ';',
        '  stroke-linecap: round;',
        '  stroke-linejoin: round;',
        '  fill: none;',
        '}',
        '.node-label{',
        '  fill: var(--a-text);',
        '  font-family: ' + fontFamilyCss + ';',
        '  font-weight: ' + settings.fontWeight + ';',
        '  letter-spacing: -0.01em;',
        '}',
        '.edge-label{',
        '  fill: rgba(0,0,0,0.74);',
        '  font-family: ' + fontFamilyCss + ';',
        '  font-weight: 700;',
        '}',
        '.edge-label-bg{',
        '  fill: var(--a-edge-label-bg);',
        '  stroke: var(--a-edge-label-stroke);',
        '  stroke-width: 1;',
        '}',
      ].join('\n');

      const defs = createSvgEl('defs');

      const canvasGrad = createSvgEl('linearGradient');
      canvasGrad.setAttribute('id', 'canvasGrad');
      canvasGrad.setAttribute('x1', '0');
      canvasGrad.setAttribute('y1', '0');
      canvasGrad.setAttribute('x2', '0');
      canvasGrad.setAttribute('y2', '1');
      const cg1 = createSvgEl('stop');
      cg1.setAttribute('offset', '0%');
      cg1.setAttribute('stop-color', '#FBFDFB');
      const cg2 = createSvgEl('stop');
      cg2.setAttribute('offset', '100%');
      cg2.setAttribute('stop-color', '#F3F8F3');
      canvasGrad.appendChild(cg1);
      canvasGrad.appendChild(cg2);
      defs.appendChild(canvasGrad);

      const nodeGrad = createSvgEl('linearGradient');
      nodeGrad.setAttribute('id', 'nodeGrad');
      nodeGrad.setAttribute('x1', '0');
      nodeGrad.setAttribute('y1', '0');
      nodeGrad.setAttribute('x2', '1');
      nodeGrad.setAttribute('y2', '1');
      const ng1 = createSvgEl('stop');
      ng1.setAttribute('offset', '0%');
      ng1.setAttribute('stop-color', '#FFFFFF');
      const ng2 = createSvgEl('stop');
      ng2.setAttribute('offset', '100%');
      ng2.setAttribute('stop-color', '#F2FAF3');
      nodeGrad.appendChild(ng1);
      nodeGrad.appendChild(ng2);
      defs.appendChild(nodeGrad);

      const decisionGrad = createSvgEl('linearGradient');
      decisionGrad.setAttribute('id', 'decisionGrad');
      decisionGrad.setAttribute('x1', '0');
      decisionGrad.setAttribute('y1', '0');
      decisionGrad.setAttribute('x2', '1');
      decisionGrad.setAttribute('y2', '1');
      const dg1 = createSvgEl('stop');
      dg1.setAttribute('offset', '0%');
      dg1.setAttribute('stop-color', '#EEF8EF');
      const dg2 = createSvgEl('stop');
      dg2.setAttribute('offset', '100%');
      dg2.setAttribute('stop-color', '#FFFFFF');
      decisionGrad.appendChild(dg1);
      decisionGrad.appendChild(dg2);
      defs.appendChild(decisionGrad);

      const filter = createSvgEl('filter');
      filter.setAttribute('id', 'nodeShadow');
      filter.setAttribute('x', '-20%');
      filter.setAttribute('y', '-20%');
      filter.setAttribute('width', '140%');
      filter.setAttribute('height', '140%');
      const fe = createSvgEl('feDropShadow');
      fe.setAttribute('dx', '0');
      fe.setAttribute('dy', '2');
      fe.setAttribute('stdDeviation', '2.4');
      fe.setAttribute('flood-color', 'rgba(0,0,0,0.08)');
      filter.appendChild(fe);
      defs.appendChild(filter);

      const marker = createSvgEl('marker');
      marker.setAttribute('id','arrowhead');
      marker.setAttribute('markerWidth','8');
      marker.setAttribute('markerHeight','8');
      marker.setAttribute('refX','8');
      marker.setAttribute('refY','4');
      marker.setAttribute('orient','auto');
      const mpath = createSvgEl('path');
      mpath.setAttribute('d','M 0 0 L 8 4 L 0 8 Z');
      mpath.setAttribute('fill', 'rgba(0,0,0,0.46)');
      marker.appendChild(mpath);
      defs.appendChild(marker);

      defs.appendChild(styleEl);
      svg.appendChild(defs);

      const canvas = createSvgEl('rect');
      canvas.setAttribute('class', 'canvas-bg');
      canvas.setAttribute('x', '0');
      canvas.setAttribute('y', '0');
      canvas.setAttribute('width', String(width));
      canvas.setAttribute('height', String(height));
      canvas.setAttribute('rx', '24');
      canvas.setAttribute('ry', '24');
      svg.appendChild(canvas);

      const edgesG = createSvgEl('g');
      edgesG.setAttribute('class','edges');
      const nodesG = createSvgEl('g');
      nodesG.setAttribute('class','nodes');
      svg.appendChild(edgesG);
      svg.appendChild(nodesG);

      links.forEach((link) => {
        const e = g.edge(link.source, link.target);
        let pts = (e && e.points) ? e.points.map((p) => ({x:p.x,y:p.y})) : [];
        if (pts.length < 2) return;

        const src = g.node(link.source);
        const tgt = g.node(link.target);
        if (src && pts[1]) pts[0] = getNodeEdgeIntersection({x:src.x,y:src.y,width:src.width,height:src.height,type:src.type}, pts[1].x, pts[1].y);
        if (tgt && pts[pts.length-2]) pts[pts.length-1] = getNodeEdgeIntersection({x:tgt.x,y:tgt.y,width:tgt.width,height:tgt.height,type:tgt.type}, pts[pts.length-2].x, pts[pts.length-2].y);

        if (pts[1]){
          const vx0=pts[1].x-pts[0].x, vy0=pts[1].y-pts[0].y;
          const len0=Math.hypot(vx0,vy0)||1;
          pts[0]={ x: pts[0].x + (vx0/len0)*settings.startGap, y: pts[0].y + (vy0/len0)*settings.startGap };
        }
        if (pts.length>=2){
          const n=pts.length;
          const vx1=pts[n-2].x-pts[n-1].x, vy1=pts[n-2].y-pts[n-1].y;
          const len1=Math.hypot(vx1,vy1)||1;
          pts[n-1]={ x: pts[n-1].x + (vx1/len1)*settings.endGap, y: pts[n-1].y + (vy1/len1)*settings.endGap };
        }

        const dStr = pts.map((p,i)=> (i===0?'M ':'L ') + p.x + ' ' + p.y).join(' ');
        const path = createSvgEl('path');
        path.setAttribute('d', dStr);
        path.setAttribute('class', 'edge-path');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        edgesG.appendChild(path);

        if (link.label && pts.length >= 2){
          const mid = pts[Math.floor(pts.length/2)];
          const labelFontSize = 12;
          const s = textSize(link.label, settings.fontFamily, settings.fontWeight, labelFontSize);
          const padX = 8;
          const padY = 4;

          const bg = createSvgEl('rect');
          bg.setAttribute('class', 'edge-label-bg');
          bg.setAttribute('x', String(mid.x - (s.w / 2) - padX));
          bg.setAttribute('y', String((mid.y - settings.labelOffset) - (s.h / 2) - padY));
          bg.setAttribute('width', String(s.w + padX * 2));
          bg.setAttribute('height', String(s.h + padY * 2));
          bg.setAttribute('rx', '999');
          bg.setAttribute('ry', '999');
          edgesG.appendChild(bg);

          const text = createSvgEl('text');
          text.textContent = link.label;
          text.setAttribute('class','edge-label');
          text.setAttribute('x', String(mid.x));
          text.setAttribute('y', String(mid.y - settings.labelOffset));
          text.setAttribute('text-anchor','middle');
          text.setAttribute('dominant-baseline','middle');
          text.setAttribute('font-size', String(labelFontSize) + 'px');
          edgesG.appendChild(text);
        }
      });

      nodes.forEach((d) => {
        const gEl = createSvgEl('g');
        gEl.setAttribute('class','node');
        gEl.setAttribute('transform', 'translate(' + d.x + ', ' + d.y + ')');
        const w=d.width/2, h=d.height/2;
        if (d.type === 'ellipse'){
          const el = createSvgEl('ellipse');
          el.setAttribute('cx','0');
          el.setAttribute('cy','0');
          el.setAttribute('rx', String(w));
          el.setAttribute('ry', String(h));
          el.setAttribute('class','node-shape');
          gEl.appendChild(el);
        } else if (d.type === 'diamond'){
          const r = createSvgEl('rect');
          r.setAttribute('x', String(-w));
          r.setAttribute('y', String(-h));
          r.setAttribute('width', String(w*2));
          r.setAttribute('height', String(h*2));
          r.setAttribute('rx', String(settings.nodeRadius + 6));
          r.setAttribute('ry', String(settings.nodeRadius + 6));
          r.setAttribute('class','node-shape node-decision');
          gEl.appendChild(r);
        } else {
          const r = createSvgEl('rect');
          r.setAttribute('x', String(-w));
          r.setAttribute('y', String(-h));
          r.setAttribute('width', String(w*2));
          r.setAttribute('height', String(h*2));
          r.setAttribute('rx', String(settings.nodeRadius));
          r.setAttribute('ry', String(settings.nodeRadius));
          r.setAttribute('class','node-shape');
          gEl.appendChild(r);
        }

        const t = createSvgEl('text');
        t.textContent = d.label;
        t.setAttribute('class','node-label');
        t.setAttribute('x','0');
        t.setAttribute('y','0');
        t.setAttribute('text-anchor','middle');
        t.setAttribute('dominant-baseline','middle');
        t.setAttribute('font-size', String(d.fontSize||12) + 'px');
        nodesG.appendChild(gEl);
        gEl.appendChild(t);
      });

      chart.appendChild(svg);
      return { ok:true };
    }

    window.renderFromText = renderFromText;
  </script>
</body>
</html>`;

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.in || !args.out) {
    process.stdout.write(usage());
    process.exit(args.help ? 0 : 2);
  }

  const inputPath = resolve(process.cwd(), args.in);
  const outPath = resolve(process.cwd(), args.out);
  const md = await readFile(inputPath, 'utf8');
  const format = (args.format || extname(outPath).slice(1)).toLowerCase();

  const fonts = await loadFontDataUrls();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(PAGE_HTML(fonts), { waitUntil: 'load' });

  if (args.debug) {
    page.on('console', (msg) => console.log(`[page:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.error('[pageerror]', err));
  }

  await page.waitForFunction(() => typeof window.renderFromText === 'function', { timeout: 60000 });
  await page.evaluate(async (text) => { await window.renderFromText(text); }, md);

  const vb = await page.evaluate(() => {
    const svg = document.getElementById('chartSvg');
    if (!svg) return null;
    const vb = svg.viewBox.baseVal;
    return { w: vb.width, h: vb.height };
  });
  if (!vb) throw new Error('No SVG rendered');

  await mkdir(dirname(outPath), { recursive: true });

  if (format === 'svg') {
    const svgString = await page.evaluate(() => new XMLSerializer().serializeToString(document.getElementById('chartSvg')));
    await writeFile(outPath, svgString, 'utf8');
  } else if (format === 'png' || format === 'jpg' || format === 'jpeg') {
    await page.setViewportSize({ width: Math.ceil(vb.w), height: Math.ceil(vb.h) });
    await page.evaluate((vb) => {
      const svg = document.getElementById('chartSvg');
      if (!svg) return;
      svg.setAttribute('width', String(vb.w));
      svg.setAttribute('height', String(vb.h));
      svg.style.width = vb.w + 'px';
      svg.style.height = vb.h + 'px';
    }, vb);
    const locator = page.locator('#chartSvg');
    await locator.screenshot({ path: outPath, type: format === 'png' ? 'png' : 'jpeg', timeout: 60000 });
  } else if (format === 'pdf') {
    const inchW = vb.w / 96;
    const inchH = vb.h / 96;
    await page.pdf({ path: outPath, width: `${inchW}in`, height: `${inchH}in`, printBackground: true, pageRanges: '1' });
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  await browser.close();
  if (args.debug) console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(70);
});
