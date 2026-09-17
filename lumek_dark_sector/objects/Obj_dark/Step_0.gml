// ============================================================
//  obj_dark — Step
//  Counts down; destroys itself when duration runs out.
//  Creates a persistent surface for the overlay on first run.
// ============================================================
duration -= 1;
if (duration <= 0) {
    instance_destroy();
    exit;
}

if (surf_dark == -1) {
    var cam = view_camera[0];
    var cw  = camera_get_view_width(cam);
    var ch  = camera_get_view_height(cam);
    if (cw == 0) { cw = room_width; ch = room_height; }
    if (surface_exists(surf_dark) == false) {
        surf_dark = surface_create(cw, ch);
    }
}

// make sure surface matches current view size (window resize handling)
var cam = view_camera[0];
var cw  = camera_get_view_width(cam);
var ch  = camera_get_view_height(cam);
if (cw == 0) { cw = room_width; ch = room_height; }
if (surface_exists(surf_dark) && (surface_get_width(surf_dark) != cw || surface_get_height(surf_dark) != ch)) {
    surface_free(surf_dark);
    surf_dark = surface_create(cw, ch);
}
