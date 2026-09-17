// ============================================================
//  obj_dialogue — Draw (updated with proper styling)
// ============================================================
var gw = display_get_gui_width();
var gh = display_get_gui_height();
var box_w = gw - margin * 2;

// Panel background
draw_set_alpha(0.88);
draw_set_color(make_color_rgb(10, 10, 24));
draw_roundrect(margin, gh - box_h - margin, margin + box_w, gh - margin, false);
draw_set_alpha(1);

// Border
draw_set_color(c_blue);
draw_set_alpha(0.5);
draw_roundrect(margin, gh - box_h - margin, margin + box_w, gh - margin, true);
draw_set_alpha(1);

// Portrait
if (portrait != noone) {
    draw_set_color(c_white);
    draw_sprite_ext(portrait, 0, margin + 18, gh - box_h - margin + 18, 1, 1, 0, c_white, 1);
}

// Speaker name
if (speaker_name != "") {
    draw_set_color(c_yellow);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
    draw_text(margin + 60, gh - box_h - margin + 10, speaker_name);
}

// Text
draw_set_color(make_color_rgb(235, 225, 210));
draw_set_halign(fa_left);
draw_set_valign(fa_top);
var text_full = lines[current_index];
var text_show = string_copy(text_full, 1, char_index);
draw_text_ext(margin + 60, gh - box_h - margin + 50, text_show, 16, box_w - 90);

// Enter hint
if (is_finished) {
    draw_set_color(c_yellow);
    draw_set_halign(fa_right);
    draw_set_valign(fa_bottom);
    draw_text(gw - margin - 14, gh - margin - 10, "[دخول]");
}
