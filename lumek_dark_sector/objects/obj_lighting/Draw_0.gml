// obj_lighting — cinematic dynamic light mask
// Black surface with subtractive "holes" punched for each light source,
// plus additive colored glows: blue (Lumek), red (The Jailer),
// orange (Spiky Wheel), green (Toxic Jelly).
//
// Light Is Life: the player object owns `light_radius`; when it shrinks
// (from damage / water / darkness), the mask hole around Lumek gets
// smaller, making the screen darker and harder to see.

var rname = room_get_name(room);
if (rname == "rm_level_1" or rname == "rm_level_2"
    or rname == "rm_level_GGG" or rname == "rm_building_1"
    or rname == "rm_level" or rname == "rm_level_3"
    or rname == "rm_level_4" or rname == "rm_level_4_4_level") {

    var cam = view_camera[0];
    var cx  = camera_get_view_x(cam);
    var cy  = camera_get_view_y(cam);
    var cw  = camera_get_view_width(cam);
    var ch  = camera_get_view_height(cam);

    if (cw == 0) {
        cx = 0; cy = 0;
        cw = min(room_width, 2048);
        ch = min(room_height, 2048);
    }

    if (!surface_exists(surf)) {
        surf = surface_create(cw, ch);
    }
    if (!surface_exists(surf)) exit;

    surface_set_target(surf);

    // dark base
    draw_clear_alpha(make_color_rgb(4, 4, 18), 0.92);

    gpu_set_blendmode(bm_subtract);
    draw_set_color(c_white);

    // ---- player light (shrinks when hurt) ----
    if (instance_exists(Obj_player)) {
        var pl = Obj_player;
        var rad = pl.light_radius + sin(current_time / 50) * 4;
        var px  = pl.x - cx;
        var py  = pl.y - 12 - cy;

        // intense core
        draw_set_alpha(1.0);
        draw_circle(px, py, rad * 0.35, false);

        // mid glow
        draw_set_alpha(0.55);
        draw_circle(px, py, rad * 0.65, false);

        // outer soft halo
        draw_set_alpha(0.25);
        draw_circle(px, py, rad, false);

        // faint blue-ish rim
        draw_set_color(make_color_rgb(120, 180, 255));
        draw_set_alpha(0.15);
        draw_circle(px, py, rad * 1.2, false);
        draw_set_color(c_white);
    }

    // ---- The Jailer red light ----
    if (instance_exists(obj_enemy3)) {
        with (obj_enemy3) {
            var rad = 90 + sin(current_time / 30) * 10 + (state == "chase" ? 30 : 0);
            var px  = x - cx;
            var py  = y - 12 - cy;
            draw_set_alpha(0.65);
            draw_circle(px, py, rad * 0.5, false);
            draw_set_alpha(0.2);
            draw_circle(px, py, rad, false);
        }
    }

    // ---- Spiky Wheel orange light ----
    if (instance_exists(Obj_enemy1)) {
        with (Obj_enemy1) {
            draw_set_alpha(0.35);
            draw_circle(x - cx, y - cy, 70, false);
        }
    }

    // ---- Toxic Jelly green light (faint, for darkness puzzles) ----
    if (instance_exists(obj_enemy2)) {
        with (obj_enemy2) {
            draw_set_alpha(0.22);
            draw_circle(x - cx, y - cy, 55, false);
        }
    }

    gpu_set_blendmode(bm_normal);
    draw_set_alpha(1.0);
    surface_reset_target();

    // draw mask to screen
    draw_surface(surf, cx, cy);

    // ---- additive colored ambient ----
    gpu_set_blendmode(bm_add);

    if (instance_exists(Obj_player)) {
        draw_set_color(make_color_rgb(40, 110, 255));
        draw_set_alpha(0.32);
        draw_circle(Obj_player.x, Obj_player.y - 12, Obj_player.light_radius + sin(current_time / 50) * 5, false);
        draw_set_color(c_white);
    }

    if (instance_exists(obj_enemy3)) {
        draw_set_color(c_red);
        draw_set_alpha(0.4);
        draw_circle(obj_enemy3.x, obj_enemy3.y - 12, 110, false);
        draw_set_color(c_white);
    }

    if (instance_exists(Obj_enemy1)) {
        draw_set_color(c_orange);
        draw_set_alpha(0.26);
        draw_circle(Obj_enemy1.x, Obj_enemy1.y, 75, false);
        draw_set_color(c_white);
    }

    if (instance_exists(obj_enemy2)) {
        draw_set_color(make_color_rgb(40, 220, 120));
        draw_set_alpha(0.16);
        draw_circle(obj_enemy2.x, obj_enemy2.y, 60, false);
        draw_set_color(c_white);
    }

    gpu_set_blendmode(bm_normal);
    draw_set_alpha(1.0);
}
