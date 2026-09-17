// Obj_player_1 vs Gate — checkpoint save + win condition
// When ALL items in the room are collected, player_win() triggers.
// Stepping on a Gate also saves a checkpoint.

if (instance_number(Obj_item) == 0) {
    player_win();
}

// Save checkpoint when stepping on gate
global.player_checkpoint = true;
global.cp_x = x;
global.cp_y = y;
global.respawn_x = x;
global.respawn_y = y;
