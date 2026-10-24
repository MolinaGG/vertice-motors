#!/usr/bin/env python3
"""Scoped live checks; reads gateway token from hidden stdin, never from argv or files."""
import getpass,json,urllib.request,urllib.error,uuid,hashlib
endpoint='https://fseguvhkdewecteuvasd.supabase.co/functions/v1/vertice-gateway'
token=getpass.getpass('Gateway token (hidden): ')
def call(action,payload=None,actor=None,credential=None):
 req=urllib.request.Request(endpoint,data=json.dumps({'action':action,'payload':payload or {},'actor':actor}).encode(),headers={'Content-Type':'application/json','x-vertice-token':token if credential is None else credential},method='POST')
 try:
  with urllib.request.urlopen(req,timeout=30) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
checks=[]
def check(name,condition):
 if not condition:raise AssertionError(name)
 checks.append(name);print('PASS '+name,flush=True)
s,d=call('catalog',credential='bad');check('invalid gateway token denied',s==401)
s,d=call('catalog');check('persistent catalog has 12 vehicles',s==200 and len(d.get('vehicles',[]))==12)
s,d=call('saveVehicle',{'id':'onix-2022'},actor={'userId':'qa-not-admin'});check('authenticated non-admin denied',s==403)
s,d=call('bootstrapAdmin',{'private_setup':False},actor={'userId':'qa-not-admin'});check('bootstrap without owner-private setup denied',s==403)
s,d=call('adminState');check('anonymous administrative read denied',s==403)
rid=str(uuid.uuid4());payload={'name':'Pessoa Demonstração (teste técnico)','email':'demonstracao@example.com','phone':'','kind':'contact','message':'Registro fictício para verificar persistência e prevenção de envio duplicado.','consent':True,'request_id':rid,'rate_key':hashlib.sha256(('qa-'+rid).encode()).hexdigest()}
s,d=call('createLead',payload);check('contact persisted before success',s==201 and bool(d.get('id')));lead=d['id']
s,d=call('createLead',payload);check('duplicate submission is idempotent',s==200 and d.get('id')==lead)
print(json.dumps({'checks':len(checks),'test_lead_id':lead}))
