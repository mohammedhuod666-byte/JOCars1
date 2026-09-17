// ============================================================
//  obj_dark — Draw (overlays darkness over the whole view)
//  Works in tandem with obj_lighting: lighting punches holes
//  in the darkness; dark simply dims everything uniformly.
// ============================================================
var rname = room_get_name(room);
if (duration <= 0) exit;

var cam = view_camera[0];
var cx  = camera_get_view_x(cam);
var cy  = camera_get_view_y(cam);
var cw  = camera_get_view_width(cam);
var ch  = camera_get_view_height(cam);

if (cw == 0) {
    cx = 0; cy = 0; cw = room_width; ch = room_height;
}

if (!surface_exists(surf_dark)) {
    surf_dark = surface_create(cw, ch);
}
if (!surface_exists(surf_dark)) exit;

surface_set_target(surf_dark);
draw_clear_alpha(c_black, 0.55);
// subtle vignette
draw_set_alpha(0.15);
draw_set_color(make_color_rgb(0, 0, 10));
draw_rectangle(0, 0, cw, ch, false);
draw_set_alpha(1);
surface_reset_target();

draw_surface(surf_dark, cx, cy);
