import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

yy_content = """{
  "$GMObject":"",
  "%Name":"obj_lighting",
  "eventList":[
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}
  ],
  "managed":true,
  "name":"obj_lighting",
  "overriddenProperties":[],
  "parent":{
    "name":"Objects",
    "path":"folders/Objects.yy",
  },
  "parentObjectId":null,
  "persistent":true,
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
}"""

create_code = """
surf = -1;
"""

draw_code = """
// Only draw in specific rooms
var rname = room_get_name(room);
if (rname == "rm_level_1" or rname == "rm_level_2") {

    // Make sure surface exists
    if (!surface_exists(surf)) {
        surf = surface_create(room_width, room_height);
    }
    
    // Draw onto the surface
    surface_set_target(surf);
    
    // Fill with dark color (Cinematic dark blue/black)
    draw_clear_alpha(make_color_rgb(5, 5, 20), 0.85);
    
    // Set subtract blend mode to punch holes in the darkness
    gpu_set_blendmode(bm_subtract);
    
    // Draw player light
    if (instance_exists(Obj_player)) {
        var px = Obj_player.x;
        var py = Obj_player.y - 10;
        
        // Flicker effect
        var rad = 150 + sin(current_time / 50) * 5;
        
        draw_set_color(c_white);
        draw_set_alpha(1.0);
        draw_circle(px, py, rad * 0.4, false); // intense center
        
        draw_set_alpha(0.5);
        draw_circle(px, py, rad * 0.7, false);
        
        draw_set_alpha(0.2);
        draw_circle(px, py, rad, false);
    }
    
    // Draw Enemy3 (red glow)
    if (instance_exists(obj_enemy3)) {
        with (obj_enemy3) {
            var rad = 100 + sin(current_time / 30) * 10;
            draw_set_alpha(0.6);
            draw_set_color(c_white); // Subtracting, so color doesn't matter, just alpha, but wait!
            // Actually, in bm_subtract, drawing white removes all color.
            // If we want colored light, we need a different blend mode or just draw white circles to reveal the background.
            draw_circle(x, y - 10, rad * 0.5, false);
            draw_set_alpha(0.2);
            draw_circle(x, y - 10, rad, false);
        }
    }

    // Draw Enemy1 (yellow glow)
    if (instance_exists(Obj_enemy1)) {
        with (Obj_enemy1) {
            draw_set_alpha(0.4);
            draw_circle(x, y, 60, false);
        }
    }
    
    // Reset blend mode
    gpu_set_blendmode(bm_normal);
    draw_set_alpha(1.0);
    surface_reset_target();
    
    // Draw surface to screen
    draw_surface(surf, 0, 0);
    
    // Now draw colored light overlay (bm_add) for atmosphere!
    gpu_set_blendmode(bm_add);
    if (instance_exists(Obj_player)) {
        draw_set_color(make_color_rgb(0, 100, 255)); // Blue player light
        draw_set_alpha(0.3);
        draw_circle(Obj_player.x, Obj_player.y - 10, 150 + sin(current_time / 50) * 5, false);
    }
    if (instance_exists(obj_enemy3)) {
        draw_set_color(c_red); // Red enemy light
        draw_set_alpha(0.4);
        draw_circle(obj_enemy3.x, obj_enemy3.y - 10, 120, false);
    }
    if (instance_exists(Obj_enemy1)) {
        draw_set_color(c_orange);
        draw_set_alpha(0.3);
        draw_circle(Obj_enemy1.x, Obj_enemy1.y, 70, false);
    }
    gpu_set_blendmode(bm_normal);
    draw_set_alpha(1.0);
}
"""

os.makedirs('objects/obj_lighting', exist_ok=True)
write_file('objects/obj_lighting/obj_lighting.yy', yy_content)
write_file('objects/obj_lighting/Create_0.gml', create_code)
write_file('objects/obj_lighting/Draw_0.gml', draw_code)

# Add obj_lighting to the project
with open('Deadly jumping game_1_12.yyp', 'r', encoding='utf-8') as f:
    proj = f.read()
    
if '"name":"obj_lighting"' not in proj:
    insert_str = '    {"id":{"name":"obj_lighting","path":"objects/obj_lighting/obj_lighting.yy",},},\n'
    proj = proj.replace('    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n', 
                        '    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n' + insert_str)
    write_file('Deadly jumping game_1_12.yyp', proj)

print("Lighting system built.")
