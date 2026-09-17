// enemy3_states — Helper functions for The Jailer (obj_enemy3)
// Main logic is in obj_enemy3 Step_0.gml; these are supplementary.
function enemy3_idle_state() {
    if (instance_exists(Obj_player)) {
        if (distance_to_object(Obj_player) < sight_range) {
            state = "alert";
            return true;
        }
    }
    return false;
}

function enemy3_attack_state() {
    if (instance_exists(Obj_player)) {
        var dir = sign(Obj_player.x - x);
        var move_amount = dir * chase_spd;
        
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
        
        if (distance_to_object(Obj_player) > lost_range) {
            state = "patrol";
        }
    }
}
