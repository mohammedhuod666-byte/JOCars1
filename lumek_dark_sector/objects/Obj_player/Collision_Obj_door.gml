// Player vs Door — exit+back handling (Shift toggles between go/return)
// If the door is open, pressing Shift goes to rm_level_1.
// If the door is closed, pressing Shift returns to the previous level.
// Relies on the door owning an `open` variable.

if (keyboard_check_released(vk_shift)) {
    if (other.open == true) {
        // going "forward" to next hub
        room_goto(rm_level_1);
    } else {
        // returning back
        if (variable_global_exists("prev_room")) {
            room_goto(global.prev_room);
        } else {
            room_goto(rm_level);
        }
    }
}
