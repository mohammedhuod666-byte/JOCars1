
if (instance_exists(Obj_player)) {
    

    x = Obj_player.x;
    y = Obj_player.y - 18;


    var target_to_point = noone;


    if (instance_exists(Obj_item)) {

        target_to_point = instance_nearest(x, y, Obj_item);
    }

    else if (instance_exists(Obj_gate)) {

        target_to_point = instance_nearest(x, y, Obj_gate);
    }


    if (target_to_point != noone) {
        image_angle = point_direction(x, y, target_to_point.x, target_to_point.y);
    }
}