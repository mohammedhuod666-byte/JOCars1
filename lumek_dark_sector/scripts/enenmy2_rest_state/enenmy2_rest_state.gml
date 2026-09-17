// ============================================================
//  enenmy2_rest_state — Toxic Jelly idle animation (script)
//  Note: original naming kept (typo in original project).
// ============================================================
function enenmy2_rest_state() {
    sprite_index = Spr_enemy2_rest;
    if (instance_exists(Obj_player)) {
        if (distance_to_object(Obj_player) < detect_range) {
            state = enemy2_attack_state;
        }
    }
}
