// obj_parallax_city — Step
x -= parallax_speed;
if (x < -sprite_width) {
    x = room_width + sprite_width;
}
