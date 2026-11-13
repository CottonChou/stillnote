-- Legacy resource bucket metadata rename statements were removed. StillNote no
-- longer migrates documents created before the StillNote branding; this
-- migration stays as a no-op so applied databases keep their recorded history.
PRAGMA foreign_keys = ON;
