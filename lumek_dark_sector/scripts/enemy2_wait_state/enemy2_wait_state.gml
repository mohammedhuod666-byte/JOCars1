// ============================================================
//  enemy2_wait_state — Toxic Jelly idle/wait behaviour (script)
// ============================================================
function enemy2_wait_state() {
    if (place_meeting(x, y + 1, Obj_wall)) {
        wait_time -= 1;
        if (wait_time <= 0) {
            state = enemy2_attack_state;
        }
    } else {
        vsp += grav;
    }
}
