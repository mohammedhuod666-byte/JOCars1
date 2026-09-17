xs = random(room_width)
ys = random(room_height)
dist = point_distance(xs,ys,Obj_player.x,Obj_player.y);
instance_create_layer(xs,ys,layer,obj_enemy2)
while (dist<150)
{
	xs = random(room_width)
	ys = random(room_height)
	dist = point_distance(xs,ys,Obj_player.x,Obj_player.y);	
}
alarm[0] = 120;