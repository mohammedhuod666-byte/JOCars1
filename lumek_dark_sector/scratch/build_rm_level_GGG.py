import re
import json
import uuid
import os

def load_gm_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    # Replace trailing commas
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*\]', ']', text)
    return json.loads(text)

def save_gm_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        # GM expects specific formatting, but standard json works if we're careful.
        # Actually, GM YY files are strict. We will just dump it nicely.
        json.dump(data, f, indent=2)

r = load_gm_json('rooms/rm_level_1/rm_level_1.yy')

# Modify Room Properties
r['%Name'] = "rm_level_GGG"
r['name'] = "rm_level_GGG"
r['roomSettings']['Width'] = 10000
r['roomSettings']['Height'] = 2000

# Keep only one instance layer, one background layer
inst_layer = None
bg_layer = None
for l in r['layers']:
    if l['resourceType'] == 'GMRInstanceLayer' and inst_layer is None:
        inst_layer = l
    elif l['resourceType'] == 'GMRBackgroundLayer' and bg_layer is None:
        bg_layer = l

r['layers'] = []
if bg_layer:
    bg_layer['colour'] = 4278190080 # Black
    r['layers'].append(bg_layer)
if inst_layer:
    inst_layer['instances'] = []
    r['layers'].append(inst_layer)
else:
    # Fallback if no instance layer
    print("No instance layer found!")
    exit(1)

def create_inst(obj_name, x, y, scaleX=1.0, scaleY=1.0):
    inst_id = "inst_" + str(uuid.uuid4()).replace('-', '')[:8].upper()
    return {
      "$GMRInstance": "v4",
      "%Name": inst_id,
      "colour": 4294967295,
      "frozen": False,
      "hasCreationCode": False,
      "ignore": False,
      "imageIndex": 0,
      "imageSpeed": 1.0,
      "inheritCode": False,
      "inheritedItemId": None,
      "inheritItemSettings": False,
      "isDnd": False,
      "name": inst_id,
      "objectId": {
        "name": obj_name,
        "path": f"objects/{obj_name}/{obj_name}.yy"
      },
      "properties": [],
      "resourceType": "GMRInstance",
      "resourceVersion": "2.0",
      "rotation": 0.0,
      "scaleX": scaleX,
      "scaleY": scaleY,
      "x": x,
      "y": y
    }

instances = []

# Core systems
instances.append(create_inst("Obj_player", 200, 1000))
instances.append(create_inst("Obj_camera", 200, 1000))
instances.append(create_inst("obj_companion", 150, 950))
instances.append(create_inst("obj_parallax_city", 0, 0))

# Massive floor (using Obj_wall, assuming it's a solid block. Scale it horizontally)
# Let's stretch it. If the texture looks weird, it's fine for now, it's a neon aesthetic.
instances.append(create_inst("Obj_wall", 0, 1200, scaleX=350.0, scaleY=2.0)) 

# Create platforms and enemies
for i in range(1, 10):
    px = i * 800
    py = 1200 - (150 + (i % 3) * 100)
    # Platform
    instances.append(create_inst("Obj_wall", px, py, scaleX=5.0, scaleY=0.5))
    
    # Enemies
    if i % 3 == 0:
        instances.append(create_inst("obj_enemy3", px + 100, py - 50))
    elif i % 2 == 0:
        instances.append(create_inst("obj_enemy2", px + 100, py - 50))
    else:
        instances.append(create_inst("Obj_enemy1", px + 100, py - 50))
        
    # Lore Signs
    if i % 4 == 0:
        instances.append(create_inst("obj_neon_sign", px + 50, py - 30))

inst_layer['instances'] = instances

# Save Room
os.makedirs('rooms/rm_level_GGG', exist_ok=True)
save_gm_json('rooms/rm_level_GGG/rm_level_GGG.yy', r)

# Update YYP
with open('Deadly jumping game_1_12.yyp', 'r', encoding='utf-8') as f:
    proj = f.read()

if '"rm_level_GGG"' not in proj:
    res_insert = '    {"id":{"name":"rm_level_GGG","path":"rooms/rm_level_GGG/rm_level_GGG.yy",},},\n'
    proj = proj.replace('    {"id":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n', 
                        '    {"id":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n' + res_insert)
                        
    room_insert = '    {"roomId":{"name":"rm_level_GGG","path":"rooms/rm_level_GGG/rm_level_GGG.yy",},},\n'
    proj = proj.replace('    {"roomId":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n', 
                        '    {"roomId":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n' + room_insert)
                        
    with open('Deadly jumping game_1_12.yyp', 'w', encoding='utf-8') as f:
        f.write(proj)

print("rm_level_GGG created with full open-world layout!")
