// obj_box_11 — Draw
var cx = x;
var cy = y;

draw_set_color(make_color_rgb(140, 60, 180));
draw_roundrect(cx - 12, cy - 12, cx + 12, cy + 12, false);
draw_set_color(make_color_rgb(100, 40, 130));
draw_rectangle(cx - 10, cy - 10, cx + 10, cy + 10, false);
