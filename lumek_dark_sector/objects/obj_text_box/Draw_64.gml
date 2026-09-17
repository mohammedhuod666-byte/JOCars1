draw_sprite(spr_text_box,-1,my_x,my_y)
text_length = string_length(text)
sub_text = string_copy(text,0,text_position)


draw_set_halign(fa_left);
draw_set_valign(fa_top);
draw_text_ext(my_x+23,my_y+23,sub_text,-1,480) 
text_position += text_speed;
if(text_position>= text_length)
{
	text_speed = 0;
	text_position =text_length
}