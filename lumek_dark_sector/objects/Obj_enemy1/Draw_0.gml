// ============================================================
//  Enemy1 — Draw (철제 바퀴 + 뾰족한 스파이크)
// ============================================================
var cx = x;
var cy = y;
var rad = 12;

// 그림자
draw_set_color(c_black);
draw_set_alpha(0.28);
draw_ellipse(cx - rad, cy + rad - 3, cx + rad, cy + rad + 4, false);
draw_set_alpha(1);

// 회전 각도 (위치에 따라 굴러가는 듯한 느낌)
var angle = -x * 3;

// 본체 (회색 철)
draw_set_color(make_color_rgb(110, 110, 115));
draw_circle(cx, cy, rad, false);

// 스파이크 (빨간색)
draw_set_color(c_red);
for (var i = 0; i < 360; i += 45) {
    var a  = degtorad(angle + i);
    var sx = cx + cos(a) * rad;
    var sy = cy + sin(a) * rad;
    var sx2 = cx + cos(a) * (rad + 7);
    var sy2 = cy + sin(a) * (rad + 7);
    draw_line_width(sx, sy, sx2, sy2, 3);
}

// 안쪽 코어 (주황)
draw_set_color(c_orange);
draw_circle(cx, cy, 5, false);
draw_set_color(c_yellow);
draw_circle(cx, cy, 2, false);

// 바닥과의 마찰 자국 (굴러간 느낌)
draw_set_color(make_color_rgb(80, 80, 80));
draw_set_alpha(0.15);
draw_circle(cx, cy + rad + 2, rad * 0.6, false);
draw_set_alpha(1);
