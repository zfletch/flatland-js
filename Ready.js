(function () {
    'use strict';
    /*global window*/
    /*global Flatland*/

    window.onload = function () {
        var canvas = window.document.getElementById('shapes'),
            shapes = canvas.getContext('2d'),
            viewcanvas = window.document.getElementById('view'),
            viewshapes = viewcanvas.getContext('2d'),
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
        //Flatland.player = player;

        window.document.onkeydown = function (e) {
            if (e.keyCode === 37) { // left
                player.angle = Flatland.formatAngle(player.angle - angle_speed);
            } else if (e.keyCode === 38) { // up
                player.center.x += move_speed * Math.cos(player.angle);
                player.center.y += move_speed * Math.sin(player.angle);
            } else if (e.keyCode === 39) { // right
                player.angle = Flatland.formatAngle(player.angle + angle_speed);
            } else if (e.keyCode === 40) { // down
                player.center.x -= move_speed * Math.cos(player.angle);
                player.center.y -= move_speed * Math.sin(player.angle);
            }
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
            shapes.clearRect(0, 0, canvas.width, canvas.height);
            viewshapes.clearRect(0, 0, viewcanvas.width, viewcanvas.height);

            player.draw({ canvas: shapes });

            // Draw the shapes and randomly decide where they'll go next,
            // Note that there's some hard coded 5x5 logic here too that
            // should eventually be removed.
            residents = [];
            for (ii = 0; ii < grid.length; ii += 1) {
                if (grid[ii].resident) {
                    residents.push(grid[ii].resident);
                    grid[ii].resident.draw({ canvas: shapes });
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
                    canvas: shapes
                });
                if (intersection !== false) {
                    intersections.push(intersection);
                }
            }
            view.draw({
                intersections: intersections,
                canvas: viewshapes
            });
        },
            interval);

    };
}());
