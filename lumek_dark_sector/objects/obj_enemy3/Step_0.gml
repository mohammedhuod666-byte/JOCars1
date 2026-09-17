// ============================================================
//  Enemy3 — Step (The Jailer AI)
//  Patrol → Alert → Chase → (Stomp → Die)
//  Light-hunting behaviour: chases player aggressively.
// ============================================================

var on_ground = place_meeting(x, y + 1, Obj_wall);
var hsp = 0;

// ---- timers ----
if (alert_timer > 0) alert_timer -= 1;
if (message_timer > 0) {
    message_timer -= 1;
} else {
    message_timer = 0;
}
if (hit_flash > 0) hit_flash -= 1;
if (die_timer > 0) {
    die_timer -= 1;
    if (die_timer <= 0) {
        instance_destroy();
    }
    exit;
}

float_y = sin((current_time + float_phase) / 140) * 6;

// ---- gravity ----
if (!on_ground) {
    vsp += grav;
}
if (vsp > 12) vsp = 12;

// ---- state machine ----
if (state == "patrol") {
    hsp = patrol_spd * patrol_dir;

    if (place_meeting(x + hsp, y, Obj_wall)
        || !place_meeting(x + hsp * turn_gap, y + 2, Obj_wall)) {
        patrol_dir *= -1;
        hsp = patrol_spd * patrol_dir;
    }

    if (instance_exists(Obj_player)) {
        if (distance_to_object(Obj_player) < sight_range) {
            state         = "alert";
            alert_timer   = 30;
            message_timer = 160;
            taunt_index   = floor(random(array_length(taunts)));
        }
    }
}
else if (state == "alert") {
    hsp = 0;
    var dir = sign(Obj_player.x - x);
    if (dir != 0) image_xscale = dir;
    if (alert_timer <= 0) {
        state = "chase";
        message_timer = 120;
    }
}
else if (state == "chase") {
    if (!instance_exists(Obj_player)) {
        state = "patrol";
        patrol_dir = 1;
    } else {
        var dir = sign(Obj_player.x - x);
        hsp = chase_spd * dir;
        if (dir != 0) image_xscale = dir;

        if (on_ground) {
            // wall ahead → jump
            if (place_meeting(x + hsp, y, Obj_wall)) {
                vsp = jump_speed;
            }
            // gap ahead → jump
            else if (!place_meeting(x + hsp * 16, y + 2, Obj_wall)) {
                vsp = jump_speed;
            }
        }

        // predictive hop when player above
        if (instance_exists(Obj_player)
            && Obj_player.y < y - 20
            && on_ground
            && abs(Obj_player.x - x) < 120) {
            vsp = jump_speed * 0.85;
        }

        // lose interest if too far
        if (distance_to_object(Obj_player) > lost_range) {
            state = "patrol";
        }

        // periodic taunt
        if (message_timer <= 0 && random(1000) < 2) {
            message_timer = 120;
            taunt_index = (taunt_index + 1) mod array_length(taunts);
        }
    }
}
else if (state == "die") {
    hsp = 0;
    vsp = -5;
    die_timer = 25;
    state = "dying";
}

// ---- horizontal collision ----
if (place_meeting(x + hsp, y, Obj_wall)) {
    while (!place_meeting(x + sign(hsp), y, Obj_wall)) {
        x += sign(hsp);
    }
    hsp = 0;
}
x += hsp;

// ---- vertical collision ----
if (place_meeting(x, y + vsp, Obj_wall)) {
    while (!place_meeting(x, y + sign(vsp), Obj_wall)) {
        y += sign(vsp);
    }
    vsp = 0;
}
y += vsp;

// ---- player contact: hurt Lumek ----
if (place_meeting(x, y, Obj_player)) {
    with (Obj_player) {
        hp          -= 12;
        light_radius = max(25, light_radius - 20);
        if (hp <= 0) {
            player_lost();
        } else {
            var kb = x < Obj_player.x ? -1 : 1;
            my_speed_x = kb * 6;
            my_speed_y = -5;
        }
    }
}

// ---- stomp detection: player landed on top of us ----
if (place_meeting(x, y - 12, Obj_player)
    && vsp == 0
    && on_ground) {
    var pl = instance_place(x, y - 1, Obj_player);
    if (pl != noone && pl.my_speed_y > 0) {
        // player stomped us
        hp = 0;
        state = "die";
        die_timer = 25;
        die_pop = 0;
        with (pl) {
            light_radius = min(light_max, light_radius + 24);
        }
    }
}
