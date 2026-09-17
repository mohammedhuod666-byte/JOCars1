// Obj_sign_warning_2 — Draw
var cx = x;
var cy = y + sin(hover) * 2;
var pulse = 0.6 + 0.4 * sin(current_time / 120);

draw_set_color(make_color_rgb(40, 20, 20));
draw_roundrect(cx - 35, cy - 12, cx + 35, cy + 12, false);

draw_set_color(make_color_rgb(255, 80, 80));
draw_set_alpha(0.5 * pulse);
draw_roundrect(cx - 33, cy - 10, cx + 33, cy + 10, true);
draw_set_alpha(1);

draw_set_color(c_white);
draw_text(cx, cy, "!");
