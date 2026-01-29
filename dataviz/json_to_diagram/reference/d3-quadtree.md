# d3-quadtree
Fork ↗︎
A quadtree recursively partitions two-dimensional space into squares, dividing each square into four equally-sized squares. Each distinct point exists in a unique leaf node; coincident points are represented by a linked list. Quadtrees can accelerate various spatial operations, such as the Barnes–Hut approximation for computing many-body forces, collision detection, and searching for nearby points.

quadtree(data, x, y)
Source · Creates a new, empty quadtree with an empty extent and the default x and y accessors. If data is specified, adds the specified iterable of data to the quadtree.

js
const tree = d3.quadtree(data);
This is equivalent to:

js
const tree = d3.quadtree().addAll(data);
If x and y are also specified, sets the x and y accessors to the specified functions before adding the specified iterable of data to the quadtree, equivalent to:

js
const tree = d3.quadtree().x(x).y(y).addAll(data);
quadtree.x(x)
Source · If x is specified, sets the current x-coordinate accessor and returns the quadtree.

js
const tree = d3.quadtree().x((d) => d.x);
The x accessor is used to derive the x coordinate of data when adding to and removing from the tree. It is also used when finding to re-access the coordinates of data previously added to the tree; therefore, the x and y accessors must be consistent, returning the same value given the same input.

If x is not specified, returns the current x accessor.

js
tree.x() // (d) => d.x
The x accessor defaults to:

js
function x(d) {
  return d[0];
}
quadtree.y(y)
Source · If y is specified, sets the current y-coordinate accessor and returns the quadtree.

js
const tree = d3.quadtree().y((d) => d.y);
The y accessor is used to derive the y coordinate of data when adding to and removing from the tree. It is also used when finding to re-access the coordinates of data previously added to the tree; therefore, the x and y accessors must be consistent, returning the same value given the same input.

If y is not specified, returns the current y accessor.

js
tree.y() // (d) => d.y
The y accessor defaults to:

js
function y(d) {
  return d[1];
}
quadtree.extent(extent)
Source · If extent is specified, expands the quadtree to cover the specified points [[x0, y0], [x1, y1]] and returns the quadtree.

js
const tree = d3.quadtree().extent([[0, 0], [1, 1]]);
If extent is not specified, returns the quadtree’s current extent [[x0, y0], [x1, y1]], where x0 and y0 are the inclusive lower bounds and x1 and y1 are the inclusive upper bounds, or undefined if the quadtree has no extent.

js
tree.extent() // [[0, 0], [2, 2]]
The extent may also be expanded by calling quadtree.cover or quadtree.add.

quadtree.cover(x, y)
Source · Expands the quadtree to cover the specified point ⟨x,y⟩, and returns the quadtree.

js
const tree = d3.quadtree().cover(0, 0).cover(1, 1);
If the quadtree’s extent already covers the specified point, this method does nothing. If the quadtree has an extent, the extent is repeatedly doubled to cover the specified point, wrapping the root node as necessary; if the quadtree is empty, the extent is initialized to the extent [[⌊x⌋, ⌊y⌋], [⌈x⌉, ⌈y⌉]]. (Rounding is necessary such that if the extent is later doubled, the boundaries of existing quadrants do not change due to floating point error.)

quadtree.add(datum)
Source · Adds the specified datum to the quadtree, deriving its coordinates ⟨x,y⟩ using the current x and y accessors, and returns the quadtree.

js
const tree = d3.quadtree().add([0, 0]);
If the new point is outside the current extent of the quadtree, the quadtree is automatically expanded to cover the new point.

quadtree.addAll(data)
Source · Adds the specified iterable of data to the quadtree, deriving each element’s coordinates ⟨x,y⟩ using the current x and y accessors, and return this quadtree.

js
const tree = d3.quadtree().addAll([[0, 0], [1, 2]]);
This is approximately equivalent to calling quadtree.add repeatedly:

js
for (let i = 0, n = data.length; i < n; ++i) {
  quadtree.add(data[i]);
}
However, this method results in a more compact quadtree because the extent of the data is computed first before adding the data.

quadtree.remove(datum)
Source · Removes the specified datum from the quadtree, deriving its coordinates ⟨x,y⟩ using the current x and y accessors, and returns the quadtree.

js
tree.remove(data[0]);
If the specified datum does not exist in this quadtree (as determined by strict equality with datum, and independent of the computed position), this method does nothing.

quadtree.removeAll(data)
Source · Removes the specified data from the quadtree, deriving their coordinates ⟨x,y⟩ using the current x and y accessors, and returns the quadtree.

js
tree.removeAll(data);
If a specified datum does not exist in this quadtree (as determined by strict equality with datum, and independent of the computed position), it is ignored.

quadtree.copy()
js
const t1 = d3.quadtree(data);
const t2 = t1.copy();
Source · Returns a copy of the quadtree. All nodes in the returned quadtree are identical copies of the corresponding node in the quadtree; however, any data in the quadtree is shared by reference and not copied.

quadtree.root()
Source · Returns the root node of the quadtree.

js
tree.root() // [{…}, empty × 2, {…}]
quadtree.data()
Source · Returns an array of all data in the quadtree.

js
tree.data() // [[0, 0], [1, 2]]
quadtree.size()
Source · Returns the total number of data in the quadtree.

js
tree.size() // 2
quadtree.find(x, y, radius)
Source · Returns the datum closest to the position ⟨x,y⟩ with the given search radius. If radius is not specified, it defaults to infinity.

js
tree.find(0.000, 0.000) // [0.025, 0.055]
If there is no datum within the search area, returns undefined.

js
tree.find(10, 10, 1) // undefined
quadtree.visit(callback)
Source · Visits each node in the quadtree in pre-order traversal, invoking the specified callback with arguments node, x0, y0, x1, y1 for each node, where node is the node being visited, ⟨x0, y0⟩ are the lower bounds of the node, and ⟨x1, y1⟩ are the upper bounds, and returns the quadtree. (Assuming that positive x is right and positive y is down, as is typically the case in Canvas and SVG, ⟨x0, y0⟩ is the top-left corner and ⟨x1, y1⟩ is the lower-right corner; however, the coordinate system is arbitrary, so more formally x0 <= x1 and y0 <= y1.)

If the callback returns true for a given node, then the children of that node are not visited; otherwise, all child nodes are visited. This can be used to quickly visit only parts of the tree, for example when using the Barnes–Hut approximation. Note, however, that child quadrants are always visited in sibling order: top-left, top-right, bottom-left, bottom-right. In cases such as search, visiting siblings in a specific order may be faster.

As an example, the following visits the quadtree and returns all the nodes within a rectangular extent [xmin, ymin, xmax, ymax], ignoring quads that cannot possibly contain any such node:

js
function search(quadtree, xmin, ymin, xmax, ymax) {
  const results = [];
  quadtree.visit((node, x1, y1, x2, y2) => {
    if (!node.length) {
      do {
        let d = node.data;
        if (d[0] >= xmin && d[0] < xmax && d[1] >= ymin && d[1] < ymax) {
          results.push(d);
        }
      } while (node = node.next);
    }
    return x1 >= xmax || y1 >= ymax || x2 < xmin || y2 < ymin;
  });
  return results;
}
quadtree.visitAfter(callback)
Source · Visits each node in the quadtree in post-order traversal, invoking the specified callback with arguments node, x0, y0, x1, y1 for each node, where node is the node being visited, ⟨x0, y0⟩ are the lower bounds of the node, and ⟨x1, y1⟩ are the upper bounds, and returns the quadtree. (Assuming that positive x is right and positive y is down, as is typically the case in Canvas and SVG, ⟨x0, y0⟩ is the top-left corner and ⟨x1, y1⟩ is the lower-right corner; however, the coordinate system is arbitrary, so more formally x0 <= x1 and y0 <= y1.) Returns root.

Quadtree nodes
Internal nodes of the quadtree are represented as sparse four-element arrays in left-to-right, top-to-bottom order:

0 - the top-left quadrant, if any.
1 - the top-right quadrant, if any.
2 - the bottom-left quadrant, if any.
3 - the bottom-right quadrant, if any.
A child quadrant may be undefined if it is empty.

Leaf nodes are represented as objects with the following properties:

data - the data associated with this point, as passed to quadtree.add.
next - the next datum in this leaf, if any.
The length property may be used to distinguish leaf nodes from internal nodes: it is undefined for leaf nodes, and 4 for internal nodes. For example, to iterate over all data in a leaf node:

js
if (!node.length) do console.log(node.data); while (node = node.next);
The point’s x and y coordinates must not be modified while the point is in the quadtree. To update a point’s position, remove the point and then re-add it to the quadtree at the new position. Alternatively, you may discard the existing quadtree entirely and create a new one from scratch; this may be more efficient if many of the points have moved.