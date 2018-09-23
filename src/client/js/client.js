var net = require('net');
var user = require('electron').remote.getGlobal('sharedObject').username;
var password = require('electron').remote.getGlobal('sharedObject').password;
var active_clients=[];
var all_messages = {};
var HOST = 'Akshats-MacBook-Pro.local';
var PORT = 8001;
var client = new net.Socket();
var unread_handle = {}
var gname_members = {}
var in_process_files = {}
var prefix=""
var last_seen = {} //user -> time(string)
console.log('client.js')
client.connect(PORT, HOST, function() {
    console.log('connected')
});

window.onbeforeunload=function()
{
    send_message(make_message("ClientStatus","Exit",0))
    console.log("here")
    client.destroy()
}
client.on('data', function(data) {
    // console.log('Received: ' + String(data));
    resolve_messages(String(data))
    
// Close the client socket completely
    // client.destroy();

});

function resolve_messages(data)
{

    var temp = prefix+data
    prefix=""
    splitted = temp.split('{')
    if((splitted[0].length)==0)
        splitted =  splitted.slice(1)
    for(var j=0;j<splitted.length;j++)
    {
        candidate=splitted[j]
        if(candidate.length!=0){
            if(candidate[candidate.length-1]=='}'){
                process_message(JSON.parse('{'+String(candidate)))
                console.log(JSON.parse('{'+String(candidate)))
            }
                
            else
            {
                prefix = candidate
                break;
            }
        }

    }


    // for(var i=0; i<=fields.length-2; i++){
    //     console.log(JSON.parse(fields[i]+"}"))
    //     process_message(JSON.parse(fields[i]+"}"))
    // }
}

function make_message(essence,info,info_extra){
    var message={}
    message["Type"]=essence
    if(essence=="Auth"){
        message["Username"] = info
        message["Password"] = info_extra
    }
    else if(essence=="ClientStatus")
    {
        message["Spec"] = "Exit"
        message["From"] = user
    }
    else if(essence=="Receipts")
    {
        message["Spec"] = "Read"
        message["Id"] = info["Id"]
        message["From"] = info["From"]
        message["To"] = info["To"]
    }
    else if(essence=="Forward")
    {
        message["To"] = info
        message["Content"] = info_extra //message
        message["From"] = user
        if (message["To"] in track_id)
        {
            track_id[message["To"]] = track_id[message["To"]]+1
        }
        else
        {
            track_id[message["To"]]=1
        }
        message["Id"]= track_id[message["To"]]
    }
    else if(essence=="Group"){
        message["Spec"]=info //Form or Multicast
        if(info == "Form"){
            message["To"] = gname_members[info_extra]
            message["From"] = user
            message["Groupid"] = info_extra
        }
        else{
            message["To"] = gname_members[currentUser] // 
            message["Groupid"] = currentUser
            message["Content"] =  info_extra
            message["From"] = user
        }

    }
    else if(essence=="User_Query"){
        message["Spec"] = 0 // 0-> I dont know his existence, 1->Said user exists
        message["Content"] = info
        message["From"] = user
    }

    return message;

}

function send_message(message)
{
    console.log(JSON.stringify(message))
    client.write(JSON.stringify(message))
    if(message["Type"]=="Forward"){
        if(message["To"] in all_messages){
            all_messages[message["To"]].push(message)
        }
        else{
            all_messages[message["To"]] = []
            all_messages[message["To"]].push(message)
        }
    }
    else if(message["Type"]=="Group" && message["Spec"]=="Multicast"){
        if(message["Groupid"] in all_messages){
            all_messages[message["Groupid"]].push(message)
        }
        else{
            all_messages[message["Groupid"]] = []
            all_messages[message["Groupid"]].push(message)
        }
    }
   
}

function process_message(message){
    if(message["Type"] == "Auth"){
        if(message["Spec"] == "Syn"){
            console.log("Got Syn!")

            send_message(make_message("Auth",user,password))
        }
        else if (message["Spec"] == "Ack"){
            require('electron').remote.getGlobal('sharedObject').valid   = 'True'
            console.log("Got Ack!")
        }
        else{
                require('electron').remote.getGlobal('sharedObject').valid   = 'False'
                window.location.replace('index.html')
        }
    }
    else if(message["Type"]=='User_Query'){
        if(message["Spec"]==0){
            //User Doesn't exist
            alert("Specified User Doesn't Exist")
        }
        else if(message["Spec"]==1){
            //User Exists
            addUser(message["Content"])
            updateUserList(findUserId(message["Content"]))
            myFun(message["Content"])
        }
    }
    else if(message["Type"]=="ClientStatus"){
        if(message["Spec"]=="List"){
            console.log("Got List!")
            active_clients = message["Content"]
            for (var i = 0; i < active_clients.length; i++) { 
                console.log(typeof(active_clients[i]))
                console.log('ieeeeeee')
               addUser(active_clients[i], 1)
               setUserActive(active_clients[i])
                last_seen[active_clients[i]]="Active Now";
            }
        }
        else if(message["Spec"]=="Join")
        {
            var jar = findUserId(message["Content"])
            if(jar==0)
            {   
                addUser(message["Content"], 1)

            }
            
            setUserActive(message["Content"])
            active_clients.push(message["Content"])
            last_seen[message["Content"]]="Active Now";
        }
        else if(message["Spec"]=="Exit")
        {
            setUserInactive(message["Content"])
            delete_from_array(active_clients,message["Content"])
            var y = new Date();
            var aa = y.getMinutes()

            if(y.getMinutes()<10)
                aa = "0"+ y.getMinutes()
            var z = y.getHours() + ":" +aa //z==Current Time
            last_seen[message["Content"]]=z;
        }

    }
    else if(message["Type"]=="Forward"){
        handle_new_messages(message)
        updateUserList(findUserId(message["From"]))
        
        // if (message["From"] in all_messages)
        // {
        //         all_messages[message["From"]].push(message)
        // }
        // else
        // {
        //     all_messages[message["From"]] = []
        //     all_messages[message["From"]].push(message)
        // }
        // if(message["From"] == currentUser){

        //     appendmessage('other', message)
        //     send_message(make_message("Receipts",message,0))

        // }
        // else
        // {
        //     var jar = findUserId(message["From"])
        //     if(jar==0)
        //     {   
        //         addUser(message["From"], 1)

        //     }

        //     if(message["From"] in unread_handle)
        //     {
        //         unread_handle[message["From"]]=unread_handle[message["From"]]+1
    
        //     }
        //     else
        //     {
        //         unread_handle[message["From"]]=1

        //     }
        //     show_unread_count(message["From"],unread_handle[message["From"]])


        }
        
    
    else if(message["Type"]=="Receipts"){
        var z  = all_messages[message["To"]]

        if(message["To"] == currentUser){

            changeStatus(message)

        }
        
            for(var i=0;i<z.length;i++)
            {
                if(z[i]["Id"]==message["Id"])
                    z[i]["Status"] = message["Spec"]
            }

    }
    else if(message["Type"]=="Group"){
        if(message["Spec"]=="Form"){
            addUser(message["Groupid"], 1);
            var members = message["To"]
            var mindex = members.indexOf(user)
            if(mindex>-1){
                members.splice(mindex, 1);
            }
            members.push(message["From"])
            gname_members[message["Groupid"]]=members
            updateUserList(findUserId(message["Groupid"]))
            //New group formation
        }
        else{
            updateUserList(findUserId(message["Groupid"]))
           
           handle_new_messages(message)
        }
    }
    else if(message["Type"]=="File_Transfer")
    {
        var array_of_chunks=[];
        if(message["File_Name"] in in_process_files)
        {
            array_of_chunks = in_process_files[message["File_Name"]]
        }
        else{
            in_process_files[message["File_Name"]] = []
            array_of_chunks = []
        }
        array_of_chunks[message["Curr"]] = message["Content"]
        var count=0;
        array_of_chunks.forEach(_ => count++)
        if(count == parseInt(message["Spec"]))
        {
            delete in_process_files[message["File_Name"]]
            console.log("message_prepared")
            message["Content"] = message["File_Name"]
            message["file_url"] = array_of_chunks.join('')
            console.log(message["file_url"])
            handle_new_messages(message)

        }
        else
        {
            in_process_files[message["File_Name"]]= array_of_chunks 
        }
        console.log(count)
        console.log("un_prep")

    }

}

function delete_from_array(given_array,value){
    for(var i=given_array.length-1;i>=0;i--)
    {
        if(given_array[i]==value)
        {
            given_array.splice(i,1);
        }
    }
}
function handle_new_messages(message)
{
    var sender;
    if(message["Type"]=="Group")
        sender = message["Groupid"]
    else
        sender = message["From"] 
    if (sender in all_messages)
    {
            all_messages[sender].push(message)
    }
    else
    {
        all_messages[sender] = []
        all_messages[sender].push(message)
    }
    if(sender == currentUser)
    {
        console.log(message["Type"])
        appendmessage('other', message)

        if(message["Type"]=="Forward")
                send_message(make_message("Receipts",message,0))

    }
    else
    {
        var path = require('path')  //For Notifications
        var temp_dict={'title':sender, 'body':message['Content']}
        new Notification(sender, temp_dict)
        var jar = findUserId(sender)
        if(jar==0)
            addUser(sender, 1)
            if(sender in unread_handle)
            {
                unread_handle[sender]=unread_handle[sender]+1
    
            }
            else
            {
                unread_handle[sender]=1

            }

        show_unread_count(sender,unread_handle[sender])


    }


}










