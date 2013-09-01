var Flatland;
Flatland = Flatland || {};

(function () {
    'use strict';

    // View is an object representing the context where we draw
    // what it looks like from the square's perspective.
    // The context should have the same width as the main context
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
    // draws to the context for each intersection. The closer
    // the object is, the darker it will be.
    Flatland.View.prototype.draw = function (args) {
        var that = this,
            intersections = args.intersections,
            context = args.context,
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

            context.beginPath();
            context.moveTo(that.step * ii, 0);
            context.lineTo(that.step * ii, that.height);
            context.lineWidth = that.step;

            context.strokeStyle = that.getColor(distance);
            context.stroke();
        }

        return that;
    };

}());
