// Obj_gate — Draw (stands out as a checkpoint marker)
var cx = x;
var cy = y;

var flash = sin(flash_timer / 8) * 0.5 + 0.5;

// base gate
draw_set_color(make_color_rgb(60, 60, 80));
draw_roundrect(cx - 12, cy - 24, cx + 12, cy + 24, false);

// active glow
draw_set_color(c_blue);
draw_set_alpha(0.4 + 0.3 * flash);
draw_roundrect(cx - 10, cy - 22, cx + 10, cy + 22, true);
draw_set_alpha(1);

// arrows suggesting "go up"
draw_set_color(c_white);
draw_set_alpha(0.6);
draw_triangle(cx - 4, cy - 8, cx + 4, cy - 8, cx, cy - 18, false);
draw_set_alpha(1);
