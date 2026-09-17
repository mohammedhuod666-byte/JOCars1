// Obj_door — Step (sync visual with switch state)
if (instance_exists(Obj_switch) and Obj_switch.open == true) {
    open = true;
    image_index = 1;
} else {
    open = false;
    image_index = 0;
}
