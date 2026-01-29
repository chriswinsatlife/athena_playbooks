d3-ease
Examples · Easing is a method of distorting time to control apparent motion in animation. It is most commonly used for slow-in, slow-out. By easing time, animated transitions are smoother and exhibit more plausible motion.

The easing types in this module implement the ease method which takes a normalized time t and returns the corresponding “eased” time tʹ. Both the normalized time and the eased time are typically in the range [0,1], where 0 represents the start of the animation and 1 represents the end; some easing types, such as easeElastic, may return eased times slightly outside this range. A good easing type should return 0 if t = 0 and 1 if t = 1.

These easing types are largely based on work by Robert Penner.

ease(t)
Given the specified normalized time t, typically in the range [0,1], returns the “eased” time tʹ, also typically in [0,1]. 0 represents the start of the animation and 1 represents the end. A good implementation returns 0 if t = 0 and 1 if t = 1. For example, to apply easeCubic easing:

js
const te = d3.easeCubic(t);
To apply custom elastic easing, create your easing function before the animation starts:

js
const ease = d3.easeElastic.period(0.4);
Then during the animation, apply the easing function:

js
const te = ease(t);
See also transition.ease.

easeLinear
Source · Linear easing; the identity function; linear(t) returns t.

easePoly
Source · Alias for easePolyInOut.

easePolyIn
1
2
3
4
exponent
Polynomial easing; raises t to the specified exponent. If the exponent is not specified, it defaults to 3, equivalent to easeCubicIn.

easePolyOut
1
2
3
4
exponent
Reverse polynomial easing; equivalent to 1 - easePolyIn(1 - t). If the exponent is not specified, it defaults to 3, equivalent to easeCubicOut.

easePolyInOut
1
2
3
4
exponent
Symmetric polynomial easing; scales easePolyIn for t in 0–0.5 and easePolyOut for t in 0.5–1. If the exponent is not specified, it defaults to 3, equivalent to easeCubic.

easePoly.exponent(e)
Exponent:

2.00

Returns a new polynomial easing with the specified exponent e. For example, to create equivalents of easeLinear, easeQuad, and easeCubic:

js
const linear = d3.easePoly.exponent(1);
const quad = d3.easePoly.exponent(2);
const cubic = d3.easePoly.exponent(3);
easeQuad
Source · Alias for easeQuadInOut.

easeQuadIn
Quadratic easing; equivalent to easePolyIn.exponent(2).

easeQuadOut
Reverse quadratic easing; equivalent to 1 - easeQuadIn(1 - t). Also equivalent to easePolyOut.exponent(2).

easeQuadInOut
Symmetric quadratic easing; scales easeQuadIn for t in 0–0.5 and easeQuadOut for t in 0.5–1. Also equivalent to easePoly.exponent(2).

easeCubic
Source · Alias for easeCubicInOut.

easeCubicIn
Cubic easing; equivalent to easePolyIn.exponent(3).

easeCubicOut
Reverse cubic easing; equivalent to 1 - easeCubicIn(1 - t). Also equivalent to easePolyOut.exponent(3).

easeCubicInOut
Symmetric cubic easing; scales easeCubicIn for t in 0–0.5 and easeCubicOut for t in 0.5–1. Also equivalent to easePoly.exponent(3).

easeSin
Source · Alias for easeSinInOut.

easeSinIn
Sinusoidal easing; returns sin(t).

easeSinOut
Reverse sinusoidal easing; equivalent to 1 - easeSinIn(1 - t).

easeSinInOut
Symmetric sinusoidal easing; scales easeSinIn for t in 0–0.5 and easeSinOut for t in 0.5–1.

easeExp
Source · Alias for easeExpInOut.

easeExpIn
Exponential easing; raises 2 to the exponent 10 × (t - 1).

easeExpOut
Reverse exponential easing; equivalent to 1 - easeExpIn(1 - t).

easeExpInOut
Symmetric exponential easing; scales easeExpIn for t in 0–0.5 and easeExpOut for t in 0.5–1.

easeCircle
Source · Alias for easeCircleInOut.

easeCircleIn
Circular easing.

easeCircleOut
Reverse circular easing; equivalent to 1 - easeCircleIn(1 - t).

easeCircleInOut
Symmetric circular easing; scales easeCircleIn for t in 0–0.5 and easeCircleOut for t in 0.5–1.

easeElastic
Source · Alias for easeElasticOut.

easeElasticIn
1.0
1.1
1.2
1.3
1.4
1.5
amplitude
Elastic easing, like a rubber band. The amplitude and period of the oscillation are configurable; if not specified, they default to 1 and 0.3, respectively.

easeElasticOut
1.0
1.1
1.2
1.3
1.4
1.5
amplitude
Reverse elastic easing; equivalent to 1 - elasticIn(1 - t).

easeElasticInOut
1.0
1.1
1.2
1.3
1.4
1.5
amplitude
Symmetric elastic easing; scales elasticIn for t in 0–0.5 and elasticOut for t in 0.5–1.

easeElastic.amplitude(a)
Amplitude:

1.00

Returns a new elastic easing with the specified amplitude a. The amplitude a must be greater than or equal to 1.

easeElastic.period(p)
Period:

0.30

Returns a new elastic easing with the specified period p.

easeBack
Source · Alias for easeBackInOut.

easeBackIn
0.5
1.0
1.5
2.0
2.5
3.0
overshoot
Anticipatory easing like a dancer bending her knees before jumping off the floor. The degree of overshoot is configurable; if not specified, it defaults to 1.70158.

easeBackOut
0.5
1.0
1.5
2.0
2.5
3.0
overshoot
Reverse anticipatory easing; equivalent to 1 - easeBackIn(1 - t).

easeBackInOut
0.5
1.0
1.5
2.0
2.5
3.0
overshoot
Symmetric anticipatory easing; scales easeBackIn for t in 0–0.5 and easeBackOut for t in 0.5–1.

easeBack.overshoot(s)
Overshoot:

1.70

Returns a new back easing with the specified overshoot s.

easeBounce
Source · Alias for easeBounceOut.

easeBounceIn
Bounce easing, like a rubber ball.

easeBounceOut
Reverse bounce easing; equivalent to 1 - easeBounceIn(1 - t).

easeBounceInOut
Symmetric bounce easing; scales easeBounceIn for t in 0–0.5 and easeBounceOut for t in 0.5–1.