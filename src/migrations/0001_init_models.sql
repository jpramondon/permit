BEGIN;

CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE preferences (
	"owner" varchar(255) NOT NULL,
	"path" ltree NOT NULL,
	"prefData" jsonb NULL,
	CONSTRAINT preferences_pkey PRIMARY KEY (owner, path)
);
CREATE INDEX prefs_path_gist_idx ON preferences USING gist (path);

CREATE TABLE roles (
	name varchar(255) NOT NULL,
	"path" ltree NOT NULL,
	members _varchar NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (name, path)
);
CREATE INDEX roles_members_gin_idx ON roles USING gin (members);
CREATE INDEX roles_path_gist_idx ON roles USING gist (path);

COMMIT;