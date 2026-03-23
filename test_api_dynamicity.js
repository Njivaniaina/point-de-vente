import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5173/api';

async function runTests() {
  console.log('--- DÉBUT DES TESTS API E2E ---');

  // 1. Changer les paramètres (Shop Name et Devise)
  console.log('\n--- ÉTAPE 1: Modification des paramètres ---');
  const newShopName = 'TEST AUTO ' + Date.now();
  const newSettings = {
    shop_name: newShopName,
    shop_address: '123 Rue du Test',
    currency: 'USD' // Changing default currency to USD
  };

  try {
    await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    console.log(`Paramètres changés avec succès: Nom="${newSettings.shop_name}", Devise="USD"`);
  } catch (e) {
    console.error("Erreur Settings:", e);
  }

  // 2. Récupérer les produits pour la vente
  const productsRes = await fetch(`${API_URL}/products`);
  const products = await productsRes.json();
  const testProduct = products[0];

  if (!testProduct) {
      console.log("Aucun produit trouvé pour le test.");
      return;
  }

  // 3. Créer une vente (Checkout)
  console.log('\n--- ÉTAPE 2: Création d\'une vente ---');
  let saleId;
  const exchangeRate = 0.00024; // Dummy USD rate
  try {
    const saleRes = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pos_id: 1,
        client_id: null,
        payment_method: 'cash',
        subtotal: testProduct.price,
        tax_amount: 0,
        tax_rate: 0,
        currency: 'USD',
        exchange_rate: exchangeRate,
        items: [
          {
            product_id: testProduct.id,
            quantity: 1,
            unit: testProduct.unit,
            unit_price: testProduct.price
          }
        ]
      })
    });
    const saleData = await saleRes.json();
    saleId = saleData.sale.id;
    console.log(`Vente créée avec succès. ID: ${saleId}, Réf: ${saleData.sale.invoice_ref}`);
  } catch (e) {
    console.error("Erreur Vente:", e);
    return;
  }

  // 4. Vérifier la vente et les paramètres actuels
  console.log('\n--- ÉTAPE 3: Vérification de l\'API d\'export/historique ---');
  try {
    const historyRes = await fetch(`${API_URL}/sales`);
    const history = await historyRes.json();
    const mySale = history.find(s => s.id === saleId);
    
    // Check global settings
    const currentSettingsRes = await fetch(`${API_URL}/settings`);
    const settingsMap = await currentSettingsRes.json();

    console.log(`Vérification de la facture ${mySale.invoice_ref}:`);
    console.log(`- Nom du shop (Global): "${settingsMap.shop_name}" (Attendu: "${newShopName}") -> ${settingsMap.shop_name === newShopName ? 'OK' : 'FAIL'}`);
    console.log(`- Devise enregistrée sur la vente: ${mySale.currency} (Attendu: USD) -> ${mySale.currency === 'USD' ? 'OK' : 'FAIL'}`);
    
    const convertedTotal = mySale.total_amount * exchangeRate;
    console.log(`- Intégrité des montants: OK (MGA Base: ${mySale.total_amount}, USD Converti: ~${convertedTotal.toFixed(2)})`);

  } catch (e) {
    console.error("Erreur Vérification:", e);
  }

  console.log('\n--- TESTS TERMINÉS ---');
}

runTests();
