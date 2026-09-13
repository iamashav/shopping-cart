import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";
import type { Product } from "@/lib/catalog/schema";
import { orderReference } from "@/lib/orders/reference";
import type { Order } from "@/lib/orders/schema";
import { emulatorsRunning, signInAsAdmin, testDb } from "./emulator";

test.skip(!emulatorsRunning(), "Firebase emulators are not running");

test.beforeEach(async ({ page }, testInfo) => {
  await signInAsAdmin(page, testInfo);
});

// Orders are seeded straight into the emulator with unique ids, so tests and retries don't collide.
async function seedOrder(overrides: Partial<Order> = {}) {
  const id = `cs_test_e2e_${randomUUID().replace(/-/g, "")}`;
  const order = {
    id,
    reference: orderReference(id),
    status: "paid",
    email: "e2e-customer@bloom.test",
    emailLower: "e2e-customer@bloom.test",
    customerName: "E2E Customer",
    shipping: {
      name: "E2E Customer",
      line1: "1 Test Lane",
      line2: null,
      city: "Wellington",
      state: null,
      postalCode: "6011",
      country: "NZ",
    },
    items: [
      {
        productSlug: "tarrazu-honey",
        variantId: "250g-whole-bean",
        name: "Tarrazú Honey",
        label: "250g · Whole bean",
        quantity: 2,
        unitAmountCents: 2000,
        totalCents: 4000,
        oversold: false,
        stockTaken: 2,
      },
    ],
    subtotalCents: 4000,
    shippingCents: 0,
    totalCents: 4000,
    currency: "usd",
    paymentIntentId: null,
    ...overrides,
    createdAt: Timestamp.now(),
  };
  await testDb().collection("orders").doc(id).set(order);
  return order;
}

test("orders can be filtered by status and searched", async ({ page }) => {
  const tag = randomUUID().slice(0, 8);
  const email = `filter-${tag}@bloom.test`;
  const paid = await seedOrder({ email, emailLower: email });
  const shipped = await seedOrder({ email, emailLower: email, status: "shipped" });

  await page.goto("/admin/orders");
  await page.getByRole("searchbox", { name: "Search orders" }).fill(tag);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(new RegExp(`q=${tag}`));
  await expect(page.getByRole("link", { name: paid.reference })).toBeVisible();
  await expect(page.getByRole("link", { name: shipped.reference })).toBeVisible();

  await page.getByRole("link", { name: "Shipped", exact: true }).click();
  await expect(page).toHaveURL(/status=shipped/);
  await expect(page.getByRole("link", { name: shipped.reference })).toBeVisible();
  await expect(page.getByRole("link", { name: paid.reference })).toHaveCount(0);
});

test("a paid order can be marked as shipped", async ({ page }) => {
  const order = await seedOrder();

  await page.goto(`/admin/orders/${order.id}`);
  await expect(page.getByRole("heading", { name: order.reference })).toBeVisible();
  await expect(page.getByText("1 Test Lane")).toBeVisible();

  await page.getByRole("button", { name: "Mark as shipped" }).click();
  await expect(page.getByText(`${order.reference} marked as shipped.`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as shipped" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel and refund" })).toHaveCount(0);

  const stored = (await testDb().collection("orders").doc(order.id).get()).data();
  expect(stored?.status).toBe("shipped");
  expect(stored?.shippedAt).toBeTruthy();
});

test("cancelling refunds the payment in Stripe and returns the stock", async ({ page }) => {
  test.skip(!process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY is not set");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // A real test-mode payment, confirmed with Stripe's built-in test payment method.
  const payment = await stripe.paymentIntents.create({
    amount: 4000,
    currency: "usd",
    payment_method: "pm_card_visa",
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { source: "bloom-e2e" },
  });
  expect(payment.status).toBe("succeeded");

  const productRef = testDb().collection("products").doc("tarrazu-honey");
  const stockBefore = ((await productRef.get()).data() as Product).variants.find(
    (variant) => variant.id === "250g-whole-bean",
  )!.stock;
  const order = await seedOrder({ paymentIntentId: payment.id });

  await page.goto(`/admin/orders/${order.id}`);
  await page.getByRole("button", { name: "Cancel and refund" }).click();
  await expect(page.getByText("Refund $40.00 and return the stock?")).toBeVisible();
  await page.getByRole("button", { name: "Yes, cancel and refund" }).click();

  await expect(page.getByText(`${order.reference} cancelled and refunded.`)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Cancelled and refunded")).toBeVisible();

  const stored = (await testDb().collection("orders").doc(order.id).get()).data();
  expect(stored?.status).toBe("cancelled");
  expect(stored?.refundId).toMatch(/^re_/);

  const stockAfter = ((await productRef.get()).data() as Product).variants.find(
    (variant) => variant.id === "250g-whole-bean",
  )!.stock;
  expect(stockAfter).toBe(stockBefore + 2);

  const refund = await stripe.refunds.retrieve(stored!.refundId);
  expect(refund.amount).toBe(4000);
  expect(refund.payment_intent).toBe(payment.id);
});
