// Lumek — Draw GUI (in-game HUD: air + HP bars + light status)
// This is the visible "life" meter. When light shrinks, the
// player knows they are close to being swallowed by darkness.

var air_w = clamp(100 * (air / max_air), 0, 100);
var hp_w  = clamp(100 * (hp   / max_hp), 0, 100);

var gw = 100;
var gh = display_get_gui_height();

var gui_x = 12;
var gui_y = gh - 90;

// background panel
draw_set_alpha(0.85);
draw_set_color(make_color_rgb(8, 8, 22));
draw_roundrect(gui_x - 6, gui_y - 6, gui_x + 150, gui_y + 78, false);
draw_set_alpha(1);

// label
draw_set_color(c_white);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_text(gui_x, gui_y, "الضوء");
draw_text(gui_x, gui_y + 44, "الحياة");

// light bar (blue)
draw_set_color(c_blue);
draw_rectangle(gui_x + 44, gui_y + 2, gui_x + 44 + air_w, gui_y + 14, false);

// HP bar (red)
draw_set_color(c_red);
draw_rectangle(gui_x + 44, gui_y + 46, gui_x + 44 + hp_w, gui_y + 58, false);

// light warning pulse
if (air < 60) {
    var pulse_a = 0.3 + 0.2 * sin(current_time / 60);
    draw_set_alpha(pulse_a);
    draw_set_color(c_blue);
    draw_rectangle(gui_x + 44, gui_y + 2, gui_x + 44 + air_w, gui_y + 14, false);
    draw_set_alpha(1);
}

// low HP pulse
if (hp < 30) {
    var pulse_a = 0.4 + 0.2 * sin(current_time / 50);
    draw_set_alpha(pulse_a);
    draw_set_color(c_red);
    draw_rectangle(gui_x + 44, gui_y + 46, gui_x + 44 + hp_w, gui_y + 58, false);
    draw_set_alpha(1);
}

draw_set_color(c_black);
draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_text(gui_x + 44, gui_y + 16, string(floor(air)) + "%");
draw_text(gui_x + 44, gui_y + 60, string(floor(hp)) + "%");

// Light radius indicator (small circle that shrinks)
var lr = 20 * (light_radius / light_max);
draw_set_alpha(0.8);
draw_set_color(c_blue);
draw_circle(gui_x + 120, gui_y + 10, lr, false);
draw_set_alpha(1);

// Enemy3 warning text when nearby
if (instance_exists(obj_enemy3) and point_distance(x, y, obj_enemy3.x, obj_enemy3.y) < 300) {
    draw_set_color(c_red);
    draw_set_halign(fa_center);
    draw_text(gw / 2, gui_y + 4, "⚠ السّجّان القرمزي قريب!");
    draw_set_halign(fa_left);
}
