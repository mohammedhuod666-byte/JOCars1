// obj_building_door — Step
if (instance_exists(Obj_switch) && Obj_switch.open == true) {
    open = true;
    image_index = 1;
} else {
    open = false;
    image_index = 0;
}
