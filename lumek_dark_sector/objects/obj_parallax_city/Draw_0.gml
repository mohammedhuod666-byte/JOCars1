// obj_parallax_city — Draw (procedural city silhouette)
var cx = x;
var cy = y;

// Dark sky
draw_set_color(make_color_rgb(4, 4, 14));
draw_set_alpha(0.6);
draw_rectangle(cx, cy - 200, cx + sprite_width * 2, cy + 150, false);
draw_set_alpha(1);

// City buildings
draw_set_color(make_color_rgb(12, 12, 28));
for (var i = 0; i < 30; i++) {
    var bx = cx + i * 40;
    var bh = 80 + sin(i * 7 + current_time / 800) * 50;
    var by = cy - bh + 60;
    draw_rectangle(bx, by, bx + 28, cy + 60, false);
    
    // Windows
    draw_set_color(make_color_rgb(55, 55, 80));
    for (var wy = by + 12; wy < cy + 50; wy += 16) {
        for (var wx = bx + 5; wx < bx + 23; wx += 11) {
            if (random(100) < 35) {
                draw_rectangle(wx, wy, wx + 5, wy + 9, false);
            }
        }
    }
    draw_set_color(make_color_rgb(12, 12, 28));
}

// Far buildings (darker)
draw_set_color(make_color_rgb(8, 8, 20));
for (var i = 0; i < 25; i++) {
    var bx = cx + i * 50 + 20;
    var bh = 100 + sin(i * 5 + current_time / 1000) * 40;
    var by = cy - bh + 80;
    draw_rectangle(bx, by, bx + 35, cy + 80, false);
}

draw_set_alpha(1);
