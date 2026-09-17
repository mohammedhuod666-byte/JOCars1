// ============================================================
//  LUMEK: THE DARK SECTOR — Complete Game
//  obj_player (Lumek) — Create
// ============================================================
// Light Is Life: Lumek's aura is his life force.
// Every hit shrinks the visible radius; items restore it.

max_speed        = 6;
accel            = 0.55;
fric             = 0.32;
grav             = 0.55;
fall_multiplier  = 1.55;
low_jump_mult    = 2.05;

jump_speed       = -10.5;
jumps_max        = 2;
jumps            = jumps_max;

dash_speed       = 15;
dash_time_max    = 9;
dash_time        = 0;
in_dash          = false;
can_dash         = true;
dash_cooldown    = 0;
dash_cooldown_max = 55;

coyote_time      = 0;
coyote_time_max  = 7;
jump_buffer      = 0;
jump_buffer_max  = 7;

allow_movement   = true;
wf_debug         = false;  // set true to see collision boxes

max_air          = 200;
air              = max_air;
light_radius     = 150;
light_max        = 150;
hp               = 100;
max_hp           = 100;

cx = 0;
cy = 0;
respawn_x = x;
respawn_y = y;
mask_index = Spr_player;
sprite_index = Spr_player;
image_xscale = 1;
image_yscale = 1;
image_alpha  = 1;

// guarantee globals
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
if (!variable_global_exists("prev_room")) {
    global.prev_room = room;
}
if (!variable_global_exists("world_built")) {
    global.world_built = false;
}

// auto-spawn ambient systems
if (!instance_exists(obj_lighting)) {
    instance_create_depth(0, 0, -9999, obj_lighting);
}
if (!instance_exists(obj_parallax_city)) {
    instance_create_depth(0, 0, 500, obj_parallax_city);
}
if (!instance_exists(obj_companion)) {
    instance_create_depth(x - 30, y - 65, -100, obj_companion);
}
if (!instance_exists(obj_controller)) {
    instance_create_depth(0, 0, -5000, obj_controller);
}
if (!instance_exists(obj_world_builder)) {
    instance_create_depth(0, 0, 0, obj_world_builder);
}
