import requests
from lxml import html
from bs4 import BeautifulSoup

global netid
global password 

netid = raw_input("Enter your netID here")
password = raw_input("Enter your password here")

session_requests = requests.session()
login_url = "https://web4.login.cornell.edu/?SID=E6C4A2769F33B17C&WAK0Service=https/css.adminapps.cornell.edu@CIT.CORNELL.EDU&WAK2Name=&WAK0Realms=&ReturnURL=https://css.adminapps.cornell.edu/E6C4A2769F33B17C/cuwal2.c0ntinue&VerP=3&VerC=2.3.0.229/idmbuild@fox02.serverfarm.cornell.edu/RedHat6-64bit-55/2.2.15&VerS=Apache%2020171126-0430&VerO=Linux%20m223122lweb2002%202.6.32-696.10.3.el6.x86_64%20%231%20SMP%20Thu%20Sep%2021%2012:12:50%20EDT%202017%20x86_64%20x86_64%20x86_64%20GNU/Linux%20AT&T%20Hosting%20Linux%20Reference%20System%20%20RHEL%206%20%20-%20installed%2008-02-14%2012:35%20UTC%20&Accept=K2&WANow=1516082290&WAK2Flags=0&WAK2Age=30&WAreason=1"

result = session_requests.get(login_url)
tree = html.fromstring(result.text)

# payload = {'netid': netid, 'password': password, 'Submit': 'Login'}
payload = {'netid': "hy384", 'password': "SweeSayObama97", 'Submit': 'Login'}
result = session_requests.post(login_url, data = payload, headers = dict(referer=login_url))


url3 = BeautifulSoup(result.content, "lxml").form.get('action')