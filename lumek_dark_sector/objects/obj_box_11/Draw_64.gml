var gw = display_get_gui_width(); 
var gh = display_get_gui_height();
var margin = 24;
var box_h = 120;
var box_w = gw - margin*2;


draw_set_alpha(0.85);
draw_set_color(c_black);
draw_roundrect(margin, gh - box_h - margin, margin + box_w, gh - margin, false);
draw_set_alpha(1);




if (is_real(portrait) && portrait != -1 && sprite_exists(portrait)) {
     draw_sprite_ext(portrait, 0, margin + 20, gh - box_h - margin + 20, 1, 1, 0, c_white, 1);
	 draw_sprite(Spr_npc_portrait, 0, 200, 200)
}


draw_set_color(c_white);
draw_set_halign(fa_left);
draw_set_valign(fa_middle);

var text_show = string_copy(text, 1, char_index);
var text_x = margin + 20;
var text_y = gh - box_h/2 - margin;
draw_text(text_x, text_y, text_show);