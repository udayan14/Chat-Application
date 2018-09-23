function changeWindow(){
    require('electron').remote.getGlobal('sharedObject').username = document.getElementById('usernameField').value
    require('electron').remote.getGlobal('sharedObject').password = document.getElementById('passwordField').value
}
var x = require('electron').remote.getGlobal('sharedObject').valid

window.onload = function(){
	if(x=='False')
	document.getElementById('error_message').innerHTML = "Wrong Username/Password"
console.log(x)}