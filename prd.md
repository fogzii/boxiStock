1. Project Overview
   A lightweight, high-performance inventory and profit management system tailored for resellers with diverse items (e.g., collectibles, sporting goods). The system tracks stock across different "buy-in" price points (Lots) and automatically calculates profit using a FIFO (First-In, First-Out) method when items are sold.

Tech Stack
Framework: Next.js 15 (App Router) + TypeScript

Auth: Supabase Auth (Google OAuth)

Database: Supabase (PostgreSQL)

Styling: Tailwind CSS + Shadcn/UI

Charts: Recharts (for Dashboard insights)

2. Visual Direction & UI Architecture
   The application must strictly follow a modern, dark-mode analytics aesthetic.

Theme: Strict Dark Mode (Deep Charcoal/Obsidian background).

Color Palette: Primary brand/accent color is a muted purple/indigo (#9180a8). Use this for active states, primary buttons (e.g., "Quick Create"), and highlights.

Component Styling: High-contrast text on dark backgrounds with subtle borders. Avoid heavy drop shadows.

Layout: Permanent left-hand sidebar for navigation containing links to the core pages and a prominent "Quick Create" action button.

Charts: Area charts must use translucent gradients (Blue/Purple) to create a "glow" effect, similar to modern analytics dashboards. Stat cards should feature small "trend percentage" badges in the top right.

3. Core Features & Business Logic
   Inventory Management (The "Lots" System)
   Expandable Data Table: The main stock table shows the consolidated view (Total Stock and Total Value per Product). Clicking a row expands it to reveal individual "Lots" (e.g., 5 units @ $10, 10 units @ $12).

Stocking Transition: Lots do not use string-based status tags. Instead, newly added lots that haven't arrived yet are visually separated. A one-click "Stocked" button allows users to transition an incoming lot into active, sellable inventory (isStocked = true).

FIFO Sales Automation
Automated Profit Calculation: When recording a sale of X units, the backend must automatically deduct remainingQuantity from the oldest active lots first (where isStocked == true). The totalProfit is calculated immediately and saved to the Sale record.

Date Handling: Sales default to "Today's Date" automatically, with a manual override option via a date picker.

Depletion: When a lot's remainingQuantity reaches 0, it is fully depleted. Sold items are completely removed from the active inventory view and are visible only in the Sales History.

4. Application Structure (Tabs/Pages)
   Dashboard (Home): Features high-level metric cards (Total Lifetime Profit, Current Inventory Value, Monthly Gain) and Recharts area charts showing historical sales/profit performance.

Stock Manager: The primary CRUD interface. A table for adding new products/lots, viewing stock, and clicking "Stocked" on arriving items.

Sales History: A dedicated table listing all completed sales transactions, displaying the exact profit generated per transaction and the date sold.
