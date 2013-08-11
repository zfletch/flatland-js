var Flatland;
Flatland = Flatland || {};

(function () {
    'use strict';

    var fe, ltfe, gtfe;

    // convert the angle so it's always between 0 and 2PI
    Flatland.formatAngle = function (angle) {
        if (angle < 0) {
            return Math.PI * 2 + angle;
        }
        if (angle >= Math.PI * 2) {
            return angle - Math.PI * 2;
        }
        return angle;
    };

    // this is needed to fix floating point errors.
    // I'm using the same fuzzyEquals right now for angles
    // and for lines which could be a problem in the future
    Flatland.fuzzyEquals = function (a, b) {
        return Math.abs(a - b) < 0.00001;
    };
    fe = Flatland.fuzzyEquals;
    gtfe = function (a, b) {
        return a > b || fe(a, b);
    };
    ltfe = function (a, b) {
        return a < b || fe(a, b);
    };

    Flatland.getDistance = function (point1, point2) {
        return Math.sqrt((point1.x - point2.x) * (point1.x - point2.x) + (point1.y - point2.y) * (point1.y - point2.y));
    };

    // gets the m and b of y = mx + b given two points
    // y = mx + b -> m = (y2 - y1) / (x2 - x1)
    // y1 = mx1 + b -> b = y1 - mx1
    Flatland.getFormula = function (point1, point2) {
        var x1 = point1.x,
            y1 = point1.y,
            x2 = point2.x,
            y2 = point2.y,
            m = (y2 - y1) / (x2 - x1),
            b = y1 - m * x1;

        return { intercept: b, slope: m };
    };

    // given two formulas (from getFormula), returns the point
    // at which they intersect
    Flatland.getIntersection = function (formula1, formula2) {
        var x,
            y;

        x = (formula2.intercept - formula1.intercept) / (formula1.slope - formula2.slope);
        y = formula2.slope * x + formula2.intercept;
        return new Flatland.Point({ x: x, y: y });
    };


    // given an x coordinate and a formula, returns the point
    // where the formula's x = that x coordinate
    Flatland.getIntersectionWithVertical = function (args) {
        var formula = args.formula,
            x = args.x,
            y = formula.slope * x + formula.intercept;

        return new Flatland.Point({ x: x, y: y });
    };

    Flatland.LineSegment = function (args) {
        var that = this;
        that.start = args.start;
        that.end = args.end;
    };

    // draws to the given context
    Flatland.LineSegment.prototype.draw = function (args) {
        var that = this,
            canvas = args.canvas;

        canvas.beginPath();
        canvas.moveTo(that.start.x, that.start.y);
        canvas.lineTo(that.end.x, that.end.y);
        canvas.closePath();
        canvas.stroke();

        return that;
    };

    // given a middle point (point), and start and end points,
    // returns true if point is between them (inclusive)
    // and false otherwise
    Flatland.betweenPoints = function (args) {
        var point = args.point,
            start = args.start,
            end = args.end;

        if (start.x < end.x) {
            if (!(ltfe(point.x, end.x) && gtfe(point.x, start.x))) {
                return false;
            }
        } else {
            if (!(ltfe(point.x, start.x) && gtfe(point.x, end.x))) {
                return false;
            }
        }

        if (start.y < end.y) {
            if (!(ltfe(point.y, end.y) && gtfe(point.y, start.y))) {
                return false;
            }
        } else {
            if (!(ltfe(point.y, start.y) && gtfe(point.y, end.y))) {
                return false;
            }
        }

        return true;
    };

    // given a line
    // a point and an angle,
    // returns the point of intersection or false if there is none
    Flatland.getIntersectionWithLineSegment = function (args) {
        var point = args.point,
            angle = Flatland.formatAngle(args.angle),
            start = args.line.start,
            end = args.line.end,
            line_formula = Flatland.getFormula(start, end),
            point_formula,
            intersection;

        // up till here it's correct
        point_formula = Flatland.getFormula(point, new Flatland.Point({
            x: point.x + 10 * Math.cos(angle),
            y: point.y + 10 * Math.sin(angle),
        }));

        // special case for vertical lines
        if (start.x === end.x) {
            intersection = Flatland.getIntersectionWithVertical({ formula: point_formula, x: start.x });
        } else if (fe(angle, Math.PI / 2) || fe(angle, 3 * Math.PI / 2)) {
            intersection = Flatland.getIntersectionWithVertical({ formula: line_formula, x: point.x });
        } else {
            intersection = Flatland.getIntersection(line_formula, point_formula);
        }

        // there will be an intersection in 2 cases:
        // 1. a real intersection
        // 2. an intersection of the shape was turned PI/2 radians around
        // we should only count the real ones
        if (Flatland.betweenPoints({ point: intersection, start: start, end: end })) {

            if (angle >= 0 && angle < Math.PI && intersection.y < point.y) { // bottom
                return false;
            }
            if (angle >= Math.PI && angle < 2 * Math.PI && intersection.y > point.y) { // top
                return false;
            }
            if (((angle >= 0 && angle < Math.PI / 2) || (angle >= 3 * Math.PI / 2 && angle < 2 * Math.PI)) && intersection.x < point.x) { // right
                return false;
            }
            if (angle >= Math.PI / 2 && angle < 3 * Math.PI / 2 && intersection.x > point.x) { // top
                return false;
            }

            return intersection;
        }

        return false;
    };

    Flatland.Point = function (args) {
        var that = this;

        that.x = args.x;
        that.y = args.y;
    };

    // Flatland.Shape: a regular polygon
    // given a center (Point), radius (Number), and number of sides (Number)
    // creates the corresponding regular polygon
    Flatland.Shape = function (args) {
        var that = this;

        that.center = args.center;
        that.radius = args.radius;
        that.angle = args.angle;
        that.sides = args.sides;
        that.increment = Math.PI - ((that.sides - 2) * Math.PI / that.sides);
    };

    // returns an array of Points that, if we draw lines between
    // them, constitute the triangle
    Flatland.Shape.prototype.getPoints = function () {
        var that = this,
            points = [],
            angle = that.angle,
            original = angle;

        while (angle < original + Math.PI * 2) {
            points.push(new Flatland.Point({
                x: that.center.x + that.radius * Math.cos(angle),
                y: that.center.y + that.radius * Math.sin(angle),
            }));

            angle += that.increment;
        }
        return points;
    };

    // similar to getPoints above, except returns LineSegents
    // instead of Points
    Flatland.Shape.prototype.getLineSegments = function () {
        var that = this,
            points = that.getPoints(),
            lines = [],
            ii;

        for (ii = 1; ii < points.length; ii += 1) {
            lines.push(new Flatland.LineSegment({
                start: points[ii - 1],
                end: points[ii]
            }));
        }
        lines.push(new Flatland.LineSegment({
            start: points[points.length - 1],
            end: points[0]
        }));

        return lines;
    };

    // draw shape to the given canvas
    Flatland.Shape.prototype.draw = function (args) {
        var that = this,
            lines = that.getLineSegments(),
            canvas = args.canvas,
            previous = false,
            ii;

        for (ii = 0; ii < lines.length; ii += 1) {
            lines[ii].draw({ canvas: canvas });
        }

        return that;
    };

    // To make drawing shapes easier, the canvas is divided up into a grid
    // each square in the grid is a Flatland.Grid.
    // grid.resident is the shape occupying the grid
    // grid.busy is true if a shape is moving into or out of the square
    Flatland.Grid = function (args) {
        var that = this;

        that.center = args.center;
        that.length = args.length;
        that.resident = false;
        that.busy = false;
    };

    // Subclass (or whatever the prototypical version is called) of Shape,
    // a random regular polygon
    // it can have 3-8 sides and spin clockwise or counter-clockwise
    Flatland.RandomShape = function (args) {
        var that = this,
            sides = Math.floor(Math.random() * 6) + 3,
            radius = Math.random() * (1 / 3) * (args.grid.length / 2) + (1 / 3) * (args.grid.length / 2),
            angle = Math.random() * Math.PI,
            spin = (Math.random() * Math.PI / 10) - Math.PI / 20,
            speed = 1;
            //speed = Math.floor(Math.random() * 3) + 1;

        that.grid = args.grid;
        that.spin = spin;
        that.speed = speed;
        that.prev_grid = false; // meh
        Flatland.Shape.apply(that, [{
            sides: sides,
            radius: radius,
            center: new Flatland.Point({ x: that.grid.center.x, y: that.grid.center.y }),
            angle: angle
        }]);

    };
    Flatland.RandomShape.prototype = new Flatland.Shape({});
    Flatland.RandomShape.prototype.draw = function (args) {
        var that = this;
        that.angle = Flatland.formatAngle(that.angle + that.spin);
        if (Math.abs(that.center.x - that.grid.center.x) < 1) {
            that.center.x = that.grid.center.x;
        } else if (that.center.x > that.grid.center.x) {
            that.center.x -= that.speed;
        } else if (that.center.x < that.grid.center.x) {
            that.center.x += that.speed;
        }

        if (Math.abs(that.center.y - that.grid.center.y) < 1) {
            that.center.y = that.grid.center.y;
        } else if (that.center.y > that.grid.center.y) {
            that.center.y -= that.speed;
        } else if (that.center.y < that.grid.center.y) {
            that.center.y += that.speed;
        }

        if (that.grid.center.x === that.center.x && that.grid.center.y === that.center.y) {
            that.grid.busy = false;
            that.prev_grid.busy = false;
        }

        return Flatland.Shape.prototype.draw.apply(that, [args]);
    };

    // Given a point and an angle
    // a list of the lines bordering the canvas,
    // the drawing context,
    // and a list of shapes floating around,
    // draws a line on the canvas to the closest intersection.
    // Also returns the closest intersection.
    Flatland.getAndDrawIntersection = function (args) {
        var point = args.point,
            angle = args.angle,
            shapes = args.shapes,
            borders = args.borders,
            canvas = args.canvas,
            intersections = [],
            draw = args.draw,
            intersection,
            min,
            line,
            lines,
            ii,
            jj;

        for (ii = 0; ii < borders.length; ii += 1) {
            intersection = Flatland.getIntersectionWithLineSegment({
                point: point,
                angle: angle,
                line: borders[ii]
            });
            if (intersection !== false) {
                intersections.push({
                    intersection: intersection,
                    distance: Flatland.getDistance(intersection, point),
                    border: true
                });
            }
        }
        for (ii = 0; ii < shapes.length; ii += 1) {
            lines = shapes[ii].getLineSegments();
            for (jj = 0; jj < lines.length; jj += 1) {
                intersection = Flatland.getIntersectionWithLineSegment({
                    point: point,
                    angle: angle,
                    line: lines[jj]
                });
                if (intersection !== false) {
                    intersections.push({
                        intersection: intersection,
                        distance: Flatland.getDistance(intersection, point),
                        border: false
                    });
                }
            }
        }

        if (intersections.length > 0) {
            //for (ii = 0; ii < intersections.length; ii += 1) {
            //    canvas.fillRect(intersections[ii].intersection.x, intersections[ii].intersection.y, 5, 5);
            //}
            min = intersections[0];
            for (ii = 0; ii < intersections.length; ii += 1) {
                if (intersections[ii].distance < min.distance) {
                    min = intersections[ii];
                }
            }

            line = new Flatland.LineSegment({
                start: point,
                end: min.intersection
            });
            if (draw) {
                line.draw({ canvas: canvas});
            }
            return min;
        }

        return false;
    };

}());
