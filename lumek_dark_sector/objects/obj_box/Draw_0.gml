// obj_box — Draw
var cx = x;
var cy = y;

draw_set_color(make_color_rgb(120, 80, 40));
draw_roundrect(cx - 12, cy - 12, cx + 12, cy + 12, false);
draw_set_color(make_color_rgb(80, 50, 20));
draw_rectangle(cx - 10, cy - 10, cx + 10, cy + 10, false);

// highlight
draw_set_color(make_color_rgb(200, 150, 60));
draw_set_alpha(0.3);
draw_rectangle(cx - 12, cy - 8, cx + 12, cy - 6, false);
draw_set_alpha(1);
