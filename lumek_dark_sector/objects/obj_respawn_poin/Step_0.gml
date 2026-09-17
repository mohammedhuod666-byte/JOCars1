// obj_respawn_poin — Step
if (instance_exists(Obj_player) && place_meeting(x, y + 1, Obj_player)) {
    global.respawn_x = x;
    global.respawn_y = y - 20;
    global.player_checkpoint = true;
}
