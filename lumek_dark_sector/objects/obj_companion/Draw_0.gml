// obj_companion — Draw
// Companion icon drawn beside player.

var cx = x;
var cy = y;

// Guide orb — soft blue glow
draw_set_color(c_blue);
draw_set_alpha(0.55);
draw_circle(cx, cy, 7, false);
draw_set_alpha(1);

// If talking, little speech indicator
if (is_talking && chat_timer > 0) {
    draw_set_color(c_yellow);
    draw_set_alpha(0.75);
    draw_circle(cx + 11, cy - 7, 2.5, false);
    draw_set_alpha(1);
}
