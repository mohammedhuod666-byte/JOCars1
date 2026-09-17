// ============================================================
//  obj_world_builder — Create
//  Builds the open world layout for rm_level_GGG.
//  Also re-initializes globals when entering the hub / main level.
// ============================================================
var rname = room_get_name(room);
if (rname != "rm_level_GGG") exit;

// 0. Clear duplicated rm_level_1 content if present
with (Obj_wall)          instance_destroy();
with (Obj_enemy1)        instance_destroy();
with (obj_enemy2)        instance_destroy();
with (obj_enemy3)        instance_destroy();
with (obj_gui)           instance_destroy();
with (obj_text_box)      instance_destroy();
with (obj_neon_sign)     instance_destroy();
with (obj_building_door) instance_destroy();
with (obj_lighting)      instance_destroy();
with (obj_companion)     instance_destroy();
with (obj_world_builder) instance_destroy();
with (Obj_player) {
    // reposition player for open world start
    x = 200;
    y = 1200;
    my_speed_x = 0;
    my_speed_y = 0;
    hp = max_hp;
    light_radius = light_max;
    air = max_air;
    jumps = jumps_max;
    can_dash = true;
    in_dash = false;
    global.player_checkpoint = false;
}

// 1. Massive floor
var floor_inst = instance_create_depth(0, 1500, 0, Obj_wall);
if (instance_exists(floor_inst)) {
    floor_inst.image_xscale = 500;   // stretch to ~32000 px wide
    floor_inst.image_yscale = 5;
}

// 2. Platforms, enemies, lore signs
for (var i = 1; i < 20; i++) {
    var px = i * 800;
    var py = 1500 - (200 + ((i mod 4) * 150));

    // platform
    var plat = instance_create_depth(px, py, 0, Obj_wall);
    if (instance_exists(plat)) {
        plat.image_xscale = 5;
        plat.image_yscale = 0.5;
    }

    // enemy variety
    var ex = px + 120;
    var ey = 1500 - 60;
    if (i mod 3 == 0) {
        var e3 = instance_create_depth(ex, ey, -10, obj_enemy3);
    } else if (i mod 2 == 0) {
        var e2 = instance_create_depth(ex, ey, -10, obj_enemy2);
    } else {
        var e1 = instance_create_depth(ex, ey, -10, Obj_enemy1);
    }

    // lore sign every 4th platform
    if (i mod 4 == 0) {
        var sign_inst = instance_create_depth(px + 50, py - 30, -5, obj_neon_sign);
        if (instance_exists(sign_inst)) {
            if      (i == 4)  sign_inst.text = "...المدينة المنسية تغرق في الظلام";
            else if (i == 8)  sign_inst.text = ".قوة النور النقي قد انتهت";
            else if (i == 12) sign_inst.text = ".الشرارة الأخيرة هي كل ما تبقى";
            else if (i == 16) sign_inst.text = "!اطرد السّجّان واغرد إلى السطح";
        }
    }
}

// 3. Building entrance door (hub return point)
var door = instance_create_depth(500, 1500, -5, obj_building_door);
if (instance_exists(door)) {
    door.open = false;
}

// 4. Re-create ambient systems for the new room
if (!instance_exists(obj_lighting)) {
    instance_create_depth(0, 0, -9999, obj_lighting);
}
if (!instance_exists(obj_companion)) {
    instance_create_depth(x - 30, y - 70, -100, obj_companion);
}
