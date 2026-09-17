// ============================================================
//  player_win — advance through levels with checkpoint logic
//  Each level completion sets the next level flag and returns to hub.
// ============================================================
function player_win() {
    // remember where we came from for door return logic
    global.prev_room = room;

    if (room == rm_level_1) {
        global.level2 = true;
    }
    if (room == rm_level_2) {
        global.level3 = true;
    }
    if (room == rm_level_3) {
        global.level4 = true;
    }
    if (room == rm_level_4) {
        global.level5 = true;
    }

    // return to hub level (rm_level) to select next stage
    room_goto(rm_level);
}

global.player_checkpoint = false;
