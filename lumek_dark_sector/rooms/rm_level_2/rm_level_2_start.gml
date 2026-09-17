// rm_level_2_start — Dark Dungeon
global.level2 = true; global.level1 = false;
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_dark)) {
    instance_create_depth(0, 0, -9998, obj_dark);
    obj_dark.duration = 60 * 90;
}
if (!instance_exists(obj_companion)) instance_create_depth(270, 530, -100, obj_companion);
if (!instance_exists(Obj_player)) {
    instance_create_depth(300, 600, 0, Obj_player);
} else {
    with (Obj_player) {
        if (global.player_checkpoint) { x = global.cp_x; y = global.cp_y; }
        else { x = 300; y = 600; }
        hp = max_hp; light_radius = light_max; air = max_air;
        jumps = jumps_max; can_dash = true; in_dash = false;
    }
    global.respawn_x = x; global.respawn_y = y;
}
if (instance_number(Obj_item) == 0) {
    instance_create_depth(500, 500, -5, Obj_item);
    instance_create_depth(700, 400, -5, Obj_item);
    instance_create_depth(300, 800, -5, Obj_item);
    instance_create_depth(900, 700, -5, Obj_item);
}
if (instance_number(obj_enemy3) == 0) instance_create_depth(1000, 600, -10, obj_enemy3);
if (instance_number(Obj_water) == 0) {
    var w = instance_create_depth(200, 950, -5, Obj_water);
    if (instance_exists(w)) { w.sprite_index = Spr_water; w.image_xscale = 6; w.image_yscale = 2; }
}
if (instance_number(Obj_gate) == 0) instance_create_depth(1200, 700, -5, Obj_gate);
if (instance_number(Obj_sign_warning_1) == 0) {
    var s1 = instance_create_depth(600, 550, -5, Obj_sign_warning_1);
    if (instance_exists(s1)) {
        s1.lines = ["مرحباً لوميك!", "هذا الممر مظلم.", "إتبع الضوء.", "لا تقترب من الماء!", "الشرارات تستعيد رؤيتك."];
        s1.interact_radius = 60;
    }
}