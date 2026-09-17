// Obj_sign_warning_1 — Draw
var cx = x;
var cy = y + sin(hover) * 2;
var pulse = 0.6 + 0.4 * sin(current_time / 120);

draw_set_color(make_color_rgb(20, 20, 40));
draw_roundrect(cx - 35, cy - 12, cx + 35, cy + 12, false);

draw_set_color(make_color_rgb(0, 200, 255));
draw_set_alpha(0.5 * pulse);
draw_roundrect(cx - 33, cy - 10, cx + 33, cy + 10, true);
draw_set_alpha(1);

draw_set_color(c_yellow);
draw_circle(cx - 26, cy, 4, false);
draw_set_color(c_black);
draw_circle(cx - 26, cy, 2, false);
