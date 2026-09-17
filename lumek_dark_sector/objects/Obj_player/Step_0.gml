// ============================================================
//  LUMEK: THE DARK SECTOR — obj_player Step
//  Light Is Life + full parkour + enemies + items + checkpoints
// ============================================================

Script1();  // input → named state flags (right/left/up/up_pressed/dash/action/sword)
if (!allow_movement) exit;

// ---- timers ----
if (coyote_time > 0) coyote_time -= 1;
if (jump_buffer > 0) jump_buffer -= 1;
if (dash_cooldown > 0) dash_cooldown -= 1;

// ---- Dash ----
if (dash && can_dash && dash_cooldown <= 0 && !in_dash) {
    in_dash     = true;
    can_dash    = false;
    dash_time   = dash_time_max;
    my_speed_y  = 0;                 // suspend gravity while dashing
    var dir     = right - left;
    my_speed_x  = dash_speed * (dir != 0 ? sign(dir) : (image_xscale != 0 ? sign(image_xscale) : 1));
    // light burst on dash
    light_radius = min(light_max, light_radius + 14);
}

if (in_dash) {
    dash_time -= 1;
    // dash trail
    if (instance_exists(obj_trail)) {
        var tr = instance_create_layer(x, y, "Instances", obj_trail);
        if (instance_exists(tr)) {
            tr.sprite_index = sprite_index;
            tr.image_xscale = image_xscale;
            tr.image_yscale = image_yscale;
            tr.color = c_blue;
        }
    }
    if (dash_time <= 0) {
        in_dash       = false;
        dash_cooldown = dash_cooldown_max;
    }
}

// ---- Horizontal Movement ----
if (!in_dash) {
    var dir = right - left;

    if (dir != 0) {
        my_speed_x += dir * accel;
        my_speed_x  = clamp(my_speed_x, -max_speed, max_speed);
        image_xscale = sign(dir);
        if (sprite_index == Spr_player || sprite_index == Spr_player_2) {
            sprite_index = Spr_player_4;
        }
    } else {
        if (my_speed_x > 0) {
            my_speed_x -= fric;
            if (my_speed_x < 0) my_speed_x = 0;
        } else if (my_speed_x < 0) {
            my_speed_x += fric;
            if (my_speed_x > 0) my_speed_x = 0;
        }
        if (sprite_index == Spr_player_4) sprite_index = Spr_player;
    }

    if (up_pressed) jump_buffer = jump_buffer_max;

    var on_ground = place_meeting(x, y + 1, Obj_wall);
    if (on_ground) {
        coyote_time = coyote_time_max;
        jumps       = jumps_max;
        can_dash    = true;
        if (sprite_index == Spr_player_2) sprite_index = Spr_player;
    } else {
        if (sprite_index == Spr_player || sprite_index == Spr_player_4) {
            sprite_index = Spr_player_2;
        }
    }

    if (jump_buffer > 0) {
        if (coyote_time > 0 || jumps > 0) {
            jump_buffer = 0;
            coyote_time = 0;
            my_speed_y  = jump_speed;
            if (!on_ground) jumps -= 1;
            light_radius = min(light_max, light_radius + 7);
        }
    }

    if (my_speed_y < 0 && !up) {
        my_speed_y += grav * low_jump_mult;
    } else if (my_speed_y > 0) {
        my_speed_y += grav * fall_multiplier;
    } else {
        my_speed_y += grav;
    }
    if (my_speed_y > 12) my_speed_y = 12;
}

// ---- Collision move ----
if (place_meeting(x + my_speed_x, y, Obj_wall)) {
    while (!place_meeting(x + sign(my_speed_x), y, Obj_wall)) {
        x += sign(my_speed_x);
    }
    my_speed_x = 0;
}
x += my_speed_x;

if (place_meeting(x, y + my_speed_y, Obj_wall)) {
    while (!place_meeting(x, y + sign(my_speed_y), Obj_wall)) {
        y += sign(my_speed_y);
    }
    my_speed_y = 0;
}
y += my_speed_y;

// ---- Enemy Combat ----
// 1) Stomp The Jailer (obj_enemy3) → bounce + kill
var jailer = instance_place(x, y + 1, obj_enemy3);
if (jailer != noone && my_speed_y > 0) {
    my_speed_y = jump_speed * 0.7;
    with (jailer) {
        hp = 0;
        state = "die";
        alarm[0] = 15;
    }
    light_radius = min(light_max, light_radius + 16);
    // small bounce trail
    if (instance_exists(obj_trail)) {
        var btr = instance_create_layer(x, y, "Instances", obj_trail);
        if (instance_exists(btr)) {
            btr.sprite_index = Spr_player;
            btr.image_xscale = image_xscale;
            btr.color = c_yellow;
        }
    }
}

// 2) Enemy1 (Spiky Wheel) — instant contact damage
if (place_meeting(x, y, Obj_enemy1)) {
    hp          -= 25;
    light_radius = max(25, light_radius - 35);
    if (hp <= 0) {
        player_lost();
    } else {
        var kb = image_xscale != 0 ? sign(image_xscale) : -1;
        my_speed_x = kb * 9;
        my_speed_y = -8;
    }
}

// 3) Enemy2 (Toxic Jelly) — continuous bleed
if (place_meeting(x, y, obj_enemy2)) {
    hp           -= 0.7;
    light_radius = max(25, light_radius - 0.7);
    if (hp <= 0) player_lost();
}

// ---- Water (toxic sludge) — drains air + light ----
if (place_meeting(x, y, Obj_water)) {
    my_speed_x *= 0.82;
    my_speed_y *= 0.82;
    air -= 1;
    if (air <= 0) {
        hp          -= 1;
        light_radius = max(25, light_radius - 0.6);
        if (hp <= 0) player_lost();
    }
} else {
    if (air < max_air) air += 1.2;
}

// ---- Light recovery when out of danger ----
if (!place_meeting(x, y, Obj_water)
    && !place_meeting(x, y, Obj_enemy1)
    && !place_meeting(x, y, obj_enemy2)) {
    if (light_radius < light_max) light_radius += 0.18;
}

// ---- Item pickups handled by Collision_Obj_item ----

// ---- Sign / dialogue interaction ----
var s = instance_nearest(x, y, Obj_sign_warning_1);
if (s != noone && point_distance(x, y, s.x, s.y) <= s.interact_radius) {
    if (keyboard_check_pressed(vk_control) && !instance_exists(obj_dialogue)) {
        var d = instance_create_layer(0, 0, "Instances", obj_dialogue);
        if (instance_exists(d)) {
            d.lines        = s.lines;
            d.portrait     = Spr_player_3;
            d.speaker_name = "لوميك";
            global.dialogue_active = true;
        }
    }
}
var s2 = instance_nearest(x, y, Obj_sign_warning_2);
if (s2 != noone) {
    var rad = 56;
    if (variable_instance_exists(s2, "interact_radius")) rad = s2.interact_radius;
    if (point_distance(x, y, s2.x, s2.y) <= rad) {
        if (keyboard_check_pressed(vk_control) && !instance_exists(obj_dialogue)) {
            var d = instance_create_layer(0, 0, "Instances", obj_dialogue);
            if (instance_exists(d)) {
                d.lines        = s2.lines;
                d.portrait     = Spr_npc_portrait;
                d.speaker_name = "رسالة";
                global.dialogue_active = true;
            }
        }
    }
}

// ---- Checkpoint (stepping on gate) ----
if (place_meeting(x, y + 1, Obj_gate)) {
    global.player_checkpoint = true;
    global.cp_x = x;
    global.cp_y = y;
    global.respawn_x = x;
    global.respawn_y = y;
}

// ---- Respawn hotkey (rm_level_2 only) ----
if (keyboard_check_pressed(ord("Z"))
    && room_get_name(room) == "rm_level_2") {
    x = global.respawn_x;
    y = global.respawn_y;
    my_speed_x = 0;
    my_speed_y = 0;
    can_dash   = true;
    hp         = max_hp;
    light_radius = light_max;
    air        = max_air;
    jumps      = jumps_max;
}

// ---- Fall off world ----
if (y > room_height + 100) {
    player_lost();
}
