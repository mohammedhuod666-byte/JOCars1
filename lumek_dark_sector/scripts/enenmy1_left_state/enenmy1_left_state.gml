// ============================================================
//  Script — enenmy1_left_state (note: original naming kept)
//  Spiky wheel rolls left until wall/cliff → switch to right
// ============================================================
function enenmy1_left_state() {
    x -= spd;
    image_xscale = -1;
    if (!position_meeting(x - buffer, y + 1, Obj_wall)
        || position_meeting(x - buffer, y - 1, Obj_wall)) {
        state = enemy1_right_state;
    }
}
