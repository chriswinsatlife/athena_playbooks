// Analyze data structure and calculate optimal spacing
function analyzeStructure(root) {
  const analysis = {
    maxDepth: 0,
    totalNodes: 0,
    nodesPerLevel: {},
    maxChildrenPerNode: 0,
    avgChildrenPerNode: 0,
    maxSiblingsAtLevel: {},
    totalGroups: 0
  };

  // Traverse and collect statistics
  root.each(d => {
    analysis.totalNodes++;
    analysis.maxDepth = Math.max(analysis.maxDepth, d.depth);
    
    // Count nodes per level
    if (!analysis.nodesPerLevel[d.depth]) {
      analysis.nodesPerLevel[d.depth] = 0;
    }
    analysis.nodesPerLevel[d.depth]++;
    
    // Count children
    const childCount = d.children ? d.children.length : 0;
    analysis.maxChildrenPerNode = Math.max(analysis.maxChildrenPerNode, childCount);
    
    if (childCount > 0) {
      analysis.totalGroups++;
      
      // Track max siblings at this level
      if (!analysis.maxSiblingsAtLevel[d.depth + 1]) {
        analysis.maxSiblingsAtLevel[d.depth + 1] = 0;
      }
      analysis.maxSiblingsAtLevel[d.depth + 1] = Math.max(
        analysis.maxSiblingsAtLevel[d.depth + 1], 
        childCount
      );
    }
  });

  // Calculate average children per group
  analysis.avgChildrenPerNode = analysis.totalGroups > 0 ? 
    (analysis.totalNodes - 1) / analysis.totalGroups : 0;

  return analysis;
}

// Calculate dynamic spacing based on structure analysis
function calculateDynamicSpacing(analysis) {
  console.log('Structure Analysis:', analysis);
  
  // Base spacing values
  const baseHorizontal = 200;
  const baseSibling = 15;
  const baseGroup = 45;
  
  // Adjust horizontal spacing based on multiple factors
  const maxNodesInLevel = Math.max(...Object.values(analysis.nodesPerLevel));
  const totalComplexity = analysis.totalNodes * analysis.maxDepth;
  
  // More sophisticated horizontal spacing calculation
  let horizontalSpacing = baseHorizontal;
  
  // Factor 1: Depth (more columns need more space)
  horizontalSpacing += (analysis.maxDepth * 25);
  
  // Factor 2: Node density (more nodes per level = need more space to breathe)
  horizontalSpacing += (maxNodesInLevel * 8);
  
  // Factor 3: Total complexity (big datasets need more space)
  if (analysis.totalNodes > 20) {
    horizontalSpacing += 40;
  }
  if (analysis.totalNodes > 40) {
    horizontalSpacing += 40;
  }
  
  // Factor 4: Group complexity (more branching = need more space)
  horizontalSpacing += (analysis.maxChildrenPerNode * 10);
  
  // Adjust sibling spacing based on node density
  // More nodes per level = tighter spacing
  const siblingSpacing = Math.max(
    baseSibling - (maxNodesInLevel * 2), 
    8  // minimum spacing
  );
  
  // Adjust group spacing based on complexity
  // More children per group = need more separation
  const groupSpacing = Math.max(
    baseGroup + (analysis.maxChildrenPerNode * 5),
    siblingSpacing + 20  // always bigger than sibling spacing
  );
  
  // Dynamic corner radius based on horizontal spacing
  const cornerRadius = Math.max(
    5,  // minimum radius for tight layouts
    Math.min(
      17, // maximum radius for very wide layouts
      7 + (horizontalSpacing - 200) / 15 // scale with spacing
    )
  );
  
  const spacing = {
    horizontal: horizontalSpacing,
    sibling: siblingSpacing,
    group: groupSpacing,
    cornerRadius: cornerRadius
  };
  
  console.log('Calculated Spacing:', spacing);
  return spacing;
}

// Load SMALL data from external JSON file
d3.json("data_large.json").then(data => {
  const root = d3.hierarchy(data);
  
  // Analyze structure and calculate dynamic spacing
  const analysis = analyzeStructure(root);
  const spacing = calculateDynamicSpacing(analysis);
  
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

  // Calculate node heights
  root.each(d => {
    const w = rectWidth(d);
    const sidePad = 12;
    const tH = measureWrapped(d.data.name, w - sidePad);
    d.data.nodeHeight = tH + 12;
  });

  // Use dynamic spacing values
  const siblingSpacing = spacing.sibling;
  const groupSpacing = spacing.group;
  const horizontalSpacing = spacing.horizontal;
  const cornerRadius = spacing.cornerRadius;

  // Hybrid d3.tree() with pixel-perfect vertical spacing.
  const treeLayout = d3.tree()
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

  // Swap coordinates for our layout
  root.descendants().forEach(d => {
    const treeX = d.x;
    const treeY = d.y;
    
    d.x = treeY;
    d.y = treeX;
  });

  const svg = d3.select("#mindmap");
  const gAll = svg.append("g").attr("class","everything");
  const nodes = root.descendants();
  const links = root.links();

  function roundedRectilinear(px, py, cx, cy){
    const mid = (px + cx)/2;
    
    if (py === cy) {
      return `M${px},${py}L${cx},${cy}`;
    }
    
    return `M${px},${py}L${mid},${py}L${mid},${cy}L${cx},${cy}`;
  }

  function roundedRectilinearWithCurve(px, py, cx, cy){
    const mid = (px + cx)/2;
    
    if (py === cy) {
      return `M${px},${py}L${cx},${cy}`;
    }
    
    if (py < cy) {
      return `M${px},${py}L${mid},${py}L${mid},${cy-cornerRadius}Q${mid},${cy} ${mid+cornerRadius},${cy}L${cx},${cy}`;
    } else {
      return `M${px},${py}L${mid},${py}L${mid},${cy+cornerRadius}Q${mid},${cy} ${mid+cornerRadius},${cy}L${cx},${cy}`;
    }
  }

  function leftEdge(d){ return d.x - rectWidth(d)/2; }
  function rightEdge(d){ return d.x + rectWidth(d)/2; }

  // Draw links with rounded corners logic
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
      
      // Apply rounding if AT top or bottom of branch
      if (isTopChild || isBottomChild) {
        return roundedRectilinearWithCurve(sx, sy, tx, ty);
      } else {
        return roundedRectilinear(sx, sy, tx, ty);
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