// ============================================================
//  enemy2_attack_state — Toxic Jelly aggressive chasing (script)
//  Called from obj_enemy2 Step when in aggro state.
// ============================================================
function enemy2_attack_state() {
    if (instance_exists(Obj_player)) {
        var dir = sign(Obj_player.x - x);
        var move_amount = dir * spd;
        
        if (!place_meeting(x + move_amount, y, Obj_wall)) {
            x += move_amount;
        } else {
            if (place_meeting(x, y + 1, Obj_wall)) {
                vsp = jump_speed;
            }
            while (!place_meeting(x + sign(move_amount), y, Obj_wall)) {
                x += sign(move_amount);
            }
        }
        
        if (dir != 0) {
            image_xscale = dir;
        }
        
        if (distance_to_object(Obj_player) > range * 1.5) {
            state = enemy2_wait_state;
        }
    }
}
