// Obj_player_1 vs Enemy1 (Spiky Wheel) — instant knockback + damage
// Light Is Life: contact shrinks player light aura.

var kb = other.image_xscale != 0 ? sign(other.image_xscale) : 1;

other.hp          -= 35;
other.light_radius = max(30, other.light_radius - 35);
other.my_speed_x    = kb * 9;
other.my_speed_y    = -8;
other.can_dash      = false;

if (other.hp <= 0) {
    other.player_lost();
}
