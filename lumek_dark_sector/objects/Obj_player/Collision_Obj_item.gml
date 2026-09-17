// Player vs Item — collect glowing motes that restore light/visibility
// "الشرارات" — light motes scattered through levels.

other.items_count += 1;
other.light_radius  = min(other.light_max, other.light_radius + 25);
with (other) {
    // small pop sound if available
    if (variable_instance_exists(other, "so_moca")) {
        // placeholder: Audio playback hook can be added here
    }
}
instance_destroy();
