// obj_neon_sign — Draw (neon text on sign)
var cx = x;
var cy = y;
var pulse = 0.6 + 0.4 * sin(current_time / 100 + glow_phase);

// Sign background
draw_set_color(make_color_rgb(20, 20, 40));
draw_roundrect(cx - 80, cy - 18, cx + 80, cy + 18, false);

// Neon glow
draw_set_color(make_color_rgb(0, 200, 255));
draw_set_alpha(0.5 * pulse);
draw_roundrect(cx - 78, cy - 16, cx + 78, cy + 16, true);
draw_set_alpha(1);

// Text
draw_set_color(c_blue);
draw_set_halign(fa_center);
draw_set_valign(fa_middle);
draw_text(cx, cy, text);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
