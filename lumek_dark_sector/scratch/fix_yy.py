import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

def fix_gm_obj(name, parent='Objects'):
    return '''{
  "$GMObject":"",
  "%Name":"''' + name + '''",
  "eventList":[
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":3,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}
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

write_file('objects/obj_companion/obj_companion.yy', fix_gm_obj('obj_companion'))
write_file('objects/obj_neon_sign/obj_neon_sign.yy', fix_gm_obj('obj_neon_sign'))
write_file('objects/obj_parallax_city/obj_parallax_city.yy', fix_gm_obj('obj_parallax_city'))

print('Fixed .yy files missing properties!')
