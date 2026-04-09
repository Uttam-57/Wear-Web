import logger from '../../utils/logger.js';
import User from "./user.model.js";
import Address from "./address.model.js";
import AppError from '../../utils/appError.js';
import SellerProfile from "./sellerProfile.model.js";
import Product from '../product/product.model.js';
import Order from '../order/order.model.js';
import Payment from '../payment/payment.model.js';
import Wallet from '../wallet/wallet.model.js';
import Cart from '../cart/cart.model.js';
import Wishlist from '../wishlist/wishlist.model.js';
import Notification from '../notification/notification.model.js';
import PasswordReset from '../auth/passwordReset.model.js';
import { deleteFromCloudinary, uploadToCloudinary } from '../../config/cloudinary.js';
import { hideSellerProductsService, restoreSellerProductsService } from '../product/product.service.js';
import { createNotification } from '../../utils/notification.utils.js';
import { getPublicOrderId } from '../../utils/orderId.utils.js';
import {
  buildDeletedEmail,
  buildRandomPassword,
  extractCloudinaryPublicIdFromUrl,
  fetchJson,
  INDIA_COUNTRY,
  normalizeAddressPayload,
  resolveLocality,
  toDataUri,
} from './user.helpers.js';
const DEFAULT_PROFILE_AVATAR_URL = 'https://res.cloudinary.com/wearweb/image/upload/v1/wearweb/defaults/avatar.png';
const ACTIVE_SELLER_ORDER_STATUSES = ['placed', 'accepted', 'packed', 'shipped', 'out_for_delivery'];
const ACTIVE_CUSTOMER_ORDER_STATUSES = ['placed', 'accepted', 'packed', 'shipped', 'out_for_delivery'];
const ACTIVE_RETURN_FLOW_STATUSES = ['requested', 'accepted', 'picked', 'received'];

const cleanupSellerProfileProofs = async (sellerProfile) => {
  const proofUrls = Array.isArray(sellerProfile?.companyProof) ? sellerProfile.companyProof : [];
  await Promise.all(
    proofUrls.map(async (url) => {
      const publicId = extractCloudinaryPublicIdFromUrl(url);
      if (!publicId) return;

      try {
        await deleteFromCloudinary(publicId);
      } catch {
        // Keep deletion resilient even if external media cleanup fails.
      }
    })
  );
};

const purgeSellerProducts = async (sellerId) => {
  const products = await Product.find({ sellerId }).select('images colorImages').lean();

  for (const product of products) {
    const primaryImages = Array.isArray(product.images) ? product.images : [];
    for (const image of primaryImages) {
      if (!image?.publicId) continue;
      try {
        await deleteFromCloudinary(image.publicId);
      } catch {
        // Keep account deletion non-blocking for best-effort media cleanup.
      }
    }

    const groupedColorImages = Array.isArray(product.colorImages) ? product.colorImages : [];
    for (const colorEntry of groupedColorImages) {
      for (const image of colorEntry?.images || []) {
        if (!image?.publicId) continue;
        try {
          await deleteFromCloudinary(image.publicId);
        } catch {
          // Keep account deletion non-blocking for best-effort media cleanup.
        }
      }
    }
  }

  await Product.deleteMany({ sellerId });
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const getProfileService = async (userId) => {
  logger.info(`[SERVICE] getProfile → userId: ${userId}`);
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return user;
};

export const updateProfileService = async (userId, data) => {
  logger.info(`[SERVICE] updateProfile → userId: ${userId} | fields: ${Object.keys(data).join(", ")}`);
  if (data.profilePhoto) {
    const existing = await User.findById(userId).select("profilePhoto");
    if (existing?.profilePhoto?.publicId) {
      await deleteFromCloudinary(existing.profilePhoto.publicId);
    }
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { returnDocument: "after", runValidators: true }
  );
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return user;
};

export const uploadProfilePhotoService = async (userId, file) => {
  logger.info(`[SERVICE] uploadProfilePhoto → userId: ${userId}`);
  if (!file?.buffer) {
    throw new AppError("Profile photo file is required", 400, "VALIDATION_ERROR");
  }

  const existing = await User.findById(userId).select("profilePhoto");
  if (!existing) throw new AppError("User not found", 404, "NOT_FOUND");
  const previousPublicId = existing.profilePhoto?.publicId;

  const uploaded = await uploadToCloudinary(toDataUri(file), "profiles", {
    resource_type: "image",
  });

  existing.profilePhoto = {
    url: uploaded.url,
    publicId: uploaded.publicId,
  };

  await existing.save();

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await deleteFromCloudinary(previousPublicId);
  }

  return existing;
};

export const changePasswordService = async (userId, currentPassword, newPassword) => {
  logger.info(`[SERVICE] changePassword → userId: ${userId}`);
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 401, "UNAUTHORIZED");

  user.password = newPassword;
  await user.save();

  await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  logger.info(`[SERVICE] changePassword → password updated, all sessions cleared`);
};

export const deleteAccountService = async (userId, currentPassword) => {
  logger.info(`[SERVICE] deleteAccount → userId: ${userId}`);

  const user = await User.findById(userId).select('+password +refreshTokens');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  if (user.status === 'deleted') throw new AppError('Account is already deleted', 409, 'CONFLICT');
  if (user.role === 'admin') throw new AppError('Admin account deletion is not allowed', 403, 'FORBIDDEN');

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) throw new AppError('Current password is incorrect', 401, 'UNAUTHORIZED');

  if (user.role === 'seller') {
    // Freeze active listings immediately so no new order can be placed during the deletion flow.
    await hideSellerProductsService(userId, {
      source: 'account_deletion',
      code: 'ACCOUNT_DELETION_REQUEST',
      message: 'Product is on hold due to account deletion request',
    });

    const activeOrdersCount = await Order.countDocuments({
      sellerId: userId,
      $or: [
        { status: { $in: ACTIVE_SELLER_ORDER_STATUSES } },
        { 'returnRequest.status': { $in: ['requested', 'accepted', 'picked', 'received'] } },
      ],
    });

    if (activeOrdersCount > 0) {
      throw new AppError(
        'Account deletion is blocked. Complete all active seller orders first. Your products are on hold until then.',
        409,
        'SELLER_DELETION_BLOCKED'
      );
    }

    const wallet = await Wallet.findOne({ sellerId: userId }).lean();
    const currentBalance = Number(wallet?.balance || 0);
    if (currentBalance > 0) {
      throw new AppError('Wallet balance must be zero before account deletion', 409, 'WALLET_BALANCE_NOT_ZERO');
    }

    const sellerProfile = await SellerProfile.findOne({ userId }).lean();
    if (sellerProfile) {
      await cleanupSellerProfileProofs(sellerProfile);
      await SellerProfile.deleteOne({ userId });
    }

    await purgeSellerProducts(userId);
  }

  await Promise.all([
    Address.deleteMany({ userId }),
    Cart.deleteOne({ userId }),
    Wishlist.deleteOne({ userId }),
    Notification.deleteMany({ userId }),
    PasswordReset.deleteMany({ userId }),
  ]);

  if (user.profilePhoto?.publicId) {
    try {
      await deleteFromCloudinary(user.profilePhoto.publicId);
    } catch {
      // Profile media cleanup is best-effort.
    }
  }

  user.firstName = user.role === 'seller' ? 'Deleted' : 'Anonymous';
  user.lastName = user.role === 'seller' ? 'Seller' : 'Customer';
  user.middleName = null;
  user.email = buildDeletedEmail(user._id);
  user.phone = undefined;
  user.profilePhoto = {
    url: DEFAULT_PROFILE_AVATAR_URL,
    publicId: null,
  };
  user.password = buildRandomPassword();
  user.refreshTokens = [];
  user.status = 'deleted';
  user.deletedAt = new Date();
  user.deletionMeta = { requestedBy: 'self', reason: null };
  user.blockInfo = { reason: null, message: null, blockedAt: null };
  user.rejectionInfo = { reason: null, message: null, rejectedAt: null };
  await user.save();

  logger.info(`[SERVICE] deleteAccount → account minimized and disabled for userId: ${userId}`);
  return { role: user.role, deletedAt: user.deletedAt };
};

// ─── Address ─────────────────────────────────────────────────────────────────

export const addAddressService = async (userId, data) => {
  logger.info(`[SERVICE] addAddress → userId: ${userId}`);
  const count = await Address.countDocuments({ userId });
  if (count >= 5) throw new AppError("Maximum 5 addresses allowed", 400, "VALIDATION_ERROR");

  const address = await Address.create({ userId, ...normalizeAddressPayload(data) });
  logger.info(`[SERVICE] addAddress → created addressId: ${address._id}`);
  return address;
};

export const getAddressesService = async (userId) => {
  logger.info(`[SERVICE] getAddresses → userId: ${userId}`);
  return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

export const updateAddressService = async (userId, addressId, data) => {
  logger.info(`[SERVICE] updateAddress → userId: ${userId} | addressId: ${addressId}`);
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId },
    { $set: normalizeAddressPayload(data) },
    { returnDocument: "after", runValidators: true }
  );
  if (!address) throw new AppError("Address not found", 404, "NOT_FOUND");
  return address;
};

export const deleteAddressService = async (userId, addressId) => {
  logger.info(`[SERVICE] deleteAddress → userId: ${userId} | addressId: ${addressId}`);
  const address = await Address.findOneAndDelete({ _id: addressId, userId });
  if (!address) throw new AppError("Address not found", 404, "NOT_FOUND");
  logger.info(`[SERVICE] deleteAddress → deleted successfully`);
};

export const setDefaultAddressService = async (userId, addressId) => {
  logger.info(`[SERVICE] setDefaultAddress → userId: ${userId} | addressId: ${addressId}`);
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new AppError("Address not found", 404, "NOT_FOUND");

  await Address.updateMany({ userId }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();
  logger.info(`[SERVICE] setDefaultAddress → default updated successfully`);
  return address;
};

export const lookupAddressByPincodeService = async (pincode) => {
  logger.info(`[SERVICE] lookupAddressByPincode → pincode: ${pincode}`);
  const data = await fetchJson(`https://api.postalpincode.in/pincode/${pincode}`);

  const result = Array.isArray(data) ? data[0] : null;
  const postOffice = result?.PostOffice?.[0];

  if (result?.Status !== "Success" || !postOffice) {
    throw new AppError("Pincode not found", 404, "NOT_FOUND");
  }

  const state = (postOffice.State || "").trim();
  const locality = (
    postOffice.District ||
    postOffice.Name ||
    postOffice.Block ||
    postOffice.Division ||
    ""
  ).trim();

  if (!state || !locality) {
    throw new AppError("Unable to resolve state or locality for this pincode", 502, "BAD_GATEWAY");
  }

  return {
    pincode,
    state,
    locality,
    country: INDIA_COUNTRY,
  };
};

export const reverseGeocodeAddressService = async (lat, lon) => {
  logger.info(`[SERVICE] reverseGeocodeAddress → lat: ${lat} | lon: ${lon}`);
  const encodedLat = encodeURIComponent(lat);
  const encodedLon = encodeURIComponent(lon);

  const data = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodedLat}&lon=${encodedLon}`,
    {
      headers: {
        "User-Agent": "WearWeb/1.0",
      },
    }
  );

  const address = data?.address || {};
  const countryCode = String(address.country_code || "").toLowerCase();

  if (countryCode && countryCode !== "in") {
    throw new AppError("Current location is outside India", 400, "VALIDATION_ERROR");
  }

  const street = [address.road, address.neighbourhood, address.suburb]
    .filter(Boolean)
    .join(", ")
    .trim();
  const state = String(address.state || address.state_district || "").trim();
  const locality = resolveLocality(address);
  const pincode = String(address.postcode || "").replace(/\D/g, "").slice(0, 6);

  return {
    street,
    state,
    locality,
    pincode,
    country: INDIA_COUNTRY,
    latitude: Number(lat),
    longitude: Number(lon),
  };
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllUsersService = async (query) => {
  const { status, role, search, page, limit } = query;
  logger.info(`[SERVICE] getAllUsers → filters: ${JSON.stringify({ status, role, search })} | page: ${page}`);

  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("_id firstName middleName lastName email phone role status createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserByIdService = async (userId) => {
  logger.info(`[SERVICE] getUserById → userId: ${userId}`);
  const user = await User.findById(userId)
    .select(
      "_id firstName middleName lastName email phone role status profilePhoto blockInfo rejectionInfo createdAt updatedAt"
    )
    .lean();
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const orderFilter = user.role === 'seller'
    ? { sellerId: userId }
    : user.role === 'customer'
      ? { customerId: userId }
      : null;

  const orderDocs = orderFilter
    ? await Order.find(orderFilter).sort({ createdAt: -1 }).lean()
    : [];

  const purchaseIds = Array.from(
    new Set(
      orderDocs
        .map((order) => order?.purchaseId)
        .filter(Boolean)
        .map((value) => String(value))
    )
  );

  const paymentDocs = purchaseIds.length
    ? await Payment.find({ purchaseId: { $in: purchaseIds } })
      .select('purchaseId stripePaymentIntentId paymentMethod status amount createdAt')
      .sort({ createdAt: -1 })
      .lean()
    : [];

  const paymentByPurchaseId = new Map();
  paymentDocs.forEach((payment) => {
    const purchaseId = String(payment?.purchaseId || '');
    if (!purchaseId || paymentByPurchaseId.has(purchaseId)) return;
    paymentByPurchaseId.set(purchaseId, payment);
  });

  const orderHistory = orderDocs.map((order) => {
    const purchaseId = order?.purchaseId ? String(order.purchaseId) : '';
    const payment = purchaseId ? paymentByPurchaseId.get(purchaseId) : null;

    return {
      orderId: getPublicOrderId(order),
      paymentId: payment?.stripePaymentIntentId || null,
      paymentMethod: payment?.paymentMethod || null,
      paymentStatus: order?.paymentStatus || payment?.status || 'pending',
      amountPaid: Number(order?.totalAmount || 0),
      status: order?.status || 'placed',
      placedAt: order?.createdAt || null,
      deliveredAt: order?.deliveredAt || null,
      address: order?.addressSnapshot || null,
      items: Array.isArray(order?.items)
        ? order.items.map((item) => ({
            productName: item?.snapshot?.productName || 'Product',
            size: item?.snapshot?.size || null,
            colorName: item?.snapshot?.colorName || null,
            quantity: Number(item?.quantity || 0),
            subtotal: Number(item?.subtotal || 0),
          }))
        : [],
    };
  });

  let sellerProfile = null;
  if (user.role === 'seller' && user.status === 'active') {
    sellerProfile = await SellerProfile.findOne({ userId })
      .populate('majorCategories', 'name')
      .lean();
  }

  return {
    ...user,
    sellerProfile,
    orderHistory,
    summary: {
      totalOrders: orderHistory.length,
      totalAmountPaid: orderHistory.reduce((sum, order) => sum + Number(order?.amountPaid || 0), 0),
    },
  };
};

export const blockUserService = async (targetUserId, reason, message) => {
  logger.info(`[SERVICE] blockUser → targetUserId: ${targetUserId} | reason: ${reason}`);
  const user = await User.findById(targetUserId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.role === "admin") throw new AppError("Cannot block an admin account", 403, "FORBIDDEN");
  if (user.status === "blocked") throw new AppError("User is already blocked", 409, "CONFLICT");

  user.status = "blocked";
  user.blockInfo = { reason, message: message || null, blockedAt: new Date() };
  await user.save();

  // invalidate all sessions
  await User.findByIdAndUpdate(targetUserId, { $set: { refreshTokens: [] } });

  if (user.role === "seller") {
    await hideSellerProductsService(targetUserId, {
      source: 'account_block',
      code: 'ACCOUNT_BLOCKED',
      message: 'Product is on hold because seller account is blocked',
    });
  }
  logger.info(`[SERVICE] blockUser → user blocked and sessions cleared`);
};

export const adminDeleteUserService = async (targetUserId, reason) => {
  logger.info(`[SERVICE] adminDeleteUser → targetUserId: ${targetUserId}`);

  const user = await User.findById(targetUserId).select('+password +refreshTokens');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  if (user.role === 'admin') throw new AppError('Cannot delete an admin account', 403, 'FORBIDDEN');
  if (user.status === 'deleted') throw new AppError('Account is already deleted', 409, 'CONFLICT');

  if (user.role === 'seller') {
    await hideSellerProductsService(targetUserId, {
      source: 'account_deletion',
      code: 'ACCOUNT_DELETION_REQUEST',
      message: 'Products are on hold due to admin delete request until pending orders are completed',
    });
  }

  const pendingOrderFilter = user.role === 'seller'
    ? {
      sellerId: targetUserId,
      $or: [
        { status: { $in: ACTIVE_SELLER_ORDER_STATUSES } },
        { 'returnRequest.status': { $in: ACTIVE_RETURN_FLOW_STATUSES } },
      ],
    }
    : {
      customerId: targetUserId,
      $or: [
        { status: { $in: ACTIVE_CUSTOMER_ORDER_STATUSES } },
        { 'returnRequest.status': { $in: ACTIVE_RETURN_FLOW_STATUSES } },
      ],
    };

  const pendingOrdersCount = await Order.countDocuments(pendingOrderFilter);

  if (pendingOrdersCount > 0) {
    user.deletionMeta = { requestedBy: 'admin', reason: reason || null };
    await user.save();

    createNotification({
      userId: String(user._id),
      type: 'ACCOUNT_DELETION_PENDING',
      message: `Admin requested account deletion. Reason: ${reason}. Complete ${pendingOrdersCount} pending order(s)/return flow(s), then request final deletion.`,
      refId: String(user._id),
      refModel: null,
    });

    return {
      stage: 'pending_orders',
      pendingOrders: pendingOrdersCount,
      softDeleted: false,
    };
  }

  if (user.role === 'seller') {
    const wallet = await Wallet.findOne({ sellerId: targetUserId }).lean();
    const currentBalance = Number(wallet?.balance || 0);
    if (currentBalance > 0) {
      user.deletionMeta = { requestedBy: 'admin', reason: reason || null };
      await user.save();

      createNotification({
        userId: String(user._id),
        type: 'ACCOUNT_DELETION_PENDING',
        message: `Admin requested account deletion. Reason: ${reason}. Withdraw/settle wallet balance before final deletion.`,
        refId: String(user._id),
        refModel: null,
      });

      return {
        stage: 'wallet_pending',
        pendingOrders: 0,
        walletBalance: currentBalance,
        softDeleted: false,
      };
    }

    const sellerProfile = await SellerProfile.findOne({ userId: targetUserId }).lean();
    if (sellerProfile) {
      await cleanupSellerProfileProofs(sellerProfile);
      await SellerProfile.deleteOne({ userId: targetUserId });
    }

    await purgeSellerProducts(targetUserId);
  }

  await Promise.all([
    Address.deleteMany({ userId: targetUserId }),
    Cart.deleteOne({ userId: targetUserId }),
    Wishlist.deleteOne({ userId: targetUserId }),
    Notification.deleteMany({ userId: targetUserId }),
    PasswordReset.deleteMany({ userId: targetUserId }),
  ]);

  if (user.profilePhoto?.publicId) {
    try {
      await deleteFromCloudinary(user.profilePhoto.publicId);
    } catch {
      // Profile media cleanup is best-effort.
    }
  }

  user.firstName = user.role === 'seller' ? 'Deleted' : 'Anonymous';
  user.lastName = user.role === 'seller' ? 'Seller' : 'Customer';
  user.middleName = null;
  user.email = buildDeletedEmail(user._id);
  user.phone = undefined;
  user.profilePhoto = {
    url: DEFAULT_PROFILE_AVATAR_URL,
    publicId: null,
  };
  user.password = buildRandomPassword();
  user.refreshTokens = [];
  user.status = 'deleted';
  user.deletedAt = new Date();
  user.deletionMeta = { requestedBy: 'admin', reason: reason || null };
  user.blockInfo = { reason: null, message: null, blockedAt: null };
  user.rejectionInfo = { reason: null, message: null, rejectedAt: null };
  await user.save();

  logger.info(`[SERVICE] adminDeleteUser → account soft deleted for userId: ${targetUserId}`);
  return {
    stage: 'deleted',
    pendingOrders: 0,
    softDeleted: true,
    deletedAt: user.deletedAt,
  };
};

export const approveSellerService = async (sellerId) => {
  logger.info(`[SERVICE] approveSeller → sellerId: ${sellerId}`);
  const seller = await User.findById(sellerId);
  if (!seller) throw new AppError("Seller not found", 404, "NOT_FOUND");
  if (seller.role !== "seller") throw new AppError("User is not a seller", 400, "VALIDATION_ERROR");
  if (seller.status === "active") throw new AppError("Seller is already approved", 409, "CONFLICT");
  if (seller.status === "blocked") throw new AppError("Cannot approve a blocked seller", 403, "FORBIDDEN");

  seller.status = "active";
  seller.rejectionInfo = { reason: null, message: null, rejectedAt: null };
  await seller.save();

  createNotification({
    userId: seller._id.toString(),
    type: 'SELLER_APPROVED',
    message: 'Congratulations! Your seller account has been approved. You can now list products.',
    refId: seller._id.toString(),
    refModel: null,
  });

  logger.info(`[SERVICE] approveSeller → seller approved`);
};

export const rejectSellerService = async (sellerId, reason, message) => {
  logger.info(`[SERVICE] rejectSeller → sellerId: ${sellerId} | reason: ${reason}`);
  const seller = await User.findById(sellerId);
  if (!seller) throw new AppError("Seller not found", 404, "NOT_FOUND");
  if (seller.role !== "seller") throw new AppError("User is not a seller", 400, "VALIDATION_ERROR");
  if (seller.status === "blocked") throw new AppError("Cannot reject a blocked seller", 403, "FORBIDDEN");

  seller.status = "pending";
  seller.rejectionInfo = { reason, message: message || null, rejectedAt: new Date() };
  await seller.save();

  createNotification({
    userId: seller._id.toString(),
    type: 'SELLER_REJECTED',
    message: 'Your seller account application was not approved at this time.',
    refId: seller._id.toString(),
    refModel: null,
  });

  logger.info(`[SERVICE] rejectSeller → seller rejected`);
};

export const getPendingSellersService = async () => {
  logger.info(`[SERVICE] getPendingSellers`);
  return User.find({ role: "seller", status: "pending" })
    .select("_id firstName middleName lastName email phone role status createdAt")
    .sort({ createdAt: 1 }); // oldest first — fairness
};

export const unblockUserService = async (targetUserId) => {
  logger.info(`[SERVICE] unblockUser → targetUserId: ${targetUserId}`);
  const user = await User.findById(targetUserId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.status !== "blocked") throw new AppError("User is not blocked", 409, "CONFLICT");

  user.status = "active";
  user.blockInfo = { reason: null, message: null, blockedAt: null };
  await user.save();

  if (user.role === "seller") {
    await restoreSellerProductsService(targetUserId);
  }
  logger.info(`[SERVICE] unblockUser → user unblocked`);
};

// ─── Seller Profile ───────────────────────────────────────────────────────────

export const setupSellerProfileService = async (userId, data) => {
  logger.info(`[SERVICE] setupSellerProfile → userId: ${userId}`);

  const existing = await SellerProfile.findOne({ userId });
  if (existing) throw new AppError("Seller profile already exists. Use update instead.", 409, "CONFLICT");

  const profile = await SellerProfile.create({ userId, ...data });
  logger.info(`[SERVICE] setupSellerProfile → created profileId: ${profile._id} | complete: ${profile.profileComplete}`);
  return profile;
};

export const getSellerProfileService = async (userId) => {
  logger.info(`[SERVICE] getSellerProfile → userId: ${userId}`);
  const profile = await SellerProfile.findOne({ userId }).populate("majorCategories", "_id name slug");
  if (!profile) throw new AppError("Seller profile not found", 404, "NOT_FOUND");
  return profile;
};

export const updateSellerProfileService = async (userId, data) => {
  logger.info(`[SERVICE] updateSellerProfile → userId: ${userId} | fields: ${Object.keys(data).join(", ")}`);

  const profile = await SellerProfile.findOne({ userId });
  if (!profile) throw new AppError("Seller profile not found. Complete setup first.", 404, "NOT_FOUND");

  Object.assign(profile, data);
  await profile.save(); // pre-save hook recomputes profileComplete
  logger.info(`[SERVICE] updateSellerProfile → updated | complete: ${profile.profileComplete}`);
  return profile;
};