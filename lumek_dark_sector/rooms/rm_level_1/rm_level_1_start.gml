// rm_level_1_start
global.level1 = true;
global.level2 = false;
global.level3 = false;
global.level4 = false;
global.level5 = false;

if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_companion)) instance_create_depth(170, 330, -100, obj_companion);
if (!instance_exists(Obj_player)) {
    instance_create_depth(200, 400, 0, Obj_player);
} else {
    with (Obj_player) {
        x = 200; y = 400;
        hp = max_hp; light_radius = light_max; air = max_air;
        jumps = jumps_max; can_dash = true; in_dash = false;
        my_speed_x = 0; my_speed_y = 0;
    }
}