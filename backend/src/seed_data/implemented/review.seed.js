import Order from '../../modules/order/order.model.js';
import Product from '../../modules/product/product.model.js';
import Review from '../../modules/review/review.model.js';
import {
  TITLES,
  BODIES,
  SELLER_RESPONSES,
  RATING_PATTERN,
} from '../data/review/reviewSeed.data.js';

const roundToSingleDecimal = (value) => Math.round(value * 10) / 10;

export const seedReviews = async ({ clearExisting = true } = {}) => {
  if (clearExisting) {
    console.log('Clearing old reviews...');
    await Review.deleteMany({});
  }

  const deliveredOrders = await Order.find({ status: 'delivered' })
    .select('_id customerId sellerId items deliveredAt updatedAt createdAt')
    .sort({ createdAt: 1 })
    .lean();

  if (deliveredOrders.length === 0) {
    console.log('No delivered orders found. Skipping review seed.');
    return {
      reviewCount: 0,
      productsRated: 0,
    };
  }

  const reviewDocs = [];

  deliveredOrders.forEach((order, index) => {
    const item = Array.isArray(order.items) ? order.items[0] : null;
    if (!item?.productId) return;

    const baseTime = order.deliveredAt || order.updatedAt || order.createdAt || new Date();
    const createdAt = new Date(new Date(baseTime).getTime() + (index % 6) * 60 * 60 * 1000);
    const rating = RATING_PATTERN[index % RATING_PATTERN.length];

    const reviewDoc = {
      productId: item.productId,
      customerId: order.customerId,
      orderId: order._id,
      sellerId: item.sellerId || order.sellerId,
      rating,
      title: TITLES[index % TITLES.length],
      body: BODIES[index % BODIES.length],
      images: [],
      createdAt,
      updatedAt: createdAt,
    };

    if (index % 3 === 0) {
      reviewDoc.sellerResponse = {
        text: SELLER_RESPONSES[index % SELLER_RESPONSES.length],
        createdAt: new Date(createdAt.getTime() + 8 * 60 * 60 * 1000),
      };
    }

    reviewDocs.push(reviewDoc);
  });

  if (reviewDocs.length === 0) {
    return {
      reviewCount: 0,
      productsRated: 0,
    };
  }

  await Review.insertMany(reviewDocs, { ordered: false });

  const productRatings = await Review.aggregate([
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (productRatings.length > 0) {
    await Product.bulkWrite(
      productRatings.map((row) => ({
        updateOne: {
          filter: { _id: row._id },
          update: {
            avgRating: roundToSingleDecimal(row.averageRating),
            totalReviews: row.totalReviews,
          },
        },
      }))
    );
  }

  console.log(`Seeded ${reviewDocs.length} reviews across ${productRatings.length} products.`);
  return {
    reviewCount: reviewDocs.length,
    productsRated: productRatings.length,
  };
};

export default seedReviews;