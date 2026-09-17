// ============================================================
//  Obj_item — Step
//  Hover animation handled here; pickup is handled by player
//  collision events (Collision_Obj_item.gml in Obj_player).
// ============================================================
y += sin(current_time / 200 + glow_phase) * 0.3;
