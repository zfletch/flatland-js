var Flatland;
Flatland = Flatland || {};

(function () {
    'use strict';

    // View is an object representing the canvas where we draw
    // what it looks like from the square's perspective.
    // The canvas should have the same width as the main canvas
    // but the height can be different.
    Flatland.View = function (args) {
        var that = this;
        that.fwidth = args.fwidth;
        that.fheight = args.fheight;

        that.min = 0;
        that.max = that.fwidth > that.fheight ? that.fwidth : that.fheight;

        // I'm just using a regular linear formula
        // in the future, it might be worth it to use an inverse power
        // or logorithmic formula
        that.intercept = 0;
        that.slope = (255) / (that.max);

        that.height = args.height;
        that.width = args.width;
        that.rays = args.rays;

        that.step = that.width / that.rays;
    };

    // The further away an object is, the lighter it is.
    // Right now, it's just a linear formula based on distance.
    Flatland.View.prototype.getColor = function (distance) {
        var that = this,
            color = Math.round(that.slope * distance + that.intercept);

        return 'rgb(' + String(color) + ',' + String(color) + ',' + String(color) + ')';
    };

    // given a list of intersections (or objects with
    // distance (Number) and border (Bool) fields), draws
    // draws to the canvas for each intersection. The closer
    // the object is, the darker it will be.
    Flatland.View.prototype.draw = function (args) {
        var that = this,
            intersections = args.intersections,
            canvas = args.canvas,
            distance,
            ii;

        for (ii = 0; ii < intersections.length; ii += 1) {
            // if looking at the border, that should be
            // equivalent to looking at the horizon
            if (intersections[ii].border) {
                distance = that.max;
            } else {
                distance = intersections[ii].distance;
            }

            canvas.beginPath();
            canvas.moveTo(that.step * ii, 0);
            canvas.lineTo(that.step * ii, that.height);
            canvas.lineWidth = that.step;

            canvas.strokeStyle = that.getColor(distance);
            canvas.stroke();
        }

        return that;
    };

}());
