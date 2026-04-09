import { getPublicOrderId } from '../../utils/orderId.utils.js';

describe('Order ID Utils', () => {
  it('returns default id for empty values', () => {
    expect(getPublicOrderId(null)).toBe('ORD-000000');
    expect(getPublicOrderId('')).toBe('ORD-000000');
  });

  it('preserves explicit order number from order object', () => {
    expect(getPublicOrderId({ orderNumber: 'ORD-ABC123' })).toBe('ORD-ABC123');
  });

  it('formats object id like values via toHexString', () => {
    const objectIdLike = {
      toHexString() {
        return '507f1f77bcf86cd799439011';
      }
    };

    expect(getPublicOrderId(objectIdLike)).toBe('ORD-439011');
  });

  it('does not recurse infinitely on cyclic objects', () => {
    const cyclic = {};
    cyclic._id = cyclic;

    expect(getPublicOrderId(cyclic)).toBe('ORD-000000');
  });
});
