// rm_level_4_start
global.level4 = true; global.level3 = false;
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_companion)) instance_create_depth(270, 230, -100, obj_companion);
if (!instance_exists(Obj_player)) {
    instance_create_depth(300, 300, 0, Obj_player);
} else {
    with (Obj_player) {
        if (global.player_checkpoint) { x = global.cp_x; y = global.cp_y; }
        else { x = 300; y = 300; }
        hp = max_hp; light_radius = light_max; air = max_air;
        jumps = jumps_max; can_dash = true; in_dash = false;
    }
    global.respawn_x = x; global.respawn_y = y;
}
if (instance_number(obj_enemy3) == 0) {
    instance_create_depth(500, 400, -10, obj_enemy3);
    instance_create_depth(700, 300, -10, obj_enemy3);
    instance_create_depth(900, 400, -10, obj_enemy3);
}
if (instance_number(Obj_item) == 0) {
    instance_create_depth(400, 200, -5, Obj_item);
    instance_create_depth(600, 150, -5, Obj_item);
    instance_create_depth(800, 250, -5, Obj_item);
    instance_create_depth(1000, 200, -5, Obj_item);
    instance_create_depth(1200, 300, -5, Obj_item);
}
if (instance_number(Obj_gate) == 0) instance_create_depth(1400, 400, -5, Obj_gate);