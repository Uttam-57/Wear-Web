const toObjectIdHex = (value) => {
  if (!value || typeof value !== 'object') return '';

  if (typeof value.toHexString === 'function') {
    try {
      return String(value.toHexString()).trim();
    } catch {
      return '';
    }
  }

  if (value?._bsontype === 'ObjectId' && typeof value.toString === 'function') {
    try {
      return String(value.toString()).trim();
    } catch {
      return '';
    }
  }

  return '';
};

export const getPublicOrderId = (orderOrId) => {
  if (!orderOrId) return 'ORD-000000';

  if (typeof orderOrId === 'object') {
    const explicitOrderNumber = String(orderOrId.orderNumber || '').trim();
    if (explicitOrderNumber) return explicitOrderNumber;

    const objectHex = toObjectIdHex(orderOrId);
    if (objectHex) return getPublicOrderId(objectHex);

    const nestedId = orderOrId._id ?? orderOrId.id ?? orderOrId.orderId;
    if (nestedId && nestedId !== orderOrId) {
      return getPublicOrderId(nestedId);
    }
  }

  const raw = String(orderOrId).trim();
  if (!raw) return 'ORD-000000';
  if (/^\[object\s.+\]$/i.test(raw)) return 'ORD-000000';

  const upperRaw = raw.toUpperCase();
  if (/^ORD-[A-Z0-9]+$/.test(upperRaw)) return upperRaw;

  const normalized = upperRaw.replace(/[^A-Z0-9]/g, '');
  const suffix = normalized.slice(-6).padStart(6, '0');
  return `ORD-${suffix}`;
};
