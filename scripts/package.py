#!/usr/bin/env python3
"""Build a ZIP locally; never alters tracked source or the uploaded 4.6.5 reference."""
import argparse,json,pathlib,re,zipfile,hashlib
p=argparse.ArgumentParser();p.add_argument('--api-base',required=True);p.add_argument('--output',required=True);a=p.parse_args()
from urllib.parse import urlparse
u=urlparse(a.api_base)
if u.scheme!='https' or not u.netloc or u.query or u.fragment or u.username or not u.path.endswith('/functions/v1/gptyar-api'): p.error('api-base must be an HTTPS function base URL')
root=pathlib.Path(__file__).resolve().parents[1]/'extension'
endpoint=a.api_base.rstrip('/')+'/public/check-for-update'
with zipfile.ZipFile(a.output,'w',zipfile.ZIP_DEFLATED) as out:
 for f in sorted(root.rglob('*')):
  if not f.is_file():continue
  data=f.read_bytes()
  if f.name=='release-channel.js':
   data,count=re.subn(rb'globalThis\.GPTYAR_RELEASE_ENDPOINT\s*=\s*[^;]*;',lambda _:('globalThis.GPTYAR_RELEASE_ENDPOINT = '+json.dumps(endpoint)+';').encode(),data)
   if count!=1:raise RuntimeError('Update channel assignment was not found exactly once')
  out.writestr(str(f.relative_to(root)),data)
print(hashlib.sha256(pathlib.Path(a.output).read_bytes()).hexdigest(),a.output)
