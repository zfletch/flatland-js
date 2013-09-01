(function () {
    'use strict';
    /*global window*/
    /*global Flatland*/

    window.onload = function () {
        var canvas = window.document.getElementById('shapes'),
            context = canvas.getContext('2d'),
            viewcanvas = window.document.getElementById('view'),
            viewcontext = viewcanvas.getContext('2d'),
            view,
            swap,
            move_speed = 5,
            angle_speed = Math.PI / 30,
            width = canvas.width,
            height = canvas.height,
            grid = [],
            borders = [],
            interval = 100,
            rays = 500,
            arc_size = Math.PI / 2,
            step = arc_size / rays,
            set_point_in_bounds,
            player;

        // the canvas that shows what the swuare sees
        view = new Flatland.View({
            fwidth: width,
            fheight: height,
            width: viewcanvas.width,
            height: viewcanvas.height,
            rays: rays
        });

        // the square that's controlled by the user
        player = new Flatland.Shape({
            sides: 4,
            center: new Flatland.Point({ x: canvas.width / 2, y: canvas.height / 2 }),
            angle: 0,
            radius: 6
        });

        // given an orignal point and a second point,
        // returns a new point that has the x and y coordinates
        // of the new point only if they're inside the canvas's bounds
        set_point_in_bounds = function (point, addpoint) {
            var x = addpoint.x,
                y = addpoint.y;

            if (x > width || x < 0) {
                x = point.x;
            }
            if (y > height || y < 0) {
                y = point.y;
            }

            return new Flatland.Point({ x: x, y: y });
        };

        // control what happens on key press
        // the right and left keys rotate the player
        // and the up and down keys move forwards and backwards
        window.document.onkeydown = function (e) {
            var point = new Flatland.Point({ x: player.center.x, y: player.center.y });
            if (e.keyCode === 37) { // left
                player.angle = Flatland.formatAngle(player.angle - angle_speed);
            } else if (e.keyCode === 38) { // up
                point.x += move_speed * Math.cos(player.angle);
                point.y += move_speed * Math.sin(player.angle);
            } else if (e.keyCode === 39) { // right
                player.angle = Flatland.formatAngle(player.angle + angle_speed);
            } else if (e.keyCode === 40) { // down
                point.x -= move_speed * Math.cos(player.angle);
                point.y -= move_speed * Math.sin(player.angle);
            }
            player.center = set_point_in_bounds(player.center, point);
        };

        // the lines bordering the canvas
        borders.push(new Flatland.LineSegment({
            start: new Flatland.Point({ x: 0, y: 0 }),
            end: new Flatland.Point({ x: width, y: 0 })
        }));
        borders.push(new Flatland.LineSegment({
            start: new Flatland.Point({ x: 0, y: height }),
            end: new Flatland.Point({ x: width, y: height })
        }));
        borders.push(new Flatland.LineSegment({
            start: new Flatland.Point({ x: 0, y: 0 }),
            end: new Flatland.Point({ x: 0, y: height })
        }));
        borders.push(new Flatland.LineSegment({
            start: new Flatland.Point({ x: width, y: 0 }),
            end: new Flatland.Point({ x: width, y: height })
        }));

        // array that contains the shapes floating around on the canvas
        grid = (function () {
            var grid = [],
                length = canvas.width / 3,
                count = 0,
                centerx,
                centery,
                ii,
                jj;

            centery = centery = -1 * (length / 2);
            // right now a 5x5 grid is hard coded
            // in the future, that should be configurable
            for (ii = 0; ii < 5; ii += 1) {
                centerx = -1 * (length / 2);
                for (jj = 0; jj < 5; jj += 1) {
                    grid.push(new Flatland.Grid({
                        center: new Flatland.Point({ x: centerx, y: centery }),
                        length: length,
                    }));
                    count += 1;
                    centerx += length;
                }
                centery += length;
            }
            return grid;
        }());

        // move resident of one grid to another
        swap = function (one, two) {
            two.resident = one.resident;
            two.resident.grid = two;
            two.resident.prev_grid = one;
            one.resident = false;
            two.busy = true;
            one.busy = true;
        };

        setInterval(function () {
            var random,
                intersections,
                intersection,
                residents,
                line,
                ii;


            // clear the canvases before doing anything
            context.clearRect(0, 0, canvas.width, canvas.height);
            viewcontext.clearRect(0, 0, viewcanvas.width, viewcanvas.height);

            player.draw({ context: context });

            // Draw the shapes and randomly decide where they'll go next,
            // Note that there's some hard coded 5x5 logic here too that
            // should eventually be removed.
            residents = [];
            for (ii = 0; ii < grid.length; ii += 1) {
                if (grid[ii].resident) {
                    residents.push(grid[ii].resident);
                    grid[ii].resident.draw({ context: context });
                    if (!grid[ii].busy) {
                        random = Math.floor(Math.random() * 5);
                        if (random === 0) {
                            if (ii < 5) {
                                grid[ii].resident = false;
                            } else if (!grid[ii - 5].busy && !grid[ii - 5].resident) {
                                swap(grid[ii], grid[ii - 5]);
                            }
                        } else if (random === 1) {
                            if (ii % 5 === 0) {
                                grid[ii].resident = false;
                            } else if (!grid[ii - 1].busy && !grid[ii - 1].resident) {
                                swap(grid[ii], grid[ii - 1]);
                            }
                        } else if (random === 3) {
                            if (ii % 5 === 4) {
                                grid[ii].resident = false;
                            } else if (!grid[ii + 1].busy && !grid[ii + 1].resident) {
                                swap(grid[ii], grid[ii + 1]);
                            }
                        } else if (random === 4) {
                            if (ii > 19) {
                                grid[ii].resident = false;
                            } else if (!grid[ii + 5].busy && !grid[ii + 5].resident) {
                                swap(grid[ii], grid[ii + 5]);
                            }
                        }
                    }
                } else if (!grid[ii].busy && (ii < 5 || ii > 19 || ii % 5 === 0 || ii % 5 === 4) && Math.random() < 0.005) {
                    grid[ii].resident = new Flatland.RandomShape({ grid: grid[ii] });
                }
            }

            // do the 'ray casting' and find all the intersections.
            intersections = [];
            for (ii = 0; ii <= rays; ii += 1) {
                intersection = Flatland.getAndDrawIntersection({
                    point: player.center,
                    angle: player.angle + (ii * step) - (arc_size / 2),
                    shapes: residents,
                    borders: borders,
                    draw: true,
                    context: context
                });
                if (intersection !== false) {
                    intersections.push(intersection);
                }
            }
            view.draw({
                intersections: intersections,
                context: viewcontext
            });
        },
            interval);

    };
}());
