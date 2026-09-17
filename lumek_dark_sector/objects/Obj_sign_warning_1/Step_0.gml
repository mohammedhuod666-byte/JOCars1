// Obj_sign_warning_1 — Step
hover += 0.03;
image_index = 0;

if (instance_exists(Obj_player)) {
    var dist = point_distance(x, y, Obj_player.x, Obj_player.y);
    if (dist <= interact_radius) {
        if (keyboard_check_pressed(vk_control) && !instance_exists(obj_dialogue)) {
            var d = instance_create_layer(0, 0, "Instances", obj_dialogue);
            if (instance_exists(d)) {
                d.lines        = lines;
                d.portrait     = Spr_player_3;
                d.speaker_name = "لوميك";
                global.dialogue_active = true;
            }
        }
    }
}
