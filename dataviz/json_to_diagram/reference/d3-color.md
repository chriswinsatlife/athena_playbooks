# d3-color
Even though your browser understands a lot about colors, it doesn’t offer much help in manipulating colors through JavaScript. The d3-color module therefore provides representations for various color spaces, allowing specification, conversion and manipulation. (Also see d3-interpolate for color interpolation.)

For example, take the named color steelblue, which is rgb(70, 130, 180) in RGB:

js
let c = d3.color("steelblue"); // {r: 70, g: 130, b: 180, opacity: 1}
To convert to HSL hsl(207.3, 44%, 49%):

js
c = d3.hsl(c); // {h: 207.27…, s: 0.44, l: 0.4902…, opacity: 1}
To then rotate the hue by 90° hsl(297.3, 44%, 49%), increase the saturation by 20% hsl(297.3, 64%, 49%), and format as an RGB string rgb(198, 45, 205):

js
c.h += 90;
c.s += 0.2;
c + ""; // rgb(198, 45, 205)
To fade the color slightly rgba(198, 45, 205, 0.8):

js
c.opacity = 0.8;
c + ""; // rgba(198, 45, 205, 0.8)
In addition to the ubiquitous and machine-friendly RGB and HSL color space, d3-color supports color spaces that are designed for humans:

CIELAB (a.k.a. “Lab”)
CIELChab (a.k.a. “LCh” or “HCL”)
Dave Green’s Cubehelix
Cubehelix features monotonic lightness, while CIELAB and its polar form CIELChab are perceptually uniform.

For additional color spaces, see:

d3-cam16
d3-cam02
d3-hsv
d3-hcg
d3-hsluv
To measure color differences, see:

d3-color-difference
color(specifier)
js
d3.color("steelblue") // {r: 70, g: 130, b: 180, opacity: 1}
Source · Parses the specified CSS Color Module Level 3 specifier string, returning an RGB or HSL color, along with CSS Color Module Level 4 hex specifier strings. If the specifier was not valid, null is returned. Some examples:

rgb(255, 255, 255)
rgb(10%, 20%, 30%)
rgba(255, 255, 255, 0.4)
rgba(10%, 20%, 30%, 0.4)
hsl(120, 50%, 20%)
hsla(120, 50%, 20%, 0.4)
#ffeeaa
#fea
#ffeeaa22
#fea2
steelblue
The list of supported named colors is specified by CSS.

Note: this function may also be used with instanceof to test if an object is a color instance. The same is true of color subclasses, allowing you to test whether a color is in a particular color space.

color.opacity
js
d3.color("steelblue").opacity // 1
This color’s opacity, typically in the range [0, 1].

color.rgb()
js
d3.color("hsl(120, 50%, 20%)").rgb() // {r: 25.5, g: 76.5, b: 25.5, opacity: 1}
Source · Returns the RGB equivalent of this color. For RGB colors, that’s this.

color.copy(values)
js
d3.color("steelblue").copy({opacity: 0.5}) // {r: 70, g: 130, b: 180, opacity: 0.5}
Source · Returns a copy of this color. If values is specified, any enumerable own properties of values are assigned to the new returned color.

color.brighter(k)
js
d3.color("steelblue").brighter(1) // {r: 100, g: 185.71428571428572, b: 257.14285714285717, opacity: 1}
Source · Returns a brighter copy of this color. For example, if k is 1, steelblue in RGB color space becomes rgb(100, 186, 255). The parameter k controls how much brighter the returned color should be (in arbitrary units); if k is not specified, it defaults to 1. The behavior of this method is dependent on the implementing color space.

color.darker(k)
js
d3.color("steelblue").darker(1) // {r: 49, g: 91, b: 126, opacity: 1}
Source · Returns a darker copy of this color. For example, if k is 1, steelblue in RGB color space becomes rgb(49, 91, 126). The parameter k controls how much darker the returned color should be (in arbitrary units); if k is not specified, it defaults to 1. The behavior of this method is dependent on the implementing color space.

color.displayable()
js
d3.color("steelblue").displayable(1) // true
Source · Returns true if and only if the color is displayable on standard hardware. For example, this returns false for an RGB color if any channel value is less than zero or greater than 255 when rounded, or if the opacity is not in the range [0, 1].

color.formatHex()
js
d3.color("steelblue").formatHex() // "#4682b4"
Source · Returns a hexadecimal string representing this color in RGB space, such as #4682b4. If this color is not displayable, a suitable displayable color is returned instead. For example, RGB channel values greater than 255 are clamped to 255.

color.formatHex8()
js
d3.color("steelblue").formatHex8() // "#4682b4ff"
Source · Returns a hexadecimal string representing this color in RGBA space, such as #4682b4cc. If this color is not displayable, a suitable displayable color is returned instead. For example, RGB channel values greater than 255 are clamped to 255.

color.formatHsl()
js
d3.color("yellow").formatHsl() // "hsl(60, 100%, 50%)"
Source · Returns a string representing this color according to the CSS Color Module Level 3 specification, such as hsl(257, 50%, 80%) or hsla(257, 50%, 80%, 0.2). If this color is not displayable, a suitable displayable color is returned instead by clamping S and L channel values to the interval [0, 100].

color.formatRgb()
js
d3.color("yellow").formatRgb() // "rgb(255, 255, 0)"
Source · Returns a string representing this color according to the CSS Object Model specification, such as rgb(247, 234, 186) or rgba(247, 234, 186, 0.2). If this color is not displayable, a suitable displayable color is returned instead by clamping RGB channel values to the interval [0, 255].

color.toString()
js
d3.color("yellow").toString() // "rgb(255, 255, 0)"
Source · An alias for color.formatRgb.

rgb(color)
js
d3.rgb("hsl(60, 100%, 50%)") // {r: 255, g: 255, b: 0, opacity: 1}
Source · Constructs a new RGB color. The channel values are exposed as r, g and b properties on the returned instance. Use the RGB color picker to explore this color space.

If r, g and b are specified, these represent the channel values of the returned color; an opacity may also be specified. If a CSS Color Module Level 3 specifier string is specified, it is parsed and then converted to the RGB color space. See color for examples. If a color instance is specified, it is converted to the RGB color space using color.rgb. Note that unlike color.rgb this method always returns a new instance, even if color is already an RGB color.

rgb.clamp()
js
d3.rgb(300, 200, 100).clamp() // {r: 255, g: 200, b: 100, opacity: 1}
Source · Returns a new RGB color where the r, g, and b channels are clamped to the range [0, 255] and rounded to the nearest integer value, and the opacity is clamped to the range [0, 1].

hsl(color)
js
d3.hsl("yellow") // {h: 60, s: 1, l: 0.5, opacity: 1}
Source · Constructs a new HSL color. The channel values are exposed as h, s and l properties on the returned instance. Use the HSL color picker to explore this color space.

If h, s and l are specified, these represent the channel values of the returned color; an opacity may also be specified. If a CSS Color Module Level 3 specifier string is specified, it is parsed and then converted to the HSL color space. See color for examples. If a color instance is specified, it is converted to the RGB color space using color.rgb and then converted to HSL. (Colors already in the HSL color space skip the conversion to RGB.)

hsl.clamp()
js
d3.hsl(400, 2, 0.5).clamp() // {h: 40, s: 1, l: 0.5, opacity: 1}
Source · Returns a new HSL color where the h channel is clamped to the range [0, 360), and the s, l, and opacity channels are clamped to the range [0, 1].

lab(color)
js
d3.lab("red") // {l: 54.29173376861782, a: 80.8124553179771, b: 69.88504032350531, opacity: 1}
Source · Constructs a new CIELAB color. The channel values are exposed as l, a and b properties on the returned instance. Use the CIELAB color picker to explore this color space. The value of l is typically in the range [0, 100], while a and b are typically in [-160, +160].

If l, a and b are specified, these represent the channel values of the returned color; an opacity may also be specified. If a CSS Color Module Level 3 specifier string is specified, it is parsed and then converted to the CIELAB color space. See color for examples. If a color instance is specified, it is converted to the RGB color space using color.rgb and then converted to CIELAB. (Colors already in the CIELAB color space skip the conversion to RGB, and colors in the HCL color space are converted directly to CIELAB.)

gray(l, opacity)
js
d3.gray(50) // {l: 50, a: 0, b: 0, opacity: 1}
Source · Constructs a new CIELAB color with the specified l value and a = b = 0.

hcl(color)
js
d3.hcl("yellow") // {h: 99.57458688693687, c: 94.70776566727464, l: 97.60712516622824, opacity: 1}
Source · Equivalent to d3.lch, but with reversed argument order.

lch(color)
js
d3.lch("yellow") // {h: 99.57458688693687, c: 94.70776566727464, l: 97.60712516622824, opacity: 1}
Source · Constructs a new CIELChab color. The channel values are exposed as l, c and h properties on the returned instance. Use the CIELChab color picker to explore this color space. The value of l is typically in the range [0, 100], c is typically in [0, 230], and h is typically in [0, 360).

If l, c, and h are specified, these represent the channel values of the returned color; an opacity may also be specified. If a CSS Color Module Level 3 specifier string is specified, it is parsed and then converted to CIELChab color space. See color for examples. If a color instance is specified, it is converted to the RGB color space using color.rgb and then converted to CIELChab. (Colors already in CIELChab color space skip the conversion to RGB, and colors in CIELAB color space are converted directly to CIELChab.)

cubehelix(color)
js
d3.cubehelix("yellow") // {h: 56.942171677321085, s: 4.614386868039714, l: 0.8900004504279901, opacity: 1}
Source · Constructs a new Cubehelix color. The channel values are exposed as h, s and l properties on the returned instance.

If h, s and l are specified, these represent the channel values of the returned color; an opacity may also be specified. If a CSS Color Module Level 3 specifier string is specified, it is parsed and then converted to the Cubehelix color space. See color for examples. If a color instance is specified, it is converted to the RGB color space using color.rgb and then converted to Cubehelix. (Colors already in the Cubehelix color space skip the conversion to RGB.)