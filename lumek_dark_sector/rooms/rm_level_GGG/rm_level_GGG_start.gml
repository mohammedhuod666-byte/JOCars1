// rm_level_GGG_start — Open World Hub
global.level1 = true; global.level2 = true; global.level3 = true; global.level4 = true; global.level5 = false;
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_parallax_city)) instance_create_depth(0, 0, -1000, obj_parallax_city);
if (!instance_exists(obj_companion)) instance_create_depth(170, 930, -100, obj_companion);
if (!instance_exists(obj_world_builder)) instance_create_depth(0, 0, 0, obj_world_builder);
if (!instance_exists(obj_controller)) instance_create_depth(0, 0, -5000, obj_controller);
if (!instance_exists(Obj_player)) {
    instance_create_depth(200, 1000, 0, Obj_player);
} else {
    with (Obj_player) {
        x = 200; y = 1000;
        hp = max_hp; light_radius = light_max; air = max_air;
        jumps = jumps_max; can_dash = true; in_dash = false;
        my_speed_x = 0; my_speed_y = 0;
    }
    global.respawn_x = x; global.respawn_y = y;
}