#!/usr/bin/env python 
#coding=utf-8
from threading import Timer
from time import time, sleep
import math
import random
import json
import sys
import websocket

def task(func, interval, delay):
    start = time()
    if delay != 0:
        sleep(delay)
    func()
    end = time()
    if (start + interval > end):
        Timer(start + interval - end, task, (func, interval, 0)).start()
    else:
        times = round((end - start) / interval) # times >= 1
        Timer(start + (times + 1) * interval - end, task, (func, interval, 0)).start()

def schedule(func, interval, delay = 0):
    Timer(interval, task, (func, interval, delay)).start()

id = 0
DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]
def genMid():
    global id
    I = int(math.floor(random.random() * math.pow(2, 16)))
    D = id
    id += 1
    G = ""
    G += DIGITS[I >> 12 & 15]
    G += DIGITS[I >> 8 & 15]
    G += DIGITS[I >> 4 & 15]
    G += DIGITS[15 & I]
    G += DIGITS[D >> 12 & 15]
    G += DIGITS[D >> 8 & 15]
    G += DIGITS[D >> 4 & 15]
    G += DIGITS[15 & D]
    return G

class DingDingContacts(object):
    """ws class"""
    ws = None

    ##self defined vars
    app_key = '' #app key
    uid = '' #dingding uid
    orgId = '' #organization id
    token = '' #login token

    isOrgRelationsRoot = False
    orgList = []
    employees = []
    cookie = 'Cookie:isg=B41746BEF5092429D6F7117B318426B4; l=Av//gTv5eJtjabE9bLxd9moZD9mJ1VOG; deviceid=B6F2448F-4BE8-4DB0-9947-3BFD2706F03C; deviceid_exist=true; dt_s=u-2ab5386-5282722f79-acf2ca3-7e2f28-317caeb1-9b207812-0326-44f6-96d1-9ae246b0849f; token=e08331ab-f22a-4a2a-b8b0-4585ba895cb8|325efc85-8223-43ed-b095-1a26b656ca0a' #get /lwp cookies
    cur_mid = []
    cur_act = ''
    def __init__(self, url = 'wss://webalfa.dingtalk.com/lwp'):
        super(DingDingContacts, self).__init__()
        self.url = url
        #websocket.enableTrace(True)
        header = []
        #header.append('Accept-Encoding:gzip, deflate, sdch')
        header.append(self.cookie)
        #header.append('Host:webalfa.dingtalk.com')
        #header.append('Origin:https://im.dingtalk.com')
        #header.append('Sec-WebSocket-Extensions:permessage-deflate; client_max_window_bits')
        #header.append('Sec-WebSocket-Key:xpuOh/qlI/zsyeARsnZvfQ==')
        #header.append('Sec-WebSocket-Version:13')
        header.append('User-Agent:Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36')
        self.ws = websocket.WebSocketApp(self.url, on_message = self.on_message, on_error = self.on_error, on_close = self.on_close, header = header)
        self.ws.on_open = self.on_open
        self.ping()
        self.write_to_json('OrgRelations', '')

        self.ws.run_forever()

    def on_message(self, ws, message):
        data = json.loads(message)

        try:
            index = -1
            index = self.cur_mid.index(data['headers']['mid'])
        except Exception, e:
            pass
        if index >= 0:
            self.cur_mid.remove(data['headers']['mid'])
            if self.cur_act == 'getOrgRelations':
                print 'fetched count: ' + str(len(self.employees))
                self.handleOrgRelations(data['body'])
            elif self.cur_act == '':
                pass
            if len(self.cur_mid) == 0:
                self.write_to_json('employees', json.dumps(self.employees));
                print 'write complete!'
                self.ws.close()

    def on_error(self, ws, error):
        print error

    def on_close(self, ws):
        print "### closed ###"

    def on_open(self, ws):
        ws.send('{"lwp":"/reg","headers":{"cache-header":"token app-key did ua vhost","vhost":"WK","ua":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36 OS(windows/6.1) Browser(chrome/47.0.2526.111) DingWeb/2.13.1","app-key":"' + self.app_key + '","mid":"' + genMid() + ' 0"},"body":null}')
        ws.send('{"lwp":"/r/Adaptor/LoginI/umidToken","headers":{"mid":"50230000 0"},"body":[]}')
        ws.send('{"lwp":"/subscribe","headers":{"token":"' + self.token + '","sync":"0;0;0","mid":"1ea00001 0"}}')
        self.getOrgRelations()

    def ping(self):
        def func():
            self.ws.send('{"lwp":"/ping","headers":{"mid":"' + genMid() + ' 0"},"body":null}')
        schedule(func, 15, delay = 0)
    def send(self, str):
        self.ws.send(str)
    def getOrgRelations(self, deptId = 'null', orgId = 0):
        if deptId == 'null':
            self.isOrgRelationsRoot = True
        if orgId == 0:
            orgId = self.orgId
        sleep(0.5)
        mid = genMid() + ' 0'
        self.cur_mid.append(mid)
        self.cur_act = 'getOrgRelations'

        #self.ws.send('{"lwp":"/r/Adaptor/LogI/log","headers":{"mid":"d41901ba 0"},"body":[{"code":2,"uid":' + self.uid + ',"app":"dd","appVer":"2.13.1","os":"WINDOWS","osVer":"7","manufacturer":"","model":"","level":1,"message":"gmkey:stay,gokey:stayName=authorized.ding.receive&stayTime=3209"}]}')
        #self.ws.send('{"lwp":"/r/Adaptor/UserI/getUserProfileExtensionByUid","headers":{"mid":"227301bb 0"},"body":[' + self.uid + ',null]}')
        print 'fetch deptId: ' + str(deptId)
        self.ws.send('{"lwp":"/r/Adaptor/ContactI/getOrgRelations","headers":{"mid":"' + mid + '"},"body":[' + str(deptId) + ',0,0,' + orgId + ',0,20]}')
    def handleOrgRelations(self, body):
        if self.isOrgRelationsRoot:
            self.orgList = body['values']
            self.isOrgRelationsRoot = False
        self.write_to_json('OrgRelations', json.dumps(body['values']) + '\r\n', 'a')
        for dept in body['values']:
            if dept['nodeType'] == 0 and dept['dept']['deptId']:
                self.getOrgRelations(dept['dept']['deptId'])
            elif dept['nodeType'] == 1:
                self.employees.append(dept)
    def write_to_json(self, filename, str, mode = 'w'):
        try:
            f = open(filename + '.json', mode)
            f.write(str)
        finally:
            if f:
                f.close()
        
if __name__ == '__main__':
    ddc = DingDingContacts()