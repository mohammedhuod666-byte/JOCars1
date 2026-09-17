// ============================================================
//  obj_player_1 (backup/secondary player archetype)
//  Create — identical Light Is Life rules as Obj_player
// ============================================================
max_speed        = 5;
acc              = 1;
grav             = 1;
des              = 2;
respawn_x        = x;
respawn_y        = y;
my_speed_x       = 0;
my_speed_y       = 0;
jump_speed       = -15;
extra_grav       = 4;
items_count      = 0;
allow_movement   = true;

dash_speed       = 18;
dash_time_max    = 5;
dash_time        = dash_time_max;
in_dash          = false;
dash_cooldown_max = 5000;
dash_cooldown    = dash_cooldown_max;
can_dash         = true;

max_air          = 200;
air              = max_air;
hp               = 100;
max_hp           = 100;
light_radius     = 150;
light_max        = 150;
mask_index       = Spr_player_1;

if (!variable_global_exists("level1")) {
    global.level1 = true;
    global.level2 = false;
    global.level3 = false;
    global.level4 = false;
    global.level5 = false;
}
if (!variable_global_exists("player_checkpoint")) {
    global.player_checkpoint = false;
    global.cp_x = 0;
    global.cp_y = 0;
}
if (!variable_global_exists("respawn_x")) {
    global.respawn_x = x;
    global.respawn_y = y;
}
if (!variable_global_exists("dialogue_active")) {
    global.dialogue_active = false;
}
