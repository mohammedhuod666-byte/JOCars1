// ============================================================
//  Enemy1 — العجلة الشوكية (Spiky Wheel)
//  롤링하면서 좌우로巡逻. 접촉 시 즉사.
// ============================================================
spd         = 2.4;
buffer      = 16;
state       = enemy1_right_state;   // 0 = right, function = left
image_xscale = 1;
sprite_index = Spr_enemy1;
