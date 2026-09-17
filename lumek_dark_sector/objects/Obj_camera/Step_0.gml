cam = view_camera[0];
view_w = camera_get_view_width(cam);
view_h = camera_get_view_height(cam);
target_x = Obj_player.x-view_w/2;
target_y = Obj_player.y-view_h/2;
cam_x += (1/10)*(target_x-cam_x);
cam_y += (1/20)*(target_y-cam_y);
camera_set_view_pos(cam,cam_x,cam_y);

