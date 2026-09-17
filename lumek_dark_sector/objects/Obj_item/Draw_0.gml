// ============================================================
//  Obj_item — Draw
//  Pulsing glowing orb visible even in darkness.
//  Outer soft glow + bright core + sparkle.
// ============================================================
var cx = x;
var cy = y + sin(current_time / 200 + glow_phase) * 2;
var pulse = 0.6 + 0.4 * sin(current_time / 120);

// Outer soft glow (blue-white)
draw_set_color(make_color_rgb(170, 215, 255));
draw_set_alpha(0.35 * pulse);
draw_circle(cx, cy, 14, false);

// Bright core
draw_set_color(c_white);
draw_set_alpha(0.85 * pulse);
draw_circle(cx, cy, 5, false);

// Sparkle
draw_set_color(c_yellow);
draw_set_alpha(0.7);
draw_circle(cx + 3 * sin(current_time / 47), cy - 3, 2, false);
draw_set_alpha(1);
