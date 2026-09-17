// ============================================================
//  Enemy3 — Collision with player (legacy event / belt-and-suspenders)
//  Most contact damage is handled in obj_enemy3 Step and
//  Obj_player Step. This event exists so that GM collision
//  events also fire if a room relies on them.
// ============================================================
with (other) {
    hp          -= 12;
    light_radius = max(25, light_radius - 20);
    if (hp <= 0) {
        player_lost();
    }
}
