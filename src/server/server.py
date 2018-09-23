import socket
import datetime
from threading import *
import json
from ldap3 import *
import _thread
clientList = {}
buff={}
threads=[]
serversocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
host = “Mac.local”
port = 8001
serversocket.bind((host, port))
serversocket.listen(5)

class Client():
	def __init__(self, socket, address):
		self.sock = socket
		self.addr = address
		self.name=""


def check_valid(username,password):
	print(username)
	print(password)
	#user_dn = "uid="+username
	server = Server('cs252lab.cse.iitb.ac.in')
	conn=Connection(server,'cn='+username+',dc=cs252lab,dc=cse,dc=iitb,dc=ac,dc=in',password)
	if conn.bind():
	    print("User Authenticated")
	    return True
	else:
	    print("Invalid Credentials")
	    return False

def identify_messages(prefix,received):
	print("prefix : ")
	print(prefix)
	message_list = []
	temp = "%s%s" %(prefix,received)
	splitted= temp.split('{')
	if len(splitted[0])==0:
		del splitted[0]
	prefix=""
	for candidate in splitted:
		if(len(candidate)!=0):
			if(candidate[len(candidate)-1]=='}'):
				message_list.append('{'+str(candidate))
			else:
				prefix = candidate
				break;

	return message_list, prefix

		


def send_to_client(receiver,mess):
	mess= str(json.dumps(mess))
	q= receiver.sock.send(mess.encode())

def handle_all(client):
	send_to_client(client,make_message("Auth","Syn",0))
	prefix=""
	mess = client.sock.recv(1024).decode()
	mess = json.loads(mess)
	if check_valid(mess['Username'],mess['Password']):
		client.name = mess['Username']
		client.connected= True
		send_to_client(client,make_message("Auth","Ack",0 ))
		send_to_client(client,make_message("ClientStatus","List",list(clientList.keys())))
		for usr in clientList:
			send_to_client(clientList[usr],make_message("ClientStatus","Join",client.name))
		clientList[client.name]=client
		if(client.name in buff):
			for p in buff[client.name]:
				process_message(str(json.dumps(p)))
			del buff[client.name]
		while(client.connected):
			mess = client.sock.recv(1024).decode()
			message_list, prefix = identify_messages(prefix,mess)
			for x in message_list:
				process_message(x)
		clientList.pop(client.name,None)
		for usr in clientList:
			send_to_client(clientList[usr],make_message("ClientStatus","Exit",client.name))
	else:
		send_to_client(client,make_message("Auth","Nack",0))
	client.sock.close()
	del client



def process_message(message):
	print(type(message))
	print(message)
	message = json.loads(message)
	print(message)
	if(message["Type"]=="Forward"):
		if message["To"] in clientList:
			send_to_client(clientList[message["To"]],message)
			process_message(str(json.dumps(make_message("Receipts","Delivered",message))))
		else:
			process_message(str(json.dumps(make_message("Receipts","Sent",message))))
			if message["To"] in buff:
				buff[message["To"]].append(message)
			else:
				buff[message["To"]] = [message]
	if(message["Type"]=="User_Query"):
		if message["Content"][:4] == "name":
			message["Spec"]=1
			send_to_client(clientList[message["From"]], message)
		else:
			send_to_client(clientList[message["From"]], message)
	if(message["Type"]=="Receipts"):
		rec = message["From"]
		if rec in clientList:
			send_to_client(clientList[rec],message)
		else:
			if rec in buff:
				buff[rec].append(message)
			else:
				buff[rec] = [message]	
	if(message["Type"]=="ClientStatus"):
		#Will Always be of Exit type
		clientList[message["From"]].connected=False

	if(message["Type"]=="Group"): #All responsibilty is of client
		to = message["To"] #List
		for usr in to:
			if usr in clientList:
				send_to_client(clientList[usr],message)
			else:
				if usr in buff:
					buff[usr].append(message)
				else:
					buff[usr] = [message]
	if(message["Type"]=="File_Transfer"):
		if message["To"] in clientList:
			send_to_client(clientList[message["To"]],message)
		else:
			if message["To"] in buff:
				buff[message["To"]].append(message)
			else:
				buff[message["To"]] = [message]		


def make_message(essence,spec,info):
	message={}
	message["Type"]= essence
	message["Spec"]=spec
	if(essence=="Auth"):
		return message	
	elif(essence=="ClientStatus"):	
		message["Content"] = info
	elif (essence=="Receipts"):
		message["From"] = info["From"]
		message["To"] = info["To"]
		message["Id"] = info["Id"]

	message["Timestamp"]=str(datetime.datetime.now())
	return message
while 1:
    clientsocket, address = serversocket.accept()
    x = Client(clientsocket,address) 
    _thread.start_new_thread( handle_all, (x, ) )

# z=_thread.start_new_thread( handle_all, (threads, ) )
# try:
# 	_thread.start_new_thread( handle_all, ( 2, ) )
# except:
#    print ("Error: unable to start thread")
# while 1:
#    pass
# def make_message_new(essence,spec):
	# message={}
	# if(essence=="Auth"):
	# 	message["Type"] = essence
	# 	message["Spec"] = spec
	# elif essence == "ClientStatus" :
	# 	message["Type"] = essence
	# 	if(spec=="Clients"):
	# 		message["Content"] = clientList
	# 	else:
	# 		message["Join"] = spec.name
	# elif (essence=="MessageStatus"):
	# 	message["Type"] = essence
	# 	message["Status"] = spec["Status"]
	# 	message["Id"]  = spec["Id"]
	# 	message["From"] = spec["To"]


# def make_message(type, int1, name, clientlist):
#     message = {}
#     message["type"]=type
#     if type == "Auth":
#         if int1 == 0:
#             message["Ask"]= True
#         elif int1 == 1:
#             message["Ask"]= False
#             message["ACK"]= True
#         elif int1 == 2:
#             message["Ask"]= False
#             message["ACK"]= False
        
#     elif type == "ClientStatus":
#         if int1 == 0:
#             message["Content"]=clientlist
#         elif int1 == 1:
#             message["join"]=False
#         elif int1 == 2:
#             message["join"]=True
#         message["name"]=name

#     elif type == "MessageStatus":
#         message["status"]=int1

#     message["Timestamp"]=datetime.datetime.now()
#     message["From"]="Server"



