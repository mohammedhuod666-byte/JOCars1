// obj_respawn_poin — Draw
var cx = x;
var cy = y;
var pulse = 0.5 + 0.5 * sin(current_time / 80);

draw_set_color(c_blue);
draw_set_alpha(pulse);
draw_circle(cx, cy, 10, false);
draw_set_alpha(1);

draw_set_color(c_white);
draw_set_alpha(0.7);
draw_circle(cx, cy, 4, false);
draw_set_alpha(1);

draw_set_color(c_yellow);
draw_set_halign(fa_center);
draw_set_valign(fa_bottom);
draw_text(cx, cy + 14, "\u0645")
draw_set_halign(fa_left);
draw_set_valign(fa_top);
