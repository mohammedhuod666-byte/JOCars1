if (!instance_exists(obj_box_11)) {
    var m = instance_create_layer(0, 0, "Instances", obj_box_11);
    m.text = "لقد اصط.";
    m.portrait = Spr_npc_portrait; // هنا ضع اسم السبرايت الذي تريد
}

// اجعل المربع يختفي بعد التفعيل
instance_destroy();