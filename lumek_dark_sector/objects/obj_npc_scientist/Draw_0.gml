var cx = x; var cy = y;
draw_set_color(c_white);
draw_roundrect(cx-8, cy-15, cx+8, cy+10, false);
draw_set_color(make_color_rgb(255, 200, 150));
draw_circle(cx, cy-25, 7, false);
draw_set_color(c_aqua);
draw_rectangle(cx-6, cy-27, cx+6, cy-23, false);

if (distance_to_object(Obj_player) < 60) {
    if (!variable_global_exists("font_arabic")) {
        global.font_arabic = font_add("Arial", 14, false, false, 32, 65535);
    }
    draw_set_font(global.font_arabic);
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    draw_set_color(make_color_rgb(10, 20, 30));
    draw_set_alpha(0.8);
    draw_roundrect(x-120, y-60, x+120, y-35, false);
    draw_set_color(c_white);
    draw_set_alpha(1.0);
    draw_text(x, y-40, text);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}
