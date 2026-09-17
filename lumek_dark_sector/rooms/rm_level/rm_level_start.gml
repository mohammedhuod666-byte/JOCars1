// rm_level_start — Hub Menu
global.level1 = true; global.level2 = true; global.level3 = true; global.level4 = true; global.level5 = false;
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_gui)) {
    instance_create_depth(0, 0, -5000, obj_gui);
    obj_gui.draw_mode = 1;
}
if (!instance_exists(obj_companion)) instance_create_depth(270, 430, -100, obj_companion);