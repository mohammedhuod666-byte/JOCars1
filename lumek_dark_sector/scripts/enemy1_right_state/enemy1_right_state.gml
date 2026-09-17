// ============================================================
//  Script — enemy1_right_state
//  Spiky wheel rolls right until wall/cliff → switch to left
// ============================================================
function enemy1_right_state() {
    x += spd;
    image_xscale = 1;
    if (!position_meeting(x + buffer, y + 1, Obj_wall)
        || position_meeting(x + buffer, y - 1, Obj_wall)) {
        state = enenmy1_left_state;
    }
}
