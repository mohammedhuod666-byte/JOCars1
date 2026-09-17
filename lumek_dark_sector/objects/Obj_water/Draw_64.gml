// Obj_water — Draw (animated toxic-looking water surface)
var left   = x;
var right  = x + sprite_width;
var top    = y;
var bottom = y + sprite_height;

var step = 4;

// base dark toxic water
draw_set_color(make_color_rgb(10, 40, 50));
draw_rectangle(left, top, right, bottom, false);

// wave lines
draw_set_color(make_color_rgb(40, 160, 140));
draw_set_alpha(0.7);
for (var xx = left; xx <= right; xx += step) {
    var wave_y = top + sin((xx / wave_length) + wave_offset) * wave_amplitude;
    draw_line(xx, wave_y, xx, bottom);
}
draw_set_alpha(1);

// surface highlight
draw_set_color(make_color_rgb(80, 200, 170));
draw_set_alpha(0.35);
for (var xx = left; xx <= right; xx += step * 2) {
    var wave_y = top + sin((xx / wave_length) + wave_offset) * wave_amplitude;
    draw_line(xx, wave_y, xx + 2, wave_y - 2);
}
draw_set_alpha(1);
