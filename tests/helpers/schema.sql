-- 로컬 테스트 전용. 운영 마이그레이션으로 실행하지 않습니다.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS citizen_stations(id INTEGER PRIMARY KEY CHECK(id>0),display_name TEXT NOT NULL,address TEXT NOT NULL,lat REAL NOT NULL,lng REAL NOT NULL,active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),visible INTEGER NOT NULL DEFAULT 1 CHECK(visible IN(0,1)));
CREATE TABLE IF NOT EXISTS citizen_reports(id INTEGER PRIMARY KEY AUTOINCREMENT,station_id INTEGER NOT NULL REFERENCES citizen_stations(id),status TEXT NOT NULL CHECK(status IN('received','not_received')),created INTEGER NOT NULL,updated INTEGER,hidden INTEGER NOT NULL DEFAULT 0,withdrawn INTEGER NOT NULL DEFAULT 0,manage_hash TEXT,submission_id TEXT UNIQUE,request_hash TEXT,revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0));
CREATE INDEX IF NOT EXISTS citizen_reports_station ON citizen_reports(station_id,hidden,withdrawn,id DESC);
CREATE TABLE IF NOT EXISTS citizen_suggestions(id INTEGER PRIMARY KEY AUTOINCREMENT,station_id INTEGER REFERENCES citizen_stations(id),category TEXT NOT NULL,item TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'received' CHECK(status IN('received','pending','completed','rejected')),created INTEGER NOT NULL,resolved INTEGER,submission_id TEXT UNIQUE,request_hash TEXT,first_resolved_at INTEGER,retention_review INTEGER NOT NULL DEFAULT 0 CHECK(retention_review IN(0,1)));
CREATE TABLE IF NOT EXISTS citizen_guards(request_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,actor TEXT NOT NULL,station_id INTEGER,scope TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,result_json TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS citizen_guards_limit ON citizen_guards(actor,scope,created);
CREATE TRIGGER IF NOT EXISTS citizen_station_duplicate BEFORE INSERT ON citizen_reports
WHEN EXISTS(SELECT 1 FROM citizen_reports r JOIN citizen_guards g ON g.request_id=r.submission_id WHERE r.station_id=NEW.station_id AND r.status=NEW.status AND r.withdrawn=0 AND g.actor=(SELECT actor FROM citizen_guards WHERE request_id=NEW.submission_id) AND g.expires>NEW.created AND g.created>NEW.created-3600000)
BEGIN SELECT RAISE(ABORT,'citizen_duplicate_experience'); END;
CREATE TRIGGER IF NOT EXISTS citizen_submit_limit BEFORE INSERT ON citizen_guards
WHEN NEW.scope='submit' AND (SELECT COUNT(*) FROM citizen_guards WHERE actor=NEW.actor AND scope='submit' AND expires>NEW.created AND created>NEW.created-60000)>=3
BEGIN SELECT RAISE(ABORT,'citizen_rate_limit'); END;
CREATE TRIGGER IF NOT EXISTS citizen_manage_limit BEFORE INSERT ON citizen_guards
WHEN NEW.scope LIKE 'manage:change:%' AND (SELECT COUNT(*) FROM citizen_guards WHERE actor=NEW.actor AND scope=NEW.scope AND expires>NEW.created AND created>NEW.created-60000)>=10
BEGIN SELECT RAISE(ABORT,'citizen_rate_limit'); END;
CREATE TABLE IF NOT EXISTS citizen_admin_log(id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,reason TEXT NOT NULL,created INTEGER NOT NULL);

CREATE INDEX IF NOT EXISTS citizen_reports_created ON citizen_reports(created);
CREATE INDEX IF NOT EXISTS citizen_reports_owner ON citizen_reports(manage_hash);
CREATE INDEX IF NOT EXISTS citizen_suggestions_expiry ON citizen_suggestions(retention_review,first_resolved_at,created);
CREATE INDEX IF NOT EXISTS citizen_guards_expires ON citizen_guards(expires);


CREATE TABLE IF NOT EXISTS citizen_retention_log(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 created INTEGER NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN('general','security')),
 status TEXT NOT NULL CHECK(status IN('success','partial_failure','pending')),
 deleted INTEGER NOT NULL DEFAULT 0,
 changed INTEGER NOT NULL DEFAULT 0,
 remaining INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS citizen_retention_log_created ON citizen_retention_log(created);
