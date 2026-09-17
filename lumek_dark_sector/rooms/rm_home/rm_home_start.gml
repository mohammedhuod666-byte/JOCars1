// rm_home_start
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_gui)) {
    instance_create_depth(0, 0, -5000, obj_gui);
    obj_gui.draw_mode = 2;
}