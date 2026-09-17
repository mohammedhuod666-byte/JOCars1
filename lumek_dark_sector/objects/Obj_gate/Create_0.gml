// Obj_gate — checkpoint gate / level completion trigger
// When the player steps on it, saves a checkpoint and (if all items
// collected) triggers player_win().  Standby sprite for visual.

image_speed = 0;
image_index = 0;

// visual states
is_active  = true;
flash_timer = 0;
