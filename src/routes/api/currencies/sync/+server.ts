import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getDb } from '$lib/server/db.js';

export const POST: RequestHandler = async () => {
  const db = getDb();
  
  try {
    // Using a more comprehensive API that supports MGA as a source
    const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/mga.json`);
    
    if (!response.ok) {
      return json({ error: "Impossible de contacter le serveur de devises (Source alternative)." }, { status: 502 });
    }
    
    const data = await response.json();
    const mgaRates = data.mga; // { usd: 0.00024, eur: 0.00021, ... }

    const activeCurrencies = db.prepare('SELECT code FROM currencies WHERE active = 1').all() as { code: string }[];
    const stmt = db.prepare('UPDATE currencies SET exchange_rate = ? WHERE code = ?');
    
    let updatedCount = 0;
    for (const cur of activeCurrencies) {
      const codeLower = cur.code.toLowerCase();
      if (cur.code === 'MGA') {
        stmt.run(1.0, 'MGA');
        updatedCount++;
      } else if (mgaRates[codeLower]) {
        stmt.run(mgaRates[codeLower], cur.code);
        updatedCount++;
      }
    }

    return json({ 
      message: `${updatedCount} devises actualisées avec succès via Global Sync.`, 
      rates: mgaRates 
    });
  } catch (err) {
    console.error("Sync Error:", err);
    return json({ error: "Erreur de connexion internet ou problème de source de données." }, { status: 500 });
  }
};
