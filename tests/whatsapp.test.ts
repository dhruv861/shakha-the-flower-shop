import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPrice } from "../src/lib/money";
import { cartEnquiry, formatPhone, orderMessage, productEnquiry, waLink, waNumber } from "../src/lib/whatsapp";

describe("formatPrice", () => {
  it("writes whole rupees with Indian digit grouping", () => {
    assert.equal(formatPrice(999), "₹999");
    assert.equal(formatPrice(1499), "₹1,499");
    assert.equal(formatPrice(150000), "₹1,50,000");
  });
});

describe("phone helpers", () => {
  it("adds India's code for wa.me links", () => {
    assert.equal(waNumber("98765 43210"), "919876543210");
    assert.equal(waNumber("919876543210"), "919876543210");
  });

  it("formats a stored number for display", () => {
    assert.equal(formatPhone("9876543210"), "+91 98765 43210");
  });

  it("encodes the message into the link", () => {
    assert.equal(waLink("917046022020", "Hi & bye"), "https://wa.me/917046022020?text=Hi%20%26%20bye");
  });
});

describe("orderMessage", () => {
  const order = {
    number: "SH1001",
    fulfillment: "delivery" as const,
    deliveryDate: "2026-10-02",
    deliverySlot: "2 PM – 6 PM",
    area: "Vesu",
    pickupBranch: null,
    total: 2097,
    deliveryFee: 99,
  };

  it("lists the items, when and where, and the total", () => {
    const text = orderMessage(
      order,
      [
        { productName: "Pink Rose Bouquet", variantName: "Deluxe", quantity: 1 },
        { productName: "Teddy bear", variantName: "Standard", quantity: 2 },
      ],
      "https://example.com/order/abc",
    );
    assert.match(text, /order SH1001/);
    assert.match(text, /• 1 × Pink Rose Bouquet \(Deluxe\)\n/);
    assert.match(text, /• 2 × Teddy bear\n/);
    assert.match(text, /Delivery to Vesu: Friday, 2 October, 2 PM – 6 PM/);
    assert.match(text, /Total: ₹2,097\n/);
    assert.match(text, /Order details: https:\/\/example\.com\/order\/abc$/);
  });

  it("says delivery is extra when the charge isn't published", () => {
    assert.match(orderMessage({ ...order, deliveryFee: null, total: 1998 }, [], "u"), /Total: ₹1,998 \+ delivery/);
  });

  it("names the studio for pickups", () => {
    const text = orderMessage({ ...order, fulfillment: "pickup", pickupBranch: "dumas", area: null }, [], "u");
    assert.match(text, /Pickup from Dumas: Friday, 2 October/);
  });
});

describe("productEnquiry", () => {
  const rose = { name: "Pink Rose Bouquet", variantName: "Deluxe", quantity: 2, unitPrice: 1999 };

  it("carries the size, quantity, add-ons, total and page link", () => {
    const text = productEnquiry(
      rose,
      [{ name: "Mini teddy", variantName: "Standard", quantity: 1, unitPrice: 399 }],
      "https://shop.example/shop/pink-rose-bouquet",
    );
    assert.equal(
      text,
      [
        "Hi Shakha! I have a question about this:",
        "",
        "• 2 × Pink Rose Bouquet (Deluxe): ₹3,998",
        "• 1 × Mini teddy: ₹399",
        "Total: ₹4,397",
        "",
        "https://shop.example/shop/pink-rose-bouquet",
      ].join("\n"),
    );
  });

  it("keeps it to one line for a single item, without the Standard size", () => {
    const text = productEnquiry({ name: "The Litchi Bouquet", variantName: "Standard", quantity: 1, unitPrice: 1999 }, []);
    assert.equal(text, "Hi Shakha! I have a question about this:\n\n• 1 × The Litchi Bouquet: ₹1,999");
  });
});

describe("cartEnquiry", () => {
  it("lists every cart line and the subtotal", () => {
    const text = cartEnquiry(
      [
        { name: "The Litchi Bouquet", variantName: "Standard", quantity: 1, unitPrice: 1999 },
        { name: "Orchid Bouquet", variantName: "Classic", quantity: 2, unitPrice: 1999 },
      ],
      5997,
    );
    assert.equal(
      text,
      [
        "Hi Shakha! I have a question about my cart:",
        "",
        "• 1 × The Litchi Bouquet: ₹1,999",
        "• 2 × Orchid Bouquet (Classic): ₹3,998",
        "Subtotal: ₹5,997",
      ].join("\n"),
    );
  });
});
