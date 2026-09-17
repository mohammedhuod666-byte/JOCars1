// RoomCreationCode for rm_level_1
// This is the room's creation code - runs once when room starts.
// Use the rm_level_1_start.gml script for initialisation.
if (variable_global_exists("rm_level_1_init_done") == false) {
    global.rm_level_1_init_done = true;
    // Call the start script manually if needed
    if (variable_global_exists("verbose_init")) {
        show_debug_message("rm_level_1 creation code running");
    }
}
