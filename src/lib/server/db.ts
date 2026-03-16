import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'pos.db');

let db: Database.Database;

export function getDb(): Database.Database {
	if (!db) {
		// Ensure directory exists
		import('fs').then(fs => fs.mkdirSync(join(process.cwd(), 'data'), { recursive: true }));
		db = new Database(DB_PATH);
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		initSchema(db);
	}
	return db;
}

function initSchema(db: Database.Database) {
	db.exec(`
    CREATE TABLE IF NOT EXISTS pos_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      barcode TEXT,
      image_url TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pos_id INTEGER NOT NULL REFERENCES pos_instances(id),
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      invoice_ref TEXT UNIQUE NOT NULL,
      card_number TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'MGA',
      exchange_rate REAL NOT NULL DEFAULT 1,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for sales table
  const salesCols = db.prepare("PRAGMA table_info(sales)").all() as any[];
  const salesColNames = salesCols.map(c => c.name);
  if (!salesColNames.includes('subtotal')) db.exec("ALTER TABLE sales ADD COLUMN subtotal REAL NOT NULL DEFAULT 0");
  if (!salesColNames.includes('tax_amount')) db.exec("ALTER TABLE sales ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0");
  if (!salesColNames.includes('tax_rate')) db.exec("ALTER TABLE sales ADD COLUMN tax_rate REAL NOT NULL DEFAULT 0");
  if (!salesColNames.includes('currency')) db.exec("ALTER TABLE sales ADD COLUMN currency TEXT NOT NULL DEFAULT 'MGA'");
  if (!salesColNames.includes('exchange_rate')) db.exec("ALTER TABLE sales ADD COLUMN exchange_rate REAL NOT NULL DEFAULT 1");
  if (!salesColNames.includes('card_number')) db.exec("ALTER TABLE sales ADD COLUMN card_number TEXT");
  if (!salesColNames.includes('note')) db.exec("ALTER TABLE sales ADD COLUMN note TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

	// Seed default data if empty
	const posCount = (db.prepare('SELECT COUNT(*) as count FROM pos_instances').get() as { count: number }).count;
	if (posCount === 0) {
		db.prepare("INSERT INTO pos_instances (name, location) VALUES ('Caisse Principale', 'Boutique Centrale')").run();
		db.prepare("INSERT INTO categories (name, color) VALUES ('Électronique', '#3b82f6'), ('Alimentation', '#10b981'), ('Vêtements', '#8b5cf6'), ('Fournitures', '#f59e0b')").run();
		db.prepare(`
      INSERT INTO products (name, price, stock, category_id) VALUES
        ('Smartphone XR', 299000, 15, 1),
        ('Casque Audio', 45000, 30, 1),
        ('Riz Local 5kg', 12000, 100, 2),
        ('Huile 1L', 4500, 80, 2),
        ('T-shirt Coton', 15000, 50, 3),
        ('Stylo Bic', 500, 200, 4)
    `).run();
	}

  const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }).count;
  if (settingsCount === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('shop_name', 'SHOP POS'), ('shop_address', 'Antananarivo, Madagascar'), ('shop_phone', '+261 34 00 000 00'), ('currency', 'MGA'), ('usd_rate', '4000'), ('eur_rate', '4500'), ('tax_rate', '20')").run();
  }
}
