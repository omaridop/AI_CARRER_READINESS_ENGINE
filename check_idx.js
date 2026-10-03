const db = require('better-sqlite3')('backend/data/skillbridge.db');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all());
