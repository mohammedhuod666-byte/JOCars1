// obj_controller — persistent controller for global game state
// Holds level progression flags + hub navigation.

// ---- Create ----
global.level1 = true;
global.level2 = true;
global.level3 = true;
global.level4 = true;
global.level5 = false;
timer = 120;
box_spawned = false;
global.player_checkpoint = false;
global.cp_x = 0;
global.cp_y = 0;
global.prev_room = room;

// ---- Step ----
if (!box_spawned) {
    if (timer > 0) {
        timer -= 1;
    } else {
        var cam = view_camera[0];
        var cam_x = camera_get_view_x(cam);
        var cam_y = camera_get_view_y(cam);
        var cam_w = camera_get_view_width(cam);
        var cam_h = camera_get_view_height(cam);

        var x_pos = cam_x + cam_w / 2;
        var y_pos = cam_y + cam_h / 2;

        instance_create_layer(x_pos, y_pos, "Instances", Obj_box_2);
        box_spawned = true;
    }
}
