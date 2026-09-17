// ============================================================
//  Enemy2 — وحش الجيلي (Toxic Jelly)
//  Create
// ============================================================
state           = "idle";
facing          = 1;
hsp             = 0;
vsp             = 0;

grav            = 0.5;
jump_speed      = -10;
aggro_speed     = 2.4;
flee_speed      = 3.2;

detect_range    = 160;
burst_range     = 90;
burst_cooldown  = 50;

cooldown        = 0;
aggro_timer     = 0;
sprite_index    = Spr_enemy2;
image_xscale    = 1;
