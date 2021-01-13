insert into roles("name","path","members") values('ROLE_1','permit.apps.APP1', '{"kthefrog"}');
insert into roles("name","path","members") values('ROLE_2','permit.apps.APP1', '{"kthefrog", "mpiggy"}');
insert into roles("name","path","members") values('ROLE_ADMIN','permit.apps.APP2.SG1', '{"kthefrog", "mpiggy"}');
insert into roles("name","path","members") values('ROLE_READER','permit.apps.APP2.SG1', '{"kthefrog"}');
insert into roles("name","path","members") values('ROLE_ADMIN','permit.apps.APP2.SG2', '{"mpiggy"}');
insert into roles("name","path","members") values('ROLE_READER','permit.apps.APP2.SG2', '{"kthefrog"}');
insert into roles("name","path","members") values('ROLE_DUMMY','permit.apps.Permit', '{"someuser@domain.com"}');
insert into roles("name","path","members") values('ROLE_ADMIN','permit.apps.Permit', '{"someuser@domain.com", "someotheruser@domain.com"}');
insert into roles("name","path","members") values('ROLE_TO_DELETE1','permit.apps.APP3.CTX1', '{"kermit@thefrog.com"}');
insert into roles("name","path","members") values('ROLE_TO_DELETE2','permit.apps.APP3.CTX1', '{"kermit@thefrog.com"}');
insert into roles("name","path","members") values('ROLE_TO_DELETE2','permit.apps.APP3.CTX2', '{"kermit@thefrog.com"}');

insert into preferences("owner","prefData","path") values('kthefrog','{"pref1":"value1","pref2":5}','permit.prefs.APP1');
insert into preferences("owner","prefData","path") values('kthefrog','{"pref3":10,"pref4":"cake"}','permit.prefs.APP2');
insert into preferences("owner","prefData","path") values('kthefrog','{"pref0":"global"}','permit.prefs');
insert into preferences("owner","prefData","path") values('mpiggy','{"pref1":"value2","pref2":false}','permit.prefs.APP1');
insert into preferences("owner","prefData","path") values('mpiggy','{"pref3":0,"pref4":"carrot"}','permit.prefs.APP2');