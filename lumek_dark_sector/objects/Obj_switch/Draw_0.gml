// obj_switch — Draw
var cx = x;
var cy = y;
var pulse = hovered ? (0.5 + 0.4 * sin(current_time / 60)) : 0.2;

// Base
draw_set_color(make_color_rgb(50, 50, 60));
draw_roundrect(cx - 16, cy - 12, cx + 16, cy + 12, false);

// Glow when hovered
draw_set_color(c_yellow);
draw_set_alpha(pulse);
draw_roundrect(cx - 14, cy - 10, cx + 14, cy + 10, true);
draw_set_alpha(1);

// Lever
draw_set_color(c_white);
draw_set_alpha(0.8);
draw_line(cx, cy, cx, cy - 12);
draw_circle(cx, cy - 12, 3, false);
draw_set_alpha(1);

// Label
if (variable_global_exists("font_arabic")) {
    draw_set_font(global.font_arabic);
    draw_set_color(c_white);
    draw_set_halign(fa_center);
    draw_text(cx, cy + 18, open ? "مضاء" : "مطفأ");
    draw_set_halign(fa_left);
}
