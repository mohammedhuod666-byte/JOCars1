// ============================================================
//  Enemy2 — Step (Idle / Aggro / Flee + toxic burst)
// ============================================================
var on_ground = place_meeting(x, y + 1, Obj_wall);

if (cooldown > 0) cooldown -= 1;

if (!on_ground) vsp += grav;
if (vsp > 12) vsp = 12;

// ---- state machine ----
if (state == "idle") {
    sprite_index = Spr_enemy2;
    hsp = 0;
    if (instance_exists(Obj_player)) {
        var d = distance_to_object(Obj_player);
        if (d < detect_range && sign(Obj_player.x - x) == facing) {
            state = "aggro";
            aggro_timer = 0;
        }
    }
} else if (state == "aggro") {
    sprite_index = Spr_enemy2_attack;
    aggro_timer += 1;
    var dir = sign(Obj_player.x - x);
    if (dir != 0) {
        facing    = dir;
        image_xscale = dir;
        hsp       = aggro_speed * dir;
    }
    if (on_ground) {
        if (place_meeting(x + hsp, y, Obj_wall)) {
            vsp = jump_speed;
        } else if (!place_meeting(x + hsp * 14, y + 2, Obj_wall)) {
            vsp = jump_speed;
        }
    }
    // toxic burst — if player lingers
    if (instance_exists(Obj_player)
        && distance_to_object(Obj_player) < burst_range
        && cooldown <= 0) {
        cooldown = burst_cooldown;
        if (instance_exists(obj_shoot)) {
            var puff = instance_create_layer(x + 12 * facing, y + 9, "Instances", obj_shoot);
            if (instance_exists(puff)) {
                puff.spd   = 2;
                puff.life  = 60;
                puff.dmg   = 6;
            }
        }
    }
    if (instance_exists(Obj_player)
        && distance_to_object(Obj_player) > detect_range * 1.6) {
        state = "idle";
    }
} else if (state == "die") {
    vsp = -4;
    if (vsp > 0) vsp = 0;
    sprite_index = Spr_enemy2_rest;
    if (place_meeting(x, y + 1, Obj_wall)) {
        alarm[0] = 5;
    }
}

// ---- collision ----
if (place_meeting(x + hsp, y, Obj_wall)) {
    while (!place_meeting(x + sign(hsp), y, Obj_wall)) {
        x += sign(hsp);
    }
    hsp = 0;
}
x += hsp;

if (place_meeting(x, y + vsp, Obj_wall)) {
    while (!place_meeting(x, y + sign(vsp), Obj_wall)) {
        y += sign(vsp);
    }
    vsp = 0;
}
y += vsp;

// ---- contact damage with player (fallback) ----
if (place_meeting(x, y, Obj_player)) {
    with (Obj_player) {
        hp -= 10;
        light_radius = max(25, light_radius - 15);
        if (hp <= 0) player_lost();
    }
}
