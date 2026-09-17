// ============================================================
//  Enemy3 — Draw (The Jailer: floating red triangular construct)
//  Glowing red eye + message bubble taunt + death particles
// ============================================================

var cx = x;
var cy = y + float_y;
var time = current_time;

var pulse = sin(time / 100) * 2;
var active = (state == "chase" || state == "alert" || state == "dying");
if (active) {
    pulse = sin(time / 40) * 5;
}

// shadow
draw_set_color(c_black);
draw_set_alpha(0.28);
draw_ellipse(cx - 16, cy + 13, cx + 16, cy + 19, false);
draw_set_alpha(1);

// body — angular floating red construct
draw_set_color(c_red);
draw_triangle(cx, cy - 22 - pulse, cx - 16 - pulse, cy + 12, cx + 16 + pulse, cy + 12, false);
draw_set_color(make_color_rgb(160, 0, 0));
draw_triangle(cx, cy - 12, cx - 11, cy + 12, cx + 11, cy + 12, false);

// hit flash
if (hit_flash > 0) {
    draw_set_color(c_white);
    draw_set_alpha(0.5 + 0.5 * sin(current_time / 20));
    draw_circle(cx, cy - 5, 18, false);
    draw_set_alpha(1);
}

// glowing eye
var ex = cx + sign(image_xscale) * 4;
var ey = cy - 6;
draw_set_color(c_yellow);
draw_circle(ex, ey, 5 + pulse / 2, false);
draw_set_color(c_white);
draw_circle(ex + sign(image_xscale) * 1.5, ey - 1.5, 1.5, false);

// death particles
if (state == "dying") {
    draw_set_color(c_yellow);
    draw_set_alpha(0.7);
    for (var i = 0; i < 6; i++) {
        var a = (current_time / 30 + i * 60) mod 360;
        var d = 8 + die_pop * 0.5;
        draw_circle(cx + cos(degtorad(a)) * d, cy + sin(degtorad(a)) * d, 2, false);
    }
    draw_set_alpha(1);
}

// message bubble taunt
if (message_timer > 0) {
    if (!variable_global_exists("font_arabic")) {
        global.font_arabic = font_add("Arial", 14, false, false, 32, 65535);
    }
    draw_set_font(global.font_arabic);

    draw_set_color(c_white);
    draw_set_alpha(0.95);
    draw_roundrect(cx - 44, cy - 34, cx + 44, cy - 6, false);
    draw_set_alpha(1);

    draw_set_color(c_black);
    draw_triangle(cx - 4, cy - 6, cx + 4, cy - 6, cx, cy + 6, false);

    draw_set_color(c_red);
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    var txt = taunts[taunt_index mod array_length(taunts)];
    draw_text(cx, cy - 9, txt);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}

// magnetic tether (red, mirrors Lumek's blue tether)
draw_set_color(make_color_rgb(255, 60, 60));
draw_set_alpha(0.18);
draw_line(cx, cy + 12, cx, cy + 24);
draw_set_alpha(1);
