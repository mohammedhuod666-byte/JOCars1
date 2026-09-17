import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

create_code = """
max_speed = 6;
accel = 0.5;
fric = 0.3;
grav = 0.5;
fall_multiplier = 1.5;
low_jump_multiplier = 2.0;

respawn_x = x;
respawn_y = y;

my_speed_x = 0;
my_speed_y = 0;
jump_speed = -10;

jumps_max = 2;
jumps = jumps_max;

// Coyote Time
coyote_time_max = 6;
coyote_time = 0;

// Jump Buffer
jump_buffer_max = 6;
jump_buffer = 0;

allow_movement = true; 

// Dash
dash_speed = 15;
dash_time_max = 10;
dash_time = 0;
in_dash = false;
can_dash = true;
dash_cooldown_max = 60;
dash_cooldown = 0;

// Sub-pixel movement (for extra smoothness)
cx = 0;
cy = 0;

max_air = 200;
air = max_air;   
hp = 100;
"""

step_code = """
Script1();

if (!allow_movement) exit;

// ----- Timers -----
if (coyote_time > 0) coyote_time -= 1;
if (jump_buffer > 0) jump_buffer -= 1;
if (dash_cooldown > 0) dash_cooldown -= 1;

// ----- State: Dash -----
if (dash and can_dash and dash_cooldown <= 0 and !in_dash) {
    in_dash = true;
    can_dash = false;
    dash_time = dash_time_max;
    my_speed_y = 0; // suspend gravity
    my_speed_x = dash_speed * (image_xscale != 0 ? sign(image_xscale) : 1);
}

if (in_dash) {
    dash_time -= 1;
    // Create trail
    var trail = instance_create_layer(x, y, "Instances", obj_trail);
    trail.sprite_index = sprite_index;
    trail.image_xscale = image_xscale;
    trail.image_yscale = image_yscale;
    
    if (dash_time <= 0) {
        in_dash = false;
        dash_cooldown = dash_cooldown_max;
    }
}

// ----- State: Normal Movement -----
if (!in_dash) {
    // Horizontal Movement (Acceleration & Friction)
    var dir = right - left;
    
    if (dir != 0) {
        my_speed_x += dir * accel;
        my_speed_x = clamp(my_speed_x, -max_speed, max_speed);
        image_xscale = sign(dir); // Face direction
        sprite_index = Spr_player_4; // Walk anim placeholder
    } else {
        // Friction
        if (my_speed_x > 0) {
            my_speed_x -= fric;
            if (my_speed_x < 0) my_speed_x = 0;
        } else if (my_speed_x < 0) {
            my_speed_x += fric;
            if (my_speed_x > 0) my_speed_x = 0;
        }
        sprite_index = Spr_player; // Idle anim placeholder
    }

    // Vertical Movement (Gravity & Jump feel)
    var on_ground = place_meeting(x, y + 1, Obj_wall);
    
    if (on_ground) {
        coyote_time = coyote_time_max;
        jumps = jumps_max;
        can_dash = true;
    } else {
        sprite_index = Spr_player_2; // Jump anim placeholder
    }

    if (up_pressed) {
        jump_buffer = jump_buffer_max;
    }

    // Process Jump
    if (jump_buffer > 0) {
        if (coyote_time > 0 or jumps > 0) {
            jump_buffer = 0;
            coyote_time = 0;
            my_speed_y = jump_speed;
            
            if (!on_ground) jumps -= 1; // Used a double jump
        }
    }

    // Better jump arc (Mario/Celeste style)
    if (my_speed_y < 0 and !up) {
        my_speed_y += grav * low_jump_multiplier; // Release early to jump shorter
    } else if (my_speed_y > 0) {
        my_speed_y += grav * fall_multiplier; // Fall faster
    } else {
        my_speed_y += grav; // Normal gravity
    }
    
    // Terminal velocity
    if (my_speed_y > 12) my_speed_y = 12;
}

// ----- Collision & Movement -----
// Horizontal
if (place_meeting(x + my_speed_x, y, Obj_wall)) {
    while (!place_meeting(x + sign(my_speed_x), y, Obj_wall)) {
        x += sign(my_speed_x);
    }
    my_speed_x = 0;
}
x += my_speed_x;

// Vertical
if (place_meeting(x, y + my_speed_y, Obj_wall)) {
    while (!place_meeting(x, y + sign(my_speed_y), Obj_wall)) {
        y += sign(my_speed_y);
    }
    my_speed_y = 0;
}
y += my_speed_y;

// ----- Enemy Combat (Bounce to Kill obj_enemy3) -----
var enemy = instance_place(x, y + 1, obj_enemy3);
if (enemy != noone and my_speed_y > 0) {
    // We landed on their head
    my_speed_y = jump_speed * 0.8; // Bounce
    with(enemy) {
        instance_destroy(); // Kill enemy
    }
}

// ----- Water logic -----
if (place_meeting(x, y, Obj_water)) {
    my_speed_x *= 0.8;  
    my_speed_y *= 0.8;
    
    air -= 1;
    if (air <= 0) {
        hp -= 1;
        if(hp < 0) player_lost();
    }
} else {
    if (air < max_air) air += 1;
}

// ----- Interactions -----
var s = instance_nearest(x, y, Obj_sign_warning_1);
if (s != noone && point_distance(x, y, s.x, s.y) <= s.interact_radius) {
    if (keyboard_check_pressed(vk_control) && !instance_exists(obj_dialogue)) {
        var dman = instance_create_layer(0, 0, "Instances", obj_dialogue);
        dman.lines = s.lines;
        dman.portrait = Spr_player_3;
        dman.speaker_name = "unknown";
        global.dialogue_active = true;
    }
}

// Respawn hotkey
if (keyboard_check_pressed(ord("Z")) && room_get_name(room) == "rm_level_2") {
    x = global.respawn_x;
    y = global.respawn_y;
    can_dash = true;
}
"""

write_file('objects/Obj_player/Create_0.gml', create_code.strip())
write_file('objects/Obj_player/Step_0.gml', step_code.strip())
print("Player updated with professional FSM and jump mechanics.")
