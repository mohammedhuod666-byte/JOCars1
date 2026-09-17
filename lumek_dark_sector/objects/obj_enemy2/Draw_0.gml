// ============================================================
//  Enemy2 — Draw (독성 녹색 젤리 괴물)
// ============================================================
var cx = x;
var cy = y;

var time = current_time;
var pulse = sin(time / 150) * 4;
var w = 15 + pulse;
var h = 15 - pulse;

if (state == "aggro") {
    w = 15 + sin(time / 50) * 6;
    h = 15 - sin(time / 50) * 6;
}

// 그림자
draw_set_color(c_black);
draw_set_alpha(0.28);
draw_ellipse(cx - 15, cy + 13, cx + 15, cy + 19, false);
draw_set_alpha(1);

// 젤리 몸체
draw_set_color(make_color_rgb(0, 245, 90));
draw_ellipse(cx - w, cy - h, cx + w, cy + 15, false);
draw_set_color(make_color_rgb(0, 140, 45));
draw_ellipse(cx - w + 4, cy - h + 4, cx + w - 4, cy + 14, false);

// 눈
var ex = cx + sign(image_xscale) * 5;
draw_set_color(c_white);
draw_circle(ex - 4, cy - 2, 3, false);
draw_circle(ex + 4, cy - 2, 3, false);
draw_set_color(c_black);
draw_circle(ex - 4 + sign(image_xscale), cy - 2, 1, false);
draw_circle(ex + 4 + sign(image_xscale), cy - 2, 1, false);

// toxic drip (aggro일 때)
if (state == "aggro") {
    draw_set_color(make_color_rgb(30, 255, 130));
    draw_set_alpha(0.5);
    draw_circle(cx - 8, cy + 12, 3, false);
    draw_circle(cx + 8, cy + 14, 2, false);
    draw_set_alpha(1);
}
