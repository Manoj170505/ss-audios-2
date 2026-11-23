import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACADEMY_COURSES,
  BUSINESS_CONTACT,
  DEFAULT_DJ_PACKAGES,
  MAX_VIDEO_FILE_BYTES,
  RAGA_STUDIO_SERVICES,
  SIGNATURE_SERVICES,
  STORAGE_QUOTA_BYTES,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  computeStorageStats,
  createDefaultPortfolioCategories,
  createDefaultSectionVisibility,
  createInitialEnquiryDraft,
  formatPrice,
  formatRupeeUnitLabel,
  getDjPackagePrice,
  getServiceOptionsForCategory,
  getVisibleItems,
  getVisiblePortfolioCategories,
  validateEnquiryForm,
} from './domain';

test('default portfolio creates exactly 7 categories and 70 editable slots', () => {
  const categories = createDefaultPortfolioCategories();
  assert.equal(categories.length, 7);

  const totalSlots = categories.reduce((sum, cat) => sum + cat.slots.length, 0);
  assert.equal(totalSlots, 70);

  for (const cat of categories) {
    assert.equal(cat.slots.length, 10, `Category ${cat.name} must have 10 slots`);
    assert.equal(cat.hidden, false);
    for (const slot of cat.slots) {
      assert.equal(slot.status, 'awaiting');
      assert.equal(slot.videoUrl, null);
      assert.equal(slot.hidden, false);
    }
  }

  const allTags = new Set(categories.flatMap((c) => c.slots.map((s) => s.archiveTag)));
  for (const requiredTag of [
    'Drums',
    'Event performances',
    'DJ',
    'Welcome performances',
    'Bride & Groom Welcome',
    'Goldstar',
    'Mulanur',
    'Modakurichi',
    'Hall Decoration',
    'Corporate Events',
    'Nandha Colleges',
    'Stage Decoration',
    'BG Visuals',
    'Stage Lighting',
    'Pathway Lighting',
    'Wedding Entry',
  ]) {
    assert.equal(allTags.has(requiredTag), true, `Missing archive tag: ${requiredTag}`);
  }
});

test('DJ packages default to requested rupee amounts and format cleanly', () => {
  const prices = DEFAULT_DJ_PACKAGES.map((p) => getDjPackagePrice(p, 'INR'));
  assert.deepEqual(prices, [199, 399, 699, 1299, 2499]);
  assert.equal(formatPrice(1299, 'INR'), '₹1,299');
  assert.equal(formatPrice(25000, 'INR'), '₹25,000');
  assert.equal(formatPrice(2499, 'USD'), '$2,499');
  assert.equal(formatRupeeUnitLabel(3500, 'month'), '₹3,500/month');
  assert.equal(formatRupeeUnitLabel(15000, undefined, 'onwards'), '₹15,000 onwards');
});

test('category-wise and item-level hide/show filters work accurately', () => {
  const categories = createDefaultPortfolioCategories();
  categories[0].hidden = true;
  categories[1].slots[0].hidden = true;
  categories[1].slots[1].hidden = true;

  const visible = getVisiblePortfolioCategories(categories);
  assert.equal(visible.length, 6);
  assert.equal(visible.some((c) => c.id === categories[0].id), false);
  const secondCat = visible.find((c) => c.id === categories[1].id);
  assert.ok(secondCat);
  assert.equal(secondCat.slots.length, 8);

  // Hiding every slot in a category also hides the empty category from public view
  categories[2].slots.forEach((s) => {
    s.hidden = true;
  });
  const visibleAfterAllSlotsHidden = getVisiblePortfolioCategories(categories);
  assert.equal(visibleAfterAllSlotsHidden.length, 5);

  const sections = createDefaultSectionVisibility();
  assert.deepEqual(sections, {
    services: true,
    portfolio: true,
    djPackages: true,
    ragaStudio: true,
    sampoornaAcademy: true,
  });

  const editedServices = SIGNATURE_SERVICES.map((s, idx) =>
    idx === 0 ? { ...s, startingPrice: 28000, priceLabel: '₹28,000' } : idx === 1 ? { ...s, hidden: true } : s,
  );
  assert.equal(getVisibleItems(editedServices).length, SIGNATURE_SERVICES.length - 1);
  const eventOpts = getServiceOptionsForCategory(
    'SS Audios – Event & Entertainment',
    DEFAULT_DJ_PACKAGES,
    'INR',
    editedServices,
    RAGA_STUDIO_SERVICES,
    ACADEMY_COURSES,
  );
  assert.equal(eventOpts.length, SIGNATURE_SERVICES.length - 1);
  assert.equal(eventOpts[0], 'Wedding Events (₹28,000)');
});

test('enquiry form validation enforces name, valid phone, and optional email format', () => {
  const empty = createInitialEnquiryDraft();
  const emptyErrors = validateEnquiryForm(empty);
  assert.ok(emptyErrors.fullName);
  assert.ok(emptyErrors.mobile);

  const badPhone = { ...empty, fullName: 'Karthik Rajan', mobile: '12345', email: 'not-an-email' };
  const badErrors = validateEnquiryForm(badPhone);
  assert.equal(badErrors.fullName, undefined);
  assert.ok(badErrors.mobile);
  assert.ok(badErrors.email);

  const valid = {
    ...empty,
    fullName: 'Karthik Rajan',
    mobile: '+91 98765 43210',
    email: 'karthik@example.com',
  };
  assert.deepEqual(validateEnquiryForm(valid), {});
});

test('WhatsApp message & URL include complete customer and category-specific details', () => {
  const eventDraft = {
    ...createInitialEnquiryDraft(),
    fullName: 'Priya Dharshini',
    mobile: '+91 98422 11223',
    email: 'priya@example.com',
    category: 'DJ Event Packages' as const,
    service: 'Standard Package (₹699 / event)',
    date: '2026-12-18',
    time: '07:00 PM',
    venue: 'Kongu Kalai Arangam, Erode',
    audience: '450 Guests',
    budget: '₹50,000',
    additionalRequirements: 'Need wireless mics and custom Tamil remix set.',
  };

  const message = buildWhatsAppMessage(eventDraft);
  assert.match(message, /Hello SS Audios!/);
  assert.match(message, /Name: Priya Dharshini/);
  assert.match(message, /Mobile: \+91 98422 11223/);
  assert.match(message, /Business Category: DJ Event Packages/);
  assert.match(message, /Service: Standard Package \(₹699 \/ event\)/);
  assert.match(message, /Venue: Kongu Kalai Arangam, Erode/);
  assert.match(message, /Need wireless mics and custom Tamil remix set\./);

  const url = buildWhatsAppUrl(eventDraft);
  assert.ok(url.startsWith(`${BUSINESS_CONTACT.whatsappBase}?text=`));
  assert.equal(decodeURIComponent(url.split('?text=')[1]), message);

  const academyDraft = {
    ...createInitialEnquiryDraft(),
    fullName: 'Arjun',
    mobile: '9876543210',
    category: 'Sampoorna Music Academy' as const,
    service: 'Flute & Bansuri (₹3,000/month)',
    preferredBatch: 'Weekday Evening',
    learningLevel: 'Intermediate',
  };
  const academyMessage = buildWhatsAppMessage(academyDraft);
  assert.match(academyMessage, /Preferred Batch: Weekday Evening/);
  assert.match(academyMessage, /Learning Level: Intermediate/);
});

test('storage stats calculate quota, published count, and limits accurately', () => {
  const categories = createDefaultPortfolioCategories();
  categories[0].slots[0].status = 'published';
  categories[0].slots[0].videoUrl = '/api/media/wedding-events-slot-01/demo.mp4';
  categories[0].slots[0].fileSizeBytes = 1024 * 1024 * 512; // 512 MiB

  const stats = computeStorageStats(categories);
  assert.equal(stats.totalSlots, 70);
  assert.equal(stats.publishedCount, 1);
  assert.equal(stats.quotaBytes, STORAGE_QUOTA_BYTES);
  assert.equal(stats.maxFileBytes, MAX_VIDEO_FILE_BYTES);
  assert.equal(stats.usedBytes, 512 * 1024 * 1024);
  assert.equal(stats.remainingBytes, STORAGE_QUOTA_BYTES - 512 * 1024 * 1024);
  assert.ok(Math.abs(stats.usedPercent - 10) < 0.01);
});
