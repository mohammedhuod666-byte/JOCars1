// Obj_box_2 — Step
if (place_meeting(x, y + 1, Obj_wall)) {
    // landed — can be collected
    if (instance_exists(Obj_player) && point_distance(x, y, Obj_player.x, Obj_player.y) < 40) {
        with (Obj_player) {
            light_radius = min(light_max, light_radius + 15);
        }
        instance_destroy();
    }
}
