// obj_gui — Draw GUI
if (draw_mode == 0) exit;

var gw = display_get_gui_width();
var gh = display_get_gui_height();

draw_set_color(c_white);
draw_set_halign(fa_center);
draw_set_valign(fa_top);

draw_text(gw / 2, 20, "القطاع المنسي — Lost City");
draw_set_color(make_color_rgb(180, 180, 220));
draw_text(gw / 2, 45, "الضوء هو الحياة — اجمع الشرارات");

draw_set_halign(fa_left);
draw_set_valign(fa_top);
