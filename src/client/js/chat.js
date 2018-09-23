var currentUser=""; //name of other user in current convo
var track_id={}
console.log('chat.js')
function render_list(){
    var ulist = document.getElementById('users')
    var list = document.getElementById('chat_items')
    
    
    if(list.children.length<=0){
        for(var i=1; i<ulist.children.length; i++){
            if(ulist.children[i].children[0].innerText in gname_members){

            }            
            else{
                var li = document.createElement('li')
                li.innerText = ulist.children[i].children[0].innerText
                var inp = document.createElement('input')
                inp.type = 'checkbox'
                li.appendChild(inp)
                list.appendChild(li)
            }
        }
        var button = document.getElementById("make_group")
        button.innerText="Cancel"
        var dive = document.getElementById("innerDiv");
        var buttonOk = document.createElement('button');
        var group_name_input = document.createElement('input');
        group_name_input.type='text'
        group_name_input.id='group_name_input'
        group_name_input.placeholder='Write Group Name'
        buttonOk.id = "group_ok"
        buttonOk.innerHTML = "Ok"
        buttonOk.onkeydown =function(){
            if (event.keyCode == 13)
                makeGroup(group_name_input.value)
        }
        buttonOk.onclick=function(){
            makeGroup(group_name_input.value)
        }
        dive.appendChild(buttonOk)
        dive.appendChild(group_name_input)
    }
    else{var x_len= list.children.length

        for(var i=0; i<x_len; i++){
            list.removeChild(list.lastChild)
        }
        var dive = document.getElementById("innerDiv");
        dive.removeChild(dive.lastChild)
        dive.removeChild(dive.lastChild)
        var button = document.getElementById("make_group")
        button.innerText="Form Group"
    }
    
}

function send_file(target_file,file_name){
    var chunklength= 500
    var reciever = currentUser
    num_chunk = parseInt(target_file.length/chunklength)+1
    var message = {}
    message["Type"] = "File_Transfer"
    message.From = user
    message.To = reciever
    if (message["To"] in track_id)
        {
            track_id[message["To"]] = track_id[message["To"]]+1
        }
    else
        {
            track_id[message["To"]]=1
        }
    message["Id"]= track_id[message["To"]]
    message.Spec = num_chunk
    message.Content = file_name
    message.file_url = target_file
    appendmessage('self', message)
    if(message["To"] in all_messages){
            all_messages[message["To"]].push(message)
        }
        else{
            all_messages[message["To"]] = []
            all_messages[message["To"]].push(message)
        }
    track_id[message["To"]] = track_id[message["To"]]+1

    message={}
    message.File_Name = file_name
    message.Type="File_Transfer"
    message.From = user
    message.To = reciever
    message.Spec = num_chunk
    // if (message["To"] in track_id)
    //     {
    //         track_id[message["To"]] = track_id[message["To"]]+1
    //     }
    // else
    //     {
    //         track_id[message["To"]]=1
    //     }
        
    // message["Id"]= track_id[message["To"]]
    // track_id[message["To"]] = track_id[message["To"]]+1
    var i=0
    for(i=0;i<num_chunk-1;i++)
    {
        message.Curr = i
        message.Content = target_file.slice(0,chunklength)
        target_file=target_file.slice(chunklength)
        send_message(message)
    }
    message.Curr = i
    message.Content = target_file
    send_message(message)

}





function File_Selector(evt)
{
       var files = evt.target.files;
       for (var i=0;i<files.length;i++)
       {
            f= files[i]
            var reader = new FileReader();
            console.log("in for")
            reader.onload = (function(my_file){
                console.log("in onload")
                return function(e)
                {
                    console.log("in e")
                    if(f.type.match('image.*'))
                    {
                    var span = document.createElement('span');
          span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(my_file.name), '"/>'].join('');
          document.getElementById('list').insertBefore(span, null);}
                    
                    send_file(e.target.result,my_file.name)


                }
            })(f)
                  reader.readAsDataURL(f);

       }
}

function makeGroup(name){
    var list = document.getElementById('chat_items')
    console.log(name)
    var members = []   
    for(var i=0; i<list.children.length; i++){
        if(list.children[i].children[0].checked){
            members.push(list.children[i].innerText)
        }
    }
    if(members.length <= 1){
        // Add atleast 2 members
        alert("Please Select atleast 2 users")
    }
    else{
        if(name.length == 0){
            alert("Please Enter the Group Name")
        }
        else{
            gname_members[name]=members;
            addUser(name, 1)
            send_message(make_message("Group", "Form",name))

            updateUserList(findUserId(name))
            myFun(name)
            send_message(make_message("Group", "Multicast","I created this group :"+name))
        }
        

        //addUser
        
    }

}

window.onload=function(){
    // document.getElementById("send").style.display="none"
    document.getElementById("inputMessage").placeholder="Add a new User or Go to an existing one"
    document.getElementById("file-div").style.display="none"
    var dive = document.getElementById("innerDiv");
    var button = document.createElement('button')
    button.id = "make_group"
    button.innerHTML = "Form Group"
    button.onclick=function(){
        render_list()
    }
    dive.appendChild(button)
    addUser('Home', 0)
    var list = document.getElementById('home')
    list.children[0].classList.add('active')
    
}

function sendPressed(){

    var x = document.getElementById('inputMessage').value;
    if(x.length == 0){
        //Do Nothing
    }
    else{
        if(currentUser in gname_members){
            x = make_message("Group", "Multicast", x)
            appendmessage('self',x)
        }
        else{
            if(currentUser==""){
                if(findUserId(x)!=0){
                    updateUserList(findUserId(x))
                    myFun(x)
                    document.getElementById('inputMessage').value = ''
                }
                else{
                    if(x==user){

                    }
                    else{
                        x = make_message("User_Query", x, 0)
                    }
                    

                }
                
            }
            else{
                x = make_message("Forward", currentUser, x)
                appendmessage('self',x)
            }
            
        }
        send_message(x)
        
        
    }    
    
}

function changeStatus(message){
    var list = document.getElementById('chat_items')
    for(var i=0; i<list.children.length; i++){
        var z = document.getElementById(message["Id"])
        z.classList.add(message["Spec"]) //change css

    }
}

function appendmessage(classname,message){

    var list = document.getElementById('chat_items')  
    document.getElementById('inputMessage').value = ''
    var li = document.createElement('li')
    li.className = classname
    if(classname=='self')
        li.id=message["Id"]
    var div = document.createElement('div')
    div.className = 'msg'
    var temp
    if(message["Type"]=="Forward"||message["Type"]=="Group")
        temp = document.createElement('p')
    else{
        temp = document.createElement('a')
        temp.download = message["Content"];
        temp.href  = message["file_url"]
        console.log("here")
    }
        
    temp.innerHTML = message["Content"]
    div.appendChild(temp)
    if(message["Type"]=="Forward")
    {
        var y = new Date();
        var aa = y.getMinutes()

        if(y.getMinutes()<10)
         aa = "0"+ y.getMinutes()
        var z = y.getHours() + ":" +aa
        temp = document.createElement('time')
        temp.innerText = z

    }
    else if(message["Type"]=="Group")
    {
        temp = document.createElement('p')
        if(classname == 'other'){
            temp.innerText = "(From : " + message["From"] + " )"  
        }
        else{

        }
        
    }
    div.appendChild(temp)
    li.appendChild(div)
    list.appendChild(li)
}

function findUserId(name){
    var index=0;
    var list = document.getElementById('users')
    for(var i=1; i<list.children.length; i++){
        if(list.children[i].children[0].innerText == name){
            index = i;
        }
    }
    return index;
}

function setUserActive(name){
    id = findUserId(name);
    var list = document.getElementById('users')
    var s = document.createElement('span')
    s.className = "icon icon-record"
    s.style = "color:#34c84a"
    list.children[id].children[0].appendChild(s)
}

function setUserInactive(name){
    id = findUserId(name);
    var list = document.getElementById('users')
    var Dive = list.children[id].children[0]
    Dive.removeChild(Dive.children[1])
}

function updateUserList(id){
    var list = document.getElementById('users')
    var elements = []
    for(var i = 0; i < list.children.length; i++){
        elements.push(list.children[i])
    }

    list.appendChild(elements[0]) //header
    list.appendChild(elements[id]); //firstNew

    for (var i = 0; i < list.children.length-1; i++) {
        if(i+1 == id){

        }
        else{
            list.appendChild(elements[i+1]);
        }
    }
}

function addUser(name, pos){
    if(pos==0){
        var list = document.getElementById('home')
    }
    else{
        var list = document.getElementById('users')
    }
    console.log('adding')
    console.log(name)
    var li = document.createElement('li')
    li.className = "list-group-item"
    li.onclick = function () { 
            myFun(name);
        };
    var div = document.createElement('div')
    div.className = "media-body"
    var temp = document.createElement('strong')
    temp.innerHTML = name
    div.appendChild(temp)
    li.appendChild(div)
    list.appendChild(li)
}

function show_unread_count(name,count){
     var list = document.getElementById('users')

    var id = findUserId(name)
        var user_li  = list.children[id]
    if(count!=1)
    {
        if(count==0)
             user_li.removeChild(user_li.children[1]);
        else{
            var span  = user_li.children[1]
            span.innerText = count
        }

    }
    else
    {
          var span = document.createElement('span')
        span.className = 'badge badge-default badge-pill'
         span.innerText = 1
         user_li.appendChild(span)
    }

}
function myFun(name){
    clearChatWindow()
    if(name == 'Home'){
        if(currentUser == ""){

        }
        else{
            // document.getElementById("send").style.display="none"
            document.getElementById("inputMessage").placeholder="Add a new User"
            // document.getElementById("inputMessage").style.display="none"
            document.getElementById("file-div").style.display="none"
            var dive = document.getElementById("innerDiv");
            var button = document.createElement('button')
            button.id = "make_group"
            button.innerHTML = "Form Group"
            button.onclick=function(){
                render_list()
            }
            dive.appendChild(button)
            currentUser=""
        }
        var list = document.getElementById('users')
        for(var i = 0; i < list.children.length; i++){
            list.children[i].classList.remove('active')
        }
        var list2 = document.getElementById('home')
        list2.children[0].classList.add('active')

        
    }
    else{
   
    // document.getElementById("send").style.display="block"
    // document.getElementById("inputMessage").style.display="block"
    document.getElementById("inputMessage").placeholder=""
    
    var dive = document.getElementById("innerDiv");
    for (var i = 0; i < dive.children.length;) { //Remove things related to Home(Gropu Formation)
        // console.log(dive.children[i])
        if(dive.children[i].id == "make_group" || dive.children[i].id == "group_name_input" || dive.children[i].id =="group_ok"){
            dive.removeChild(dive.children[i]);
        }
        else{
            i++;
        }
    }
    if(name in gname_members){
        document.getElementById("file-div").style.display="none"
    }
    else{
        document.getElementById("file-div").style.display="block"
    }

    console.log(name)
    currentUser = name

    var lastSeenDiv = document.getElementById('last_seen')
    if(name in last_seen){
        lastSeenDiv.innerHTML="Last Seen:" + last_seen[name]
    }
    else{  
        lastSeenDiv.innerHTML="Last Seen: Never"
    }
    if(name in unread_handle)
    {
        show_unread_count(name,0)
        var count_unread = unread_handle[name]
        var z =  all_messages[name]
        var i=z.length-1
        while(count_unread!=0)
        {
            message=z[i]
            if(message["Type"]=="Forward")
                send_message(make_message("Receipts",z[i],0))
            i=i-1
            count_unread=count_unread-1
        }
        delete unread_handle[name]
    }
     
    
    retrieve_messages(name)
    var list = document.getElementById('users')
    var list2 = document.getElementById('home')
    list2.children[0].classList.remove('active')
     for(var i = 0; i < list.children.length; i++){
        if(list.children[i].innerText == name){
            list.children[i].classList.add('active')
        }
        else{
            list.children[i].classList.remove('active')
        }
    }
    }
    
}

function clearChatWindow(){
    var mlist = document.getElementById('chat_items');
    const k = mlist.children.length;
    for(var i = 0; i < k; i++){
        mlist.removeChild(mlist.children[0]);
    }
}

function retrieve_messages(name) {
    messages=[]
    if(name in all_messages)
    {
        messages=all_messages[name]
    }
    for (var i = 0; i < messages.length; i++) {
            if(messages[i]["From"]==user){
                appendmessage('self', messages[i])
            }
            else{
                appendmessage('other', messages[i])
            }
    }
}