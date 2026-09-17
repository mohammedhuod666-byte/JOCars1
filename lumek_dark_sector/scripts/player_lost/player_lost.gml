// ============================================================
//  player_lost — proper respawn with checkpoint + light reset
//  Replaces the old room_restart() which discarded progress.
// ============================================================
// Save checkpoint position before dying
if (instance_exists(Obj_gate)) {
    global.cp_x = x;
    global.cp_y = y;
    global.player_checkpoint = true;
}
global.respawn_x = x;
global.respawn_y = y;

// reset personal state
hp           = max_hp;
light_radius = light_max;
air          = max_air;
jumps        = jumps_max;
my_speed_x   = 0;
my_speed_y   = 0;
can_dash     = true;
in_dash      = false;
dash_cooldown = 0;

// wait a beat then respawn at checkpoint or start of room
alarm[0] = 40;

// Draw a brief flash to indicate death (optional)
var flash = instance_create_layer(x, y, "Instances", Obj_wall);
if (instance_exists(flash)) {
    flash.image_xscale = 1.2;
    flash.image_yscale = 1.2;
    flash.alpha = 0.6;
    flash.sprite_index = Spr_black;
    alarm[0] = 8;
    with (flash) alarm[0] = 8;  // kill after short flash
}
