Flatland Simulator
==================

Flatland Simulator in JavaScript and HTML5.

Flatland
-----------------

*Flatland: A Romance of Many Dimensions*, written by Edwin A. Abbott and published
in 1884 is a novel about a square who lives in an entirely two-dimensional world.
The book explains how he, and all two-dimensional creatures, see their two-dimensional
world in one dimension, similar to how we three-dimensional creatures see our world
as a series of two-dimensional images.

Flatland Simulator
------------------

I was curious about what it would be like to see the world like a Flatlander does
and threw together this program with JavaScript and HTML5's canvas tag.
You control a little square in a world of randomly generating polygons and
you can move around and rotate. As you do so, you see your actions in two
different canvas tags, one showing a top-down view of the two-dimensional
world (a large square canvas on the bottom half of the page) and one showing what the
world would look like from the perspective of the square (a smaller rectangular canvas
immediately above the square canvas).

Pictures!
---------
![screenshot 1](https://raw.github.com/zfletch/flatland-js/master/images/20130811-screenshot1.png)
![screenshot 2](https://raw.github.com/zfletch/flatland-js/master/images/20130811-screenshot2.png)

How to use
----------

 - Download this git repo
 - Open a browser with HTML5 support (Chrome, for example) and open your/directory/flatland-js/Flatland.html

Algorithm
---------

I'm calculating what the world would look like from a Flatlander's perspective
by doing a simple two-dimensional version of ray casting. I create a bunch of
of lines, or rays, coming out of the Flatlander, calculate what they
intersect, and use the distance of the closest intersection to determine what
the Flatlander would see.

Notes
-----

This is a work in progress/a weekend project and there are a number of things I'm working on
fixing. Tested on Chrome 28.0.1500.95 on OSX 10.8.4.
