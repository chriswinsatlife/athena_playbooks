# d3-polygon
This module provides a few basic geometric operations for two-dimensional polygons. Each polygon is represented as an array of two-element arrays [​[x0, y0], [x1, y1], …], and may either be closed (wherein the first and last point are the same) or open (wherein they are not). Typically polygons are in counterclockwise order, assuming a coordinate system where the origin is in the top-left corner.

polygonArea(polygon)
js
d3.polygonArea([[1, 1], [1.5, 0], [2, 1]]) // -0.5
Source · Returns the signed area of the specified polygon. If the vertices of the polygon are in counterclockwise order (assuming a coordinate system where the origin is in the top-left corner), the returned area is positive; otherwise it is negative, or zero.

polygonCentroid(polygon)
js
d3.polygonCentroid([[1, 1], [1.5, 0], [2, 1]]) // [1.5, 0.6666666666666666]
Source · Returns the centroid of the specified polygon.

polygonHull(points)
js
d3.polygonHull(points) // [[3.0872864263338777, -1.300100095019402], [1.6559368816733773, -2.5092525689499605], …]
Source · Returns the convex hull of the specified points using Andrew’s monotone chain algorithm. The returned hull is represented as an array containing a subset of the input points arranged in counterclockwise order. Returns null if points has fewer than three elements.

polygonContains(polygon, point)
js
d3.polygonContains([[1, 1], [1.5, 0], [2, 1]], [1.5, 0.667]) // true
Source · Returns true if and only if the specified point is inside the specified polygon.

polygonLength(polygon)
js
d3.polygonLength([[1, 1], [1.5, 0], [2, 1]]) // 3.23606797749979
Source · Returns the length of the perimeter of the specified polygon.