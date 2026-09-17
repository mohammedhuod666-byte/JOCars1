// Obj_box_2 — Draw
var cx = x;
var cy = y;
var pulse = 0.7 + 0.3 * sin(current_time / 100);

draw_set_color(make_color_rgb(255, 180, 40));
draw_set_alpha(pulse);
draw_roundrect(cx - 14, cy - 14, cx + 14, cy + 14, false);
draw_set_alpha(1);

draw_set_color(c_white);
draw_set_alpha(0.5 * pulse);
draw_circle(cx, cy, 6, false);
draw_set_alpha(1);
