# d3-fetch
This module provides convenient parsing on top of Fetch. For example, to load a text file:

js
const text = await d3.text("hello-world.txt"); // "Hello, world!"
To load and parse a CSV file:

js
const data = await d3.csv("hello-world.csv"); // [{"Hello": "world"}, …]
This module has built-in support for parsing JSON, CSV, and TSV. You can parse additional formats by using text directly. (This module replaced d3-request.)

blob(input, init)
js
const blob = await d3.blob("example.db");
Source · Fetches the binary file at the specified input URL as a Blob. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields.

buffer(input, init)
js
const buffer = await d3.buffer("example.db");
Source · Fetches the binary file at the specified input URL as an ArrayBuffer. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields.

csv(input, init, row)
js
const data = await d3.csv("example.csv");
Source · Equivalent to d3.dsv with the comma character as the delimiter.

dsv(delimiter, input, init, row)
js
const data = await d3.dsv(",", "example.csv");
Source · Fetches the DSV file at the specified input URL. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields. An optional row conversion function may be specified to map and filter row objects to a more-specific representation; see dsv.parse for details. For example:

js
const data = await d3.dsv(",", "example.csv", (d) => {
  return {
    year: new Date(+d.Year, 0, 1), // convert "Year" column to Date
    make: d.Make,
    model: d.Model,
    length: +d.Length // convert "Length" column to number
  };
});
If only one of init and row is specified, it is interpreted as the row conversion function if it is a function, and otherwise an init object. See also d3.csv and d3.tsv.

html(input, init)
js
const document = await d3.html("example.html");
Source · Fetches the file at the specified input URL as text and then parses it as HTML. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields.

image(input, init)
js
const image = await d3.image("example.png");
Source · Fetches the image at the specified input URL. If init is specified, sets any additional properties on the image before loading. For example, to enable an anonymous cross-origin request:

js
const image = await d3.image("https://example.com/image.png", {crossOrigin: "anonymous"});
json(input, init)
js
const data = await d3.json("example.json");
Source · Fetches the JSON file at the specified input URL. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields. If the server returns a status code of 204 No Content or 205 Reset Content, the promise resolves to undefined.

svg(input, init)
js
const document = await d3.svg("example.svg");
Source · Fetches the file at the specified input URL as text and then parses it as SVG. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields.

text(input, init)
js
const text = await d3.text("example.txt");
Source · Fetches the text file at the specified input URL. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields.

tsv(input, init, row)
js
const data = await d3.tsv("example.tsv");
Source · Equivalent to d3.dsv with the tab character as the delimiter.

xml(input, init)
js
const document = await d3.xml("example.xml");
Source · Fetches the file at the specified input URL as text and then parses it as XML. If init is specified, it is passed along to the underlying call to fetch; see RequestInit for allowed fields.