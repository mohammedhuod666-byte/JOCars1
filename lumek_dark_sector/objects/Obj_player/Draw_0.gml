// ============================================================
//  LUMEK — obj_player Draw (procedural Lumek character)
//  Head + limbs float because magnetically levitated.
//  Glowing chest pulse + blue aura (also drawn by obj_lighting).
// ============================================================

var cx = x;
var cy = y;
var time = current_time;

var on_ground = place_meeting(x, y + 1, Obj_wall);
var in_dash   = in_dash;
var walk_cycle = (my_speed_x != 0 && on_ground) ? (x * 0.3) : 0;
var in_air    = !on_ground;
var facing    = image_xscale != 0 ? sign(image_xscale) : 1;

// palette — magical automaton
var c_skin  = make_color_rgb(255, 214, 170);
var c_cloth = make_color_rgb(35, 120, 250);
var c_acc   = make_color_rgb(255, 222, 30);
var c_glow  = make_color_rgb(120, 200, 255);

var hover = sin(time / 200) * 1.5;

// shadow
draw_set_color(c_black);
draw_set_alpha(0.28);
draw_ellipse(cx - 14, cy + 15 + hover, cx + 14, cy + 21 + hover, false);
draw_set_alpha(1);

// body bob
var body_bob = in_air ? -5 : (walk_cycle != 0 ? abs(sin(walk_cycle)) * -4 : 0);
var by = cy - 11 + body_bob + hover;

// back leg
draw_set_color(make_color_rgb(18, 70, 170));
var b_leg_x = cx + sin(walk_cycle + pi) * 10 * facing;
var b_leg_y = cy + 11 - abs(cos(walk_cycle + pi)) * 6 + hover;
if (in_air) { b_leg_x = cx - 8 * facing; b_leg_y = cy + 9 + hover; }
draw_circle(b_leg_x, b_leg_y, 4, false);

// back arm
var b_arm_x = cx + sin(walk_cycle) * 12 * facing;
var b_arm_y = by + 3;
if (in_air) { b_arm_x = cx + 10 * facing; b_arm_y = by - 13; }
draw_set_color(c_cloth);
draw_circle(b_arm_x, b_arm_y, 3, false);

// body (cloak)
draw_set_color(c_cloth);
draw_roundrect(cx - 9, by - 12, cx + 9, by + 9, false);
draw_set_color(c_acc);
draw_rectangle(cx - 9, by - 1, cx + 9, by + 5, false); // glowing belt

// magnetic tether line (levitation visual)
draw_set_color(c_glow);
draw_set_alpha(0.22);
draw_line(cx, by + 8, cx, by + 20);
draw_set_alpha(1);

// head (floats separately)
var head_bob = in_air ? -9 : (walk_cycle != 0 ? abs(sin(walk_cycle)) * -2 : 0);
var hy = by - 22 + head_bob + hover;
var hx = cx + (facing * 2);

draw_set_color(c_skin);
draw_circle(hx, hy, 8, false);

// helmet / bandana
draw_set_color(c_acc);
draw_triangle(hx - 9, hy - 5, hx + 9, hy - 5, hx - 14 * facing, hy + 13, false);

// eye
draw_set_color(c_white);
draw_circle(hx + 3 * facing, hy - 2, 2.6, false);
draw_set_color(c_black);
draw_circle(hx + 4 * facing, hy - 2, 1.3, false);

// front leg
draw_set_color(c_cloth);
var f_leg_x = cx + sin(walk_cycle) * 10 * facing;
var f_leg_y = cy + 11 - abs(cos(walk_cycle)) * 6 + hover;
if (in_air) { f_leg_x = cx + 6 * facing; f_leg_y = cy + 6 + hover; }
draw_circle(f_leg_x, f_leg_y, 4, false);
draw_set_color(c_white);
draw_circle(f_leg_x + 2 * facing, f_leg_y, 2, false); // shoe tip

// front arm
draw_set_color(c_skin);
var f_arm_x = cx + sin(walk_cycle + pi) * 12 * facing;
var f_arm_y = by + 3;
if (in_air) { f_arm_x = cx - 12 * facing; f_arm_y = by - 10; }
draw_circle(f_arm_x, f_arm_y, 3, false);

// chest glow while dashing
if (in_dash) {
    draw_set_color(c_yellow);
    draw_set_alpha(0.6 + 0.4 * sin(current_time / 40));
    draw_circle(cx, by - 2, 5, false);
    draw_set_alpha(1);
}

// HP low warning pulse
if (hp < 30) {
    draw_set_color(c_red);
    draw_set_alpha(0.25 + 0.2 * sin(current_time / 35));
    draw_circle(cx, by - 2, 16, false);
    draw_set_alpha(1);
}
