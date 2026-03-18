# Shop — Point de Vente

Un système de **point de vente moderne** inspiré du module POS d'Odoo, conçu pour la gestion d'une petite boutique. Développé avec **SvelteKit**, **Tailwind CSS** et une base de données **SQLite**.

![Shop](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Fonctionnalités

### 🖥️ Interface de Caisse (POS)
- Grille de produits avec **filtrage par catégorie** et **recherche en temps réel**
- **Panier interactif** avec modification des quantités
- Support de **plusieurs caisses** (sélection au moment de la vente)
- **Sélection de client** optionnelle
- Choix du **mode de paiement** (Espèces, Carte, Mobile Money)
- **Génération de facture** automatique après chaque vente
- **Impression de facture** directement depuis le navigateur
- Mise à jour du **stock en temps réel**

### ⚙️ Administration
- **Tableau de bord** avec statistiques (CA du jour, total, ventes, produits, clients)
- **Gestion des caisses** : créer, modifier et activer/désactiver plusieurs POS
- **Gestion des catégories** : créer avec nom et couleur personnalisée
- **Gestion des produits** : prix, stock, barcode, image URL, catégorie
- **Gestion des clients** : nom, téléphone, email, adresse
- **Historique complet des ventes** avec visualisation des factures

### 📱 Responsive Design
- Interface adaptée **mobile, tablette et desktop**
- Sidebar de panier en **mode slide-over** sur mobile
- Navigation admin avec menu **hamburger** sur mobile

---

## 🛠️ Installation

### Prérequis
- **Node.js** >= 18
- **npm** >= 9

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/Njivaniaina/point-de-vente.git
cd point-de-vente

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:5173](http://localhost:5173)

La base de données SQLite est créée automatiquement dans `data/pos.db` au premier démarrage, avec des données de démonstration.

---

## 🏗️ Structure du projet

```
src/
├── lib/
│   ├── server/
│   │   └── db.ts          # Connexion SQLite + schéma + seed
│   └── types.ts           # Types TypeScript partagés
└── routes/
    ├── +page.svelte        # Page d'accueil
    ├── api/               # Endpoints REST
    │   ├── categories/
    │   ├── products/
    │   ├── clients/
    │   ├── pos/
    │   └── sales/
    ├── admin/             # Back-office
    │   ├── +layout.svelte  # Sidebar admin
    │   ├── +page.svelte    # Dashboard
    │   ├── categories/
    │   ├── products/
    │   ├── clients/
    │   ├── pos/
    │   └── sales/
    └── pos/               # Caisse
        └── +page.svelte
data/
└── pos.db                 # Base de données SQLite (créée auto)
```

---

## 🗄️ Schéma de la base de données

```sql
pos_instances   → Caisses enregistrées
categories      → Catégories de produits (avec couleur)
products        → Catalogue produits (prix, stock, catégorie)
clients         → Répertoire clients
sales           → En-tête des ventes (factures)
sale_items      → Lignes de chaque vente
```

---

## 🚀 Production

```bash
# Construire le projet
npm run build

# Lancer en production
node build
```

> **Note :** En production, assurez-vous que le dossier `data/` est persistant et accessible en écriture.

---

## 🎨 Stack Technique

| Technologie | Usage |
|---|---|
| **SvelteKit** | Framework full-stack |
| **Tailwind CSS v4** | Stylisation |
| **better-sqlite3** | Base de données SQLite |
| **TypeScript** | Typage statique |

---

## 📦 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Construit l'application pour la production |
| `npm run preview` | Prévisualise la production localement |
| `npm run check` | Vérifie les types TypeScript |
