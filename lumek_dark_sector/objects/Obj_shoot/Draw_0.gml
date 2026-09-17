// obj_shoot — Draw
var cx = x;
var cy = y;
var pulse = 0.6 + 0.4 * sin(current_time / 150);

draw_set_color(color);
draw_set_alpha(0.5 * pulse);
draw_circle(cx, cy, 6 + pulse * 2, false);
draw_set_color(c_white);
draw_set_alpha(0.4 * pulse);
draw_circle(cx, cy, 3, false);
draw_set_alpha(1);
