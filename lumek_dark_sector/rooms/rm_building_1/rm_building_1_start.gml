// rm_building_1_start
global.level1 = true;
if (!instance_exists(obj_lighting)) instance_create_depth(0, 0, -9999, obj_lighting);
if (!instance_exists(Obj_player)) {
    instance_create_depth(300, 400, 0, Obj_player);
} else {
    with (Obj_player) { x = 300; y = 400; hp = max_hp; light_radius = light_max; air = max_air; }
}
if (instance_number(Obj_wall) == 0) {
    for (var i = 1; i <= 10; i++) {
        var px = i * 200; var py = 800 - i * 50;
        var p = instance_create_depth(px, py, 0, Obj_wall);
        if (instance_exists(p)) { p.image_xscale = 3; p.image_yscale = 0.4; }
    }
}
if (instance_number(Obj_item) == 0) {
    instance_create_depth(300, 750, -5, Obj_item);
    instance_create_depth(500, 650, -5, Obj_item);
    instance_create_depth(700, 550, -5, Obj_item);
    instance_create_depth(900, 450, -5, Obj_item);
}
if (instance_number(Obj_gate) == 0) instance_create_depth(1100, 400, -5, Obj_gate);
if (instance_number(Obj_sign_warning_2) == 0) {
    var s = instance_create_depth(600, 550, -5, Obj_sign_warning_2);
    if (instance_exists(s)) {
        s.lines = ["المبنى القديم يذكرنا بالماضي.", "النور النقي曾在 هنا.", "الآن الظلام فقط يبقى.", "احرص على 빛ك."];
        s.interact_radius = 60;
    }
}