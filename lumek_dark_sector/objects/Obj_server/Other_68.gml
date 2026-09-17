network_event = async_load [? "type"];
if(network_event == network_type_connect)
{
	room_goto(rm_level_1)
}
else if(network_event == network_type_disconnect)
{
	
}
else if (network_event == network_type_data)
{
	
}