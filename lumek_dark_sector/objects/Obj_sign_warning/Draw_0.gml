// Obj_sign_warning — Draw (generic sign placeholder)
draw_set_color(make_color_rgb(30, 30, 50));
draw_roundrect(x - 30, y - 10, x + 30, y + 10, false);
draw_set_color(c_yellow);
draw_set_alpha(0.5);
draw_roundrect(x - 28, y - 8, x + 28, y + 8, true);
draw_set_alpha(1);
