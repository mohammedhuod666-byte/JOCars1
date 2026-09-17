// rm_se_a_c_f_start — Escape arena
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(obj_dark)) {
    instance_create_depth(0, 0, -9998, obj_dark);
    obj_dark.duration = 60 * 120;
}
if (!instance_exists(Obj_player)) {
    instance_create_depth(400, 800, 0, Obj_player);
} else {
    with (Obj_player) { x = 400; y = 800; hp = max_hp; light_radius = light_max; air = max_air; }
}
global.respawn_x = x; global.respawn_y = y;
if (instance_number(Obj_water) == 0) {
    var w = instance_create_depth(0, 1000, -5, Obj_water);
    if (instance_exists(w)) { w.sprite_index = Spr_water; w.image_xscale = 20; w.image_yscale = 4; }
}
if (instance_number(obj_enemy3) == 0) {
    instance_create_depth(600, 750, -10, obj_enemy3);
    instance_create_depth(800, 650, -10, obj_enemy3);
}
if (instance_number(Obj_item) == 0) {
    instance_create_depth(300, 900, -5, Obj_item);
    instance_create_depth(500, 800, -5, Obj_item);
    instance_create_depth(700, 700, -5, Obj_item);
    instance_create_depth(900, 600, -5, Obj_item);
    instance_create_depth(1100, 500, -5, Obj_item);
}
if (instance_number(Obj_gate) == 0) instance_create_depth(1300, 400, -5, Obj_gate);
if (instance_number(Obj_sign_warning_1) == 0) {
    var s = instance_create_depth(400, 750, -5, Obj_sign_warning_1);
    if (instance_exists(s)) {
        s.lines = ["هناك ممر هرب!", "الخطو السريع ولاتوقف.", "السّجّان يطاردك — الركض هو الفرصة الوحيدة.", "الشرارة الأخيرة معك — لا تستسلم."];
        s.interact_radius = 60;
    }
}