// Obj_player_1 vs Item — collect glowing motes that restore light/visibility
// "الشرارات" — light motes scattered through levels.

other.items_count += 1;
other.light_radius  = min(other.light_max, other.light_radius + 25);
with (other) {
    if (variable_instance_exists(other, "so_moca")) {
        // placeholder audio hook
    }
}
instance_destroy();
