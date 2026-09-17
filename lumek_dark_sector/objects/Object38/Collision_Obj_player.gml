// Object38 — Collision with player
var t = text;
if (Obj_player.action && !sign_active) {
    with (instance_create_layer(0, 0, layer, obj_text_box)) {
        text = t;
    }
    sign_active = true;
}
