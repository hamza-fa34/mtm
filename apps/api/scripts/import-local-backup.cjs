#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString =
  process.env.DATABASE_URL || 'postgresql://mtm:mtm@localhost:5432/mtm';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function parseArgs(argv) {
  const args = { dryRun: true };
  const positional = [];
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') args.file = argv[++i];
    else if (arg === '--apply') args.dryRun = false;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--domains') args.domains = String(argv[++i] || '').split(',').map((v) => v.trim()).filter(Boolean);
    else if (!arg.startsWith('--')) positional.push(arg);
  }

  if (!args.file && positional.length > 0) {
    args.file = positional.shift();
  }
  if (!args.domains && positional.length > 0) {
    args.domains = positional
      .join(',')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (!args.file) throw new Error('Missing --file <path>');
  return args;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUnit(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'kg') return 'KG';
  if (raw === 'g') return 'G';
  if (raw === 'l') return 'L';
  if (raw === 'ml') return 'ML';
  if (raw === 'unit' || raw === 'unite' || raw === 'unité') return 'UNIT';
  return 'UNIT';
}

function normalizeDate(value, fallback = new Date()) {
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

function domainEnabled(selected, domain) {
  if (!selected || selected.length === 0) return true;
  return selected.includes(domain);
}

async function run() {
  const args = parseArgs(process.argv);
  const filePath = path.resolve(process.cwd(), args.file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const payload = JSON.parse(raw);
  const keys = payload?.keys || {};

  const settings = keys.molls_settings || null;
  const users = toArray(keys.molls_users);
  const categories = toArray(keys.molls_categories);
  const ingredients = toArray(keys.molls_ingredients);
  const purchases = toArray(keys.molls_purchases);
  const wastes = toArray(keys.molls_wastes);
  const products = toArray(keys.molls_products);
  const customers = toArray(keys.molls_customers);
  const orders = toArray(keys.molls_orders);
  const currentSession = keys.molls_current_session || null;
  const sessionsHistory = toArray(keys.molls_sessions_history);
  const expenses = toArray(keys.molls_expenses);

  const report = {
    dryRun: args.dryRun,
    sourceFile: filePath,
    counts: {
      settings: settings ? 1 : 0,
      users: users.length,
      categories: categories.length,
      ingredients: ingredients.length,
      products: products.length,
      customers: customers.length,
      purchases: purchases.length,
      wastes: wastes.length,
      orders: orders.length,
      sessions: sessionsHistory.length + (currentSession ? 1 : 0),
      expenses: expenses.length,
    },
    warnings: [],
    applied: [],
  };

  const sessionSource = [...sessionsHistory];
  if (currentSession) sessionSource.push(currentSession);

  const sessionById = new Map();
  for (const session of sessionSource) {
    if (!session?.id) continue;
    sessionById.set(session.id, session);
  }

  const knownCategoryIds = new Set(categories.map((c) => c?.id).filter(Boolean));
  const knownIngredientIds = new Set(ingredients.map((i) => i?.id).filter(Boolean));
  const knownProductIds = new Set(products.map((p) => p?.id).filter(Boolean));
  for (const product of products) {
    if (!knownCategoryIds.has(product?.categoryId)) {
      report.warnings.push(`Product ${product?.id ?? 'unknown'} references missing category ${product?.categoryId}`);
    }
    for (const recipeItem of toArray(product?.recipe)) {
      if (!knownIngredientIds.has(recipeItem?.ingredientId)) {
        report.warnings.push(`Product ${product?.id ?? 'unknown'} recipe references missing ingredient ${recipeItem?.ingredientId}`);
      }
    }
  }
  for (const order of orders) {
    for (const item of toArray(order?.items)) {
      if (!knownProductIds.has(item?.productId)) {
        report.warnings.push(`Order ${order?.id ?? 'unknown'} references missing product ${item?.productId}`);
      }
    }
  }

  if (args.dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (domainEnabled(args.domains, 'settings') && settings) {
      const existing = await tx.truckSettings.findFirst({ orderBy: { createdAt: 'asc' } });
      if (existing) {
        await tx.truckSettings.update({
          where: { id: existing.id },
          data: {
            name: settings.name ?? existing.name,
            slogan: settings.slogan ?? null,
            tvaEmporter: Number(settings.tvaEmporter ?? existing.tvaEmporter),
            tvaPlace: Number(settings.tvaPlace ?? existing.tvaPlace),
          },
        });
      } else {
        await tx.truckSettings.create({
          data: {
            id: settings.id || undefined,
            name: settings.name ?? "Molly's Truck",
            slogan: settings.slogan ?? null,
            tvaEmporter: Number(settings.tvaEmporter ?? 10),
            tvaPlace: Number(settings.tvaPlace ?? 10),
          },
        });
      }
      report.applied.push('settings');
    }

    if (domainEnabled(args.domains, 'users')) {
      for (const user of users) {
        if (!user?.id || !user?.name || !user?.role || !user?.pin) continue;
        await tx.user.upsert({
          where: { id: user.id },
          update: {
            name: user.name,
            role: user.role === 'MANAGER' ? 'MANAGER' : 'STAFF',
            pinHash: String(user.pin),
            isActive: true,
          },
          create: {
            id: user.id,
            name: user.name,
            role: user.role === 'MANAGER' ? 'MANAGER' : 'STAFF',
            pinHash: String(user.pin),
            isActive: true,
          },
        });
      }
      report.applied.push('users');
    }

    if (domainEnabled(args.domains, 'categories')) {
      for (const category of categories) {
        if (!category?.id || !category?.name) continue;
        await tx.category.upsert({
          where: { id: category.id },
          update: {
            name: category.name,
            color: category.color ?? 'bg-gray-500',
            order: Number(category.ordre ?? category.order ?? 0),
          },
          create: {
            id: category.id,
            name: category.name,
            color: category.color ?? 'bg-gray-500',
            order: Number(category.ordre ?? category.order ?? 0),
          },
        });
      }
      report.applied.push('categories');
    }

    if (domainEnabled(args.domains, 'ingredients')) {
      for (const ingredient of ingredients) {
        if (!ingredient?.id || !ingredient?.name) continue;
        await tx.ingredient.upsert({
          where: { id: ingredient.id },
          update: {
            name: ingredient.name,
            unit: normalizeUnit(ingredient.unit),
            currentStock: Number(ingredient.currentStock ?? 0),
            minStock: Number(ingredient.minStock ?? 0),
            costPrice: Number(ingredient.costPrice ?? 0),
            category: ingredient.category ?? 'UNCLASSIFIED',
          },
          create: {
            id: ingredient.id,
            name: ingredient.name,
            unit: normalizeUnit(ingredient.unit),
            currentStock: Number(ingredient.currentStock ?? 0),
            minStock: Number(ingredient.minStock ?? 0),
            costPrice: Number(ingredient.costPrice ?? 0),
            category: ingredient.category ?? 'UNCLASSIFIED',
          },
        });
      }
      report.applied.push('ingredients');
    }

    if (domainEnabled(args.domains, 'products')) {
      for (const product of products) {
        if (!product?.id || !product?.name || !product?.categoryId) continue;
        await tx.product.upsert({
          where: { id: product.id },
          update: {
            categoryId: product.categoryId,
            name: product.name,
            price: Number(product.price ?? 0),
            vatRate: Number(product.vatRate ?? 0),
            isAvailable: product.isAvailable !== false,
            imageUrl: product.imageUrl ?? null,
            loyaltyPoints: product.loyaltyPrice ?? null,
          },
          create: {
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            price: Number(product.price ?? 0),
            vatRate: Number(product.vatRate ?? 0),
            isAvailable: product.isAvailable !== false,
            imageUrl: product.imageUrl ?? null,
            loyaltyPoints: product.loyaltyPrice ?? null,
          },
        });

        await tx.variant.deleteMany({ where: { productId: product.id } });
        for (const variant of toArray(product.variants)) {
          if (!variant?.name) continue;
          await tx.variant.create({
            data: {
              id: variant.id || undefined,
              productId: product.id,
              name: variant.name,
              priceExtra: Number(variant.priceExtra ?? 0),
            },
          });
        }

        await tx.recipeItem.deleteMany({ where: { productId: product.id } });
        for (const recipeItem of toArray(product.recipe)) {
          if (!recipeItem?.ingredientId) continue;
          await tx.recipeItem.create({
            data: {
              productId: product.id,
              ingredientId: recipeItem.ingredientId,
              quantity: Number(recipeItem.quantity ?? 0),
            },
          });
        }
      }
      report.applied.push('products');
    }

    if (domainEnabled(args.domains, 'customers')) {
      for (const customer of customers) {
        if (!customer?.id || !customer?.name) continue;
        await tx.customer.upsert({
          where: { id: customer.id },
          update: {
            name: customer.name,
            phone: customer.phone || null,
            email: customer.email || null,
            loyaltyPoints: Number(customer.loyaltyPoints ?? 0),
            lastVisitAt: customer.lastVisit ? new Date(customer.lastVisit) : null,
          },
          create: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || null,
            email: customer.email || null,
            loyaltyPoints: Number(customer.loyaltyPoints ?? 0),
            lastVisitAt: customer.lastVisit ? new Date(customer.lastVisit) : null,
          },
        });
      }
      report.applied.push('customers');
    }

    if (domainEnabled(args.domains, 'sessions')) {
      for (const session of sessionSource) {
        if (!session?.id || !session?.startTime) continue;
        await tx.dailySession.upsert({
          where: { id: session.id },
          update: {
            startTime: normalizeDate(session.startTime),
            endTime: session.endTime ? normalizeDate(session.endTime) : null,
            initialCash: Number(session.initialCash ?? 0),
            finalCash: session.finalCash == null ? null : Number(session.finalCash),
            totalSales: Number(session.totalSales ?? 0),
            totalExpenses: Number(session.totalExpenses ?? 0),
            ordersCount: Number(session.ordersCount ?? 0),
            status: session.status === 'OPEN' ? 'OPEN' : 'CLOSED',
          },
          create: {
            id: session.id,
            startTime: normalizeDate(session.startTime),
            endTime: session.endTime ? normalizeDate(session.endTime) : null,
            initialCash: Number(session.initialCash ?? 0),
            finalCash: session.finalCash == null ? null : Number(session.finalCash),
            totalSales: Number(session.totalSales ?? 0),
            totalExpenses: Number(session.totalExpenses ?? 0),
            ordersCount: Number(session.ordersCount ?? 0),
            status: session.status === 'OPEN' ? 'OPEN' : 'CLOSED',
          },
        });
      }
      report.applied.push('sessions');
    }

    if (domainEnabled(args.domains, 'orders')) {
      for (const order of orders) {
        if (!order?.id || !order?.timestamp) continue;
        const orderedAt = normalizeDate(order.timestamp);
        let linkedSessionId = order.sessionId || null;
        if (!linkedSessionId) {
          for (const session of sessionSource) {
            if (!session?.id || !session?.startTime) continue;
            const start = normalizeDate(session.startTime);
            const end = session.endTime ? normalizeDate(session.endTime) : null;
            if (orderedAt >= start && (!end || orderedAt <= end)) {
              linkedSessionId = session.id;
              break;
            }
          }
        }

        await tx.order.upsert({
          where: { id: order.id },
          update: {
            orderNumber: order.orderNumber || `ORD-MIG-${order.id.slice(0, 8)}`,
            orderedAt,
            total: Number(order.total ?? 0),
            status: order.status || 'PENDING',
            paymentMethod: order.paymentMethod || null,
            serviceMode: order.serviceMode || 'TAKEAWAY',
            customerId: order.customerId || null,
            sessionId: linkedSessionId,
          },
          create: {
            id: order.id,
            orderNumber: order.orderNumber || `ORD-MIG-${order.id.slice(0, 8)}`,
            orderedAt,
            total: Number(order.total ?? 0),
            status: order.status || 'PENDING',
            paymentMethod: order.paymentMethod || null,
            serviceMode: order.serviceMode || 'TAKEAWAY',
            customerId: order.customerId || null,
            sessionId: linkedSessionId,
          },
        });

        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
        for (const item of toArray(order.items)) {
          if (!item?.productId) continue;
          await tx.orderItem.create({
            data: {
              id: item.id || undefined,
              orderId: order.id,
              productId: item.productId,
              variantName: item.selectedVariant?.name ?? null,
              quantity: Number(item.quantity ?? 1),
              unitPrice: Number(item.unitPrice ?? 0),
              totalPrice: Number(item.totalPrice ?? 0),
              isRedeemed: Boolean(item.isRedeemed),
              redeemedPoints: item.redeemedPoints ? Number(item.redeemedPoints) : null,
            },
          });
        }
      }
      report.applied.push('orders');
    }

    if (domainEnabled(args.domains, 'purchases')) {
      for (const purchase of purchases) {
        if (!purchase?.id || !purchase?.ingredientId) continue;
        await tx.purchase.upsert({
          where: { id: purchase.id },
          update: {
            ingredientId: purchase.ingredientId,
            supplierName: purchase.supplierName || null,
            purchasedAt: normalizeDate(purchase.date),
            quantity: Number(purchase.quantity ?? 0),
            totalPrice: Number(purchase.totalPrice ?? 0),
          },
          create: {
            id: purchase.id,
            ingredientId: purchase.ingredientId,
            supplierName: purchase.supplierName || null,
            purchasedAt: normalizeDate(purchase.date),
            quantity: Number(purchase.quantity ?? 0),
            totalPrice: Number(purchase.totalPrice ?? 0),
          },
        });
      }
      report.applied.push('purchases');
    }

    if (domainEnabled(args.domains, 'wastes')) {
      for (const waste of wastes) {
        if (!waste?.id || !waste?.ingredientId) continue;
        await tx.waste.upsert({
          where: { id: waste.id },
          update: {
            ingredientId: waste.ingredientId,
            quantity: Number(waste.quantity ?? 0),
            reason: String(waste.reason ?? 'Autre'),
            wastedAt: normalizeDate(waste.date),
          },
          create: {
            id: waste.id,
            ingredientId: waste.ingredientId,
            quantity: Number(waste.quantity ?? 0),
            reason: String(waste.reason ?? 'Autre'),
            wastedAt: normalizeDate(waste.date),
          },
        });
      }
      report.applied.push('wastes');
    }

    if (domainEnabled(args.domains, 'expenses')) {
      for (const expense of expenses) {
        if (!expense?.id || !expense?.label) continue;
        await tx.expense.upsert({
          where: { id: expense.id },
          update: {
            label: expense.label,
            merchant: expense.merchant ?? '',
            amountTTC: Number(expense.amountTTC ?? 0),
            vatAmount: Number(expense.vatAmount ?? 0),
            category: expense.category ?? 'AUTRE',
            paymentMethod: expense.paymentMethod ?? 'Caisse (Especes)',
            hasReceipt: Boolean(expense.hasReceipt),
            spentAt: normalizeDate(expense.date),
          },
          create: {
            id: expense.id,
            label: expense.label,
            merchant: expense.merchant ?? '',
            amountTTC: Number(expense.amountTTC ?? 0),
            vatAmount: Number(expense.vatAmount ?? 0),
            category: expense.category ?? 'AUTRE',
            paymentMethod: expense.paymentMethod ?? 'Caisse (Especes)',
            hasReceipt: Boolean(expense.hasReceipt),
            spentAt: normalizeDate(expense.date),
          },
        });
      }
      report.applied.push('expenses');
    }
  });

  console.log(JSON.stringify(report, null, 2));
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
