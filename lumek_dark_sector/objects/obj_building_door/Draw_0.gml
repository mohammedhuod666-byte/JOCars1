// obj_building_door — Draw
var cx = x;
var cy = y;

if (open) {
    draw_set_color(make_color_rgb(40, 80, 180));
    draw_roundrect(cx - 14, cy - 28, cx + 14, cy + 28, false);

    draw_set_color(c_white);
    draw_set_alpha(0.55);
    draw_rectangle(cx - 10, cy - 24, cx + 10, cy + 24, false);
    draw_set_alpha(1);

    draw_set_color(c_blue);
    draw_set_alpha(0.75);
    for (var i = 0; i < 5; i++) {
        var yy = cy - 22 + i * 9;
        draw_rectangle(cx - 7, yy, cx + 7, yy + 3, false);
    }
    draw_set_alpha(1);
} else {
    draw_set_color(make_color_rgb(80, 70, 60));
    draw_roundrect(cx - 14, cy - 28, cx + 14, cy + 28, false);
    draw_set_color(make_color_rgb(50, 42, 35));
    draw_rectangle(cx - 12, cy - 26, cx + 12, cy + 26, false);
}
