// Player vs Enemy1 (Spiky Wheel) — instant knockback + respawn to checkpoint
// DEPRECATED: real damage is handled inside Obj_player Step.
// This collision exists for backwards compatibility with rooms that
// rely on the legacy collision event.  It now delegates to the Step.

var kb = other.image_xscale != 0 ? sign(other.image_xscale) : 1;

other.hp        = max(0, other.hp - 35);
other.light_radius = max(30, other.light_radius - 35);
other.my_speed_x   = kb * 9;
other.my_speed_y   = -8;
other.can_dash     = false;

if (other.hp <= 0) {
    other.player_lost();
}
