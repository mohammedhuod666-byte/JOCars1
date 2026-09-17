// rm_level_3_start
global.level3 = true; global.level2 = false;
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_companion)) instance_create_depth(370, 430, -100, obj_companion);
if (!instance_exists(Obj_player)) {
    instance_create_depth(400, 500, 0, Obj_player);
} else {
    with (Obj_player) {
        if (global.player_checkpoint) { x = global.cp_x; y = global.cp_y; }
        else { x = 400; y = 500; }
        hp = max_hp; light_radius = light_max; air = max_air;
        jumps = jumps_max; can_dash = true; in_dash = false;
    }
    global.respawn_x = x; global.respawn_y = y;
}
if (instance_number(obj_enemy2) == 0) instance_create_depth(600, 550, -10, obj_enemy2);
if (instance_number(obj_enemy3) == 0) instance_create_depth(800, 500, -10, obj_enemy3);
if (instance_number(Obj_item) == 0) {
    instance_create_depth(500, 450, -5, Obj_item);
    instance_create_depth(700, 350, -5, Obj_item);
    instance_create_depth(900, 400, -5, Obj_item);
    instance_create_depth(1100, 450, -5, Obj_item);
}
if (instance_number(Obj_gate) == 0) instance_create_depth(1300, 500, -5, Obj_gate);
if (instance_number(Obj_water) == 0) {
    var w = instance_create_depth(100, 950, -5, Obj_water);
    if (instance_exists(w)) { w.sprite_index = Spr_water; w.image_xscale = 8; w.image_yscale = 2; }
}
if (instance_number(Obj_sign_warning_2) == 0) {
    var s2 = instance_create_depth(700, 400, -5, Obj_sign_warning_2);
    if (instance_exists(s2)) {
        s2.lines = ["الظلام هنا аппарат.", "استخدم نور العجلة الشوكية.", "لكشف المنصات المخفية!", "الأعداء يضيئون الطريق أحيانًا."];
        s2.interact_radius = 60;
    }
}