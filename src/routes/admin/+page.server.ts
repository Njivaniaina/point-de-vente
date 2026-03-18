import { getDb } from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const db = getDb();
  const productCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get() as { count: number }).count;
  const clientCount = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number }).count;
  const posCount = (db.prepare('SELECT COUNT(*) as count FROM pos_instances WHERE active = 1').get() as { count: number }).count;
  const todaySales = (db.prepare("SELECT COUNT(*) as count FROM sales WHERE date(created_at) = date('now')").get() as { count: number }).count;
  const todayRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE date(created_at) = date('now')").get() as { total: number }).total;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales").get() as { total: number }).total;
  const recentSales = db.prepare(`
    SELECT s.*, p.name as pos_name, c.name as client_name
    FROM sales s
    JOIN pos_instances p ON s.pos_id = p.id
    LEFT JOIN clients c ON s.client_id = c.id
    ORDER BY s.created_at DESC LIMIT 5
  `).all();

  const lowStockProducts = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1 AND p.stock < 5
    ORDER BY p.stock ASC
  `).all();

  const salesByDay = db.prepare(`
    SELECT date(created_at) as day, SUM(total_amount) as total
    FROM sales
    WHERE created_at >= date('now', '-7 days')
    GROUP BY day
    ORDER BY day ASC
  `).all();
  
  return { 
    productCount, 
    clientCount, 
    posCount, 
    todaySales, 
    todayRevenue, 
    totalRevenue, 
    recentSales, 
    lowStockProducts,
    salesTrend: salesByDay 
  };
};
