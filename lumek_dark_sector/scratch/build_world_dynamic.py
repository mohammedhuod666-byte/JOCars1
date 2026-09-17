import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

def create_gm_obj(name, parent='Objects'):
    return '''{
  "$GMObject":"",
  "%Name":"''' + name + '''",
  "eventList":[
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}
  ],
  "managed":true,
  "name":"''' + name + '''",
  "overriddenProperties":[],
  "parent":{ "name":"'''+parent+'''", "path":"folders/'''+parent+'''.yy" },
  "parentObjectId":null,
  "persistent":false,
  "physicsAngularDamping":0.1,
  "physicsDensity":0.5,
  "physicsFriction":0.2,
  "physicsGroup":1,
  "physicsKinematic":false,
  "physicsLinearDamping":0.1,
  "physicsObject":false,
  "physicsRestitution":0.1,
  "physicsSensor":false,
  "physicsShape":1,
  "physicsShapePoints":[],
  "physicsStartAwake":true,
  "properties":[],
  "resourceType":"GMObject",
  "resourceVersion":"2.0",
  "solid":false,
  "spriteId":null,
  "spriteMaskId":null,
  "visible":true,
}'''

os.makedirs('objects/obj_world_builder', exist_ok=True)
write_file('objects/obj_world_builder/obj_world_builder.yy', create_gm_obj('obj_world_builder'))

builder_code = '''
// Ensure this only runs once
if (global.world_built) exit;
global.world_built = true;

var rname = room_get_name(room);

if (rname == "rm_level_GGG") {
    // 1. Build massive floor
    var floor_inst = instance_create_layer(0, 1500, "Instances", Obj_wall);
    floor_inst.image_xscale = 500; // Stretch to 32000 pixels
    floor_inst.image_yscale = 5;

    // 2. Build platforms, enemies, and lore signs
    for (var i = 1; i < 20; i++) {
        var px = i * 800;
        var py = 1500 - (200 + (i % 4) * 150);
        
        // Create Platform
        var plat = instance_create_layer(px, py, "Instances", Obj_wall);
        plat.image_xscale = 5;
        plat.image_yscale = 0.5;
        
        // Spawn Enemy
        if (i % 3 == 0) {
            instance_create_layer(px + 100, py - 50, "Instances", obj_enemy3);
        } else if (i % 2 == 0) {
            instance_create_layer(px + 100, py - 50, "Instances", obj_enemy2);
        } else {
            instance_create_layer(px + 100, py - 50, "Instances", Obj_enemy1);
        }
        
        // Spawn Lore Sign
        if (i % 4 == 0) {
            var sign_inst = instance_create_layer(px + 50, py - 30, "Instances", obj_neon_sign);
            if (i == 4) sign_inst.text = "هنا بدأ الانهيار العظيم...";
            if (i == 8) sign_inst.text = "السجان القرمزي يراقب تحركاتك.";
            if (i == 12) sign_inst.text = "الأبواب النيون هي الملاذ الوحيد.";
            if (i == 16) sign_inst.text = "طاقة القطاع المنسي بدأت تنفد!";
        }
    }

    // 3. Spawn Building Entrance (Door)
    instance_create_layer(1200, 1500, "Instances", obj_building_door);
}
'''
write_file('objects/obj_world_builder/Create_0.gml', builder_code)

# Add to project
with open('Deadly jumping game_1_12.yyp', 'r', encoding='utf-8') as f:
    proj = f.read()

if '"obj_world_builder"' not in proj:
    insert_str = '    {"id":{"name":"obj_world_builder","path":"objects/obj_world_builder/obj_world_builder.yy",},},\n'
    proj = proj.replace('    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n', 
                        '    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n' + insert_str)
    with open('Deadly jumping game_1_12.yyp', 'w', encoding='utf-8') as f:
        f.write(proj)

print('World builder created.')
