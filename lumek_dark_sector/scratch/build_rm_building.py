import json
import uuid
import re
import os

def load_gm_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*\]', ']', text)
    return json.loads(text)

r = load_gm_json('rooms/rm_level_1/rm_level_1.yy')
r['%Name'] = "rm_building_1"
r['name'] = "rm_building_1"
r['roomSettings']['Width'] = 1200
r['roomSettings']['Height'] = 800

inst_layer = None
for l in r['layers']:
    if l['resourceType'] == 'GMRInstanceLayer':
        inst_layer = l
        break

r['layers'] = [l for l in r['layers'] if l['resourceType'] in ['GMRInstanceLayer', 'GMRBackgroundLayer']]
if inst_layer: inst_layer['instances'] = []

def create_inst(obj, x, y, sx=1.0, sy=1.0):
    i_id = "inst_" + str(uuid.uuid4()).replace('-','')[:8].upper()
    return {
      "$GMRInstance": "v4", "%Name": i_id, "colour": 4294967295, "frozen": False,
      "hasCreationCode": False, "ignore": False, "imageIndex": 0, "imageSpeed": 1.0,
      "inheritCode": False, "inheritedItemId": None, "inheritItemSettings": False,
      "isDnd": False, "name": i_id, "objectId": {"name": obj, "path": f"objects/{obj}/{obj}.yy"},
      "properties": [], "resourceType": "GMRInstance", "resourceVersion": "2.0",
      "rotation": 0.0, "scaleX": sx, "scaleY": sy, "x": x, "y": y
    }

instances = [
    create_inst("Obj_player", 150, 600),
    create_inst("Obj_camera", 150, 600),
    create_inst("obj_companion", 100, 500),
    create_inst("obj_building_door", 100, 600), # Exit door
    create_inst("obj_npc_scientist", 600, 600),
    create_inst("Obj_wall", 0, 700, 100.0, 2.0), # Floor
    create_inst("Obj_wall", 0, 0, 2.0, 50.0), # Left wall
    create_inst("Obj_wall", 1150, 0, 2.0, 50.0) # Right wall
]

inst_layer['instances'] = instances
os.makedirs('rooms/rm_building_1', exist_ok=True)
with open('rooms/rm_building_1/rm_building_1.yy', 'w', encoding='utf-8') as f:
    json.dump(r, f, indent=2)

with open('Deadly jumping game_1_12.yyp', 'r', encoding='utf-8') as f:
    proj = f.read()

if '"rm_building_1"' not in proj:
    res = '    {"id":{"name":"rm_building_1","path":"rooms/rm_building_1/rm_building_1.yy",},},\n'
    proj = proj.replace('    {"id":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n', 
                        '    {"id":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n' + res)
    rm = '    {"roomId":{"name":"rm_building_1","path":"rooms/rm_building_1/rm_building_1.yy",},},\n'
    proj = proj.replace('    {"roomId":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n', 
                        '    {"roomId":{"name":"rm_level_1","path":"rooms/rm_level_1/rm_level_1.yy",},},\n' + rm)
    with open('Deadly jumping game_1_12.yyp', 'w', encoding='utf-8') as f: f.write(proj)
