// Load data from external JSON file
d3.json("data.json").then(data => {
  const root = d3.hierarchy(data);
  
  // Hidden measure div - smarter AI's bulletproof approach
  const hiddenMeasure = document.createElement("div");
  hiddenMeasure.style.cssText = `
    position:absolute;
    visibility:hidden;
    white-space:normal;
    word-wrap:break-word;
    padding:0;
    margin:0;
  `;
  document.body.appendChild(hiddenMeasure);

  // Sync font styles once using probe element
  (function syncFontStyles() {
    const probe = document.createElement("div");
    probe.className = "node-fo";
    probe.style.cssText = "position:absolute;visibility:hidden";
    probe.innerHTML = "<div>A</div>";
    document.body.appendChild(probe);

    const probeInner = probe.firstElementChild;
    const c = getComputedStyle(probeInner);

    // Copy only font-related props
    hiddenMeasure.style.font = c.font;
    hiddenMeasure.style.letterSpacing = c.letterSpacing;

    document.body.removeChild(probe);
  })();

  function measureWrapped(txt, widthPx){
    hiddenMeasure.style.width = widthPx + "px";
    hiddenMeasure.textContent = txt;
    return hiddenMeasure.scrollHeight;
  }

  function rectWidth(d){
    switch(d.depth){
      case 0: return 220;
      case 1: return 180;
      case 2: return 160;
      default: return 140;
    }
  }

  function isGroup(n){ return n.children && n.children.length > 0; }

  // Calculate node heights first (keep this - we need it for nodeSize)
  root.each(d => {
    const w = rectWidth(d);
    const sidePad = 12;
    const tH = measureWrapped(d.data.name, w - sidePad);
    d.data.nodeHeight = tH + 12;
  });

  // Spacing constants
  const siblingSpacing = 20;
  const groupSpacing = 100;
  const horizontalSpacing = 240;

  // Hybrid d3.tree() with pixel-perfect vertical spacing.
  // We cheat by setting nodeSize to [1, horizontalSpacing] and letting the
  // separation function return an *absolute* pixel distance between node
  // centres. That lets us factor in each node’s real height plus our
  // sibling/group gaps.

  const treeLayout = d3.tree()
    // nodeSize: [verticalUnit, horizontalUnit]
    // We keep verticalUnit == 1 so separation() can directly return pixels.
    .nodeSize([1, horizontalSpacing])
    .separation((a, b) => {
      // Base gap depends on relationship and whether either node is a group.
      const baseGap = (a.parent === b.parent)
        ? ((isGroup(a) || isGroup(b)) ? groupSpacing : siblingSpacing)
        : groupSpacing;

      // Desired distance between *centres* is half of each height + baseGap.
      return (a.data.nodeHeight + b.data.nodeHeight) / 2 + baseGap;
    });

  // Apply the d3.tree layout
  treeLayout(root);

  // d3.tree() puts x=breadth(vertical), y=depth(horizontal)  
  // We want x=depth(horizontal), y=breadth(vertical)
  // So we need to swap coordinates and scale appropriately
  root.descendants().forEach(d => {
    const treeX = d.x;  // d3's x (breadth/vertical) - scaled 0-800
    const treeY = d.y;  // d3's y (depth/horizontal) - scaled 0-600
    
    // Convert to our coordinate system
    d.x = treeY * (horizontalSpacing / 150);  // Scale horizontal spacing
    d.y = treeX - 400;  // Center vertically and use tree's vertical layout
  });

  const svg = d3.select("#mindmap");
  const gAll = svg.append("g").attr("class","everything");
  const nodes = root.descendants();
  const links = root.links();

  function roundedRectilinear(px, py, cx, cy){
    const mid = (px + cx)/2;
    const radius = 15;
    
    if (py === cy) {
      return `M${px},${py}L${cx},${cy}`;
    }
    
    return `M${px},${py}L${mid},${py}L${mid},${cy}L${cx},${cy}`;
  }

  function roundedRectilinearWithCurve(px, py, cx, cy){
    const mid = (px + cx)/2;
    const radius = 15;
    
    if (py === cy) {
      return `M${px},${py}L${cx},${cy}`;
    }
    
    if (py < cy) {
      return `M${px},${py}L${mid},${py}L${mid},${cy-radius}Q${mid},${cy} ${mid+radius},${cy}L${cx},${cy}`;
    } else {
      return `M${px},${py}L${mid},${py}L${mid},${cy+radius}Q${mid},${cy} ${mid+radius},${cy}L${cx},${cy}`;
    }
  }

  function leftEdge(d){ return d.x - rectWidth(d)/2; }
  function rightEdge(d){ return d.x + rectWidth(d)/2; }

  // Draw links with our rounded corners logic
  gAll.selectAll("path.link")
    .data(links)
    .join("path")
    .attr("class", d => `link level${d.target.depth}-link`)
    .attr("d", d => {
      const sx = rightEdge(d.source);
      const sy = d.source.y;
      const tx = leftEdge(d.target);
      const ty = d.target.y;
      
      // Check if this child is at the top or bottom of its parent's children
      const parent = d.source;
      const children = parent.children || [];
      const childIndex = children.indexOf(d.target);
      const isTopChild = childIndex === 0;
      const isBottomChild = childIndex === children.length - 1;
      
      // Apply rounding if AT top or bottom of branch (very top/bottom)
      if (isTopChild || isBottomChild) {
        return roundedRectilinearWithCurve(sx, sy, tx, ty); // Rounded corners
      } else {
        return roundedRectilinear(sx, sy, tx, ty); // Sharp corners
      }
    });

  // Draw nodes
  const nodeG = gAll.selectAll("g.node")
    .data(nodes)
    .join("g")
    .attr("class", d => `node level${d.depth}-node`)
    .attr("transform", d => `translate(${d.x},${d.y})`);

  nodeG.append("rect")
    .each(function(d){
      const w = rectWidth(d);
      const h = d.data.nodeHeight;
      d3.select(this)
        .attr("x", -w/2)
        .attr("y", -h/2)
        .attr("width", w)
        .attr("height", h);
    });

  nodeG.append("foreignObject")
    .attr("class","node-fo")
    .each(function(d){
      const w = rectWidth(d);
      const h = d.data.nodeHeight;
      d3.select(this)
        .attr("x", -w/2)
        .attr("y", -h/2)
        .attr("width", w)
        .attr("height", h)
        .append("xhtml:div")
        .html(d.data.name);
    });

  // Fit diagram in viewBox
  const bbox = gAll.node().getBBox();
  const margin = 50;
  svg.attr("viewBox",[bbox.x - margin, bbox.y - margin, bbox.width + margin*2, bbox.height + margin*2]);
  
  // Clean up measuring div
  document.body.removeChild(hiddenMeasure);
});