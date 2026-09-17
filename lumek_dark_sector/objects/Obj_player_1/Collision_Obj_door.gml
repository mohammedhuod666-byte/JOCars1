// Obj_player_1 vs Door — exit/return handling (Shift key)
// If door is open → go forward to rm_level_1.
// If door is closed → return to previous level or hub.

if (keyboard_check_released(vk_shift)) {
    if (other.open == true) {
        room_goto(rm_level_1);
    } else {
        if (variable_global_exists("prev_room")) {
            room_goto(global.prev_room);
        } else {
            room_goto(rm_level);
        }
    }
}
