import logger from '../../utils/logger.js';
import {
  getProfileService,
  updateProfileService,
  uploadProfilePhotoService,
  changePasswordService,
  addAddressService,
  getAddressesService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
  lookupAddressByPincodeService,
  reverseGeocodeAddressService,
  getAllUsersService,
  getUserByIdService,
  blockUserService,
  adminDeleteUserService,
  approveSellerService,
  rejectSellerService,
  getPendingSellersService,
  setupSellerProfileService,
  getSellerProfileService,
  updateSellerProfileService,
  unblockUserService,
  deleteAccountService,
} from "./user.service.js";

// ─── Profile ─────────────────────────────────────────────────────────────────

export const getProfile = async (req, res, next) => {
  try {
    logger.info(`[USER] GET /profile → userId: ${req.user.userId}`);
    const user = await getProfileService(req.user.userId);
    res.status(200).json({
      success: true,
      message: "Profile fetched",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    logger.info(`[USER] PUT /profile → userId: ${req.user.userId}`);
    const user = await updateProfileService(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    logger.info(`[USER] PUT /change-password → userId: ${req.user.userId}`);
    await changePasswordService(req.user.userId, req.body.currentPassword, req.body.newPassword);
    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Password changed. Please login again.",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    logger.info(`[USER] DELETE /account → userId: ${req.user.userId}`);
    const result = await deleteAccountService(req.user.userId, req.body.currentPassword);
    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Address ─────────────────────────────────────────────────────────────────

export const addAddress = async (req, res, next) => {
  try {
    logger.info(`[USER] POST /addresses → userId: ${req.user.userId}`);
    const address = await addAddressService(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Address added",
      data: { address },
    });
  } catch (err) {
    next(err);
  }
};

export const getAddresses = async (req, res, next) => {
  try {
    logger.info(`[USER] GET /addresses → userId: ${req.user.userId}`);
    const addresses = await getAddressesService(req.user.userId);
    res.status(200).json({
      success: true,
      message: "Addresses fetched",
      data: { addresses },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    logger.info(`[USER] PUT /addresses/${req.params.id} → userId: ${req.user.userId}`);
    const address = await updateAddressService(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Address updated",
      data: { address },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    logger.info(`[USER] DELETE /addresses/${req.params.id} → userId: ${req.user.userId}`);
    await deleteAddressService(req.user.userId, req.params.id);
    res.status(200).json({
      success: true,
      message: "Address deleted",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    logger.info(`[USER] PUT /addresses/${req.params.id}/default → userId: ${req.user.userId}`);
    const address = await setDefaultAddressService(req.user.userId, req.params.id);
    res.status(200).json({
      success: true,
      message: "Default address updated",
      data: { address },
    });
  } catch (err) {
    next(err);
  }
};

export const lookupAddressByPincode = async (req, res, next) => {
  try {
    logger.info(`[USER] GET /addresses/lookup/pincode/${req.parsedQuery.pincode} → userId: ${req.user.userId}`);
    const lookup = await lookupAddressByPincodeService(req.parsedQuery.pincode);
    res.status(200).json({
      success: true,
      message: "Address lookup fetched",
      data: { lookup },
    });
  } catch (err) {
    next(err);
  }
};

export const reverseGeocodeAddress = async (req, res, next) => {
  const { lat, lon } = req.parsedQuery;
  try {
    logger.info(`[USER] GET /addresses/lookup/reverse-geocode?lat=${lat}&lon=${lon} → userId: ${req.user.userId}`);
    const lookup = await reverseGeocodeAddressService(lat, lon);
    res.status(200).json({
      success: true,
      message: "Address lookup fetched",
      data: { lookup },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllUsers = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] GET /admin/users → adminId: ${req.user.userId}`);
    const result = await getAllUsersService(req.parsedQuery);
    res.status(200).json({
      success: true,
      message: "Users fetched",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] GET /admin/users/${req.params.id} → adminId: ${req.user.userId}`);
    const user = await getUserByIdService(req.params.id);
    res.status(200).json({
      success: true,
      message: "User fetched",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] PUT /admin/users/${req.params.id}/block → adminId: ${req.user.userId}`);
    await blockUserService(req.params.id, req.body.reason, req.body.message);
    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const approveSeller = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] PUT /admin/sellers/${req.params.id}/approve → adminId: ${req.user.userId}`);
    await approveSellerService(req.params.id);
    res.status(200).json({
      success: true,
      message: "Seller approved successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectSeller = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] PUT /admin/sellers/${req.params.id}/reject → adminId: ${req.user.userId}`);
    await rejectSellerService(req.params.id, req.body.reason, req.body.message);
    res.status(200).json({
      success: true,
      message: "Seller rejected",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingSellers = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] GET /admin/sellers/pending → adminId: ${req.user.userId}`);
    const sellers = await getPendingSellersService();
    res.status(200).json({
      success: true,
      message: "Pending sellers fetched",
      data: { sellers },
    });
  } catch (err) {
    next(err);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] PUT /admin/users/${req.params.id}/unblock → adminId: ${req.user.userId}`);
    await unblockUserService(req.params.id);
    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
// ─── Seller Profile ───────────────────────────────────────────────────────────

export const setupSellerProfile = async (req, res, next) => {
  try {
    logger.info(`[SELLER] POST /seller/profile/setup → userId: ${req.user.userId}`);
    const profile = await setupSellerProfileService(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Seller profile created",
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerProfile = async (req, res, next) => {
  try {
    logger.info(`[SELLER] GET /seller/profile → userId: ${req.user.userId}`);
    const profile = await getSellerProfileService(req.user.userId);
    res.status(200).json({
      success: true,
      message: "Seller profile fetched",
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

export const updateSellerProfile = async (req, res, next) => {
  try {
    logger.info(`[SELLER] PUT /seller/profile → userId: ${req.user.userId}`);
    const profile = await updateSellerProfileService(req.user.userId, req.body);
    res.status(200).json({
      success: true,
      message: "Seller profile updated",
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadProfilePhoto = async (req, res, next) => {
  try {
    logger.info(`[USER] POST /profile/photo → userId: ${req.user.userId}`);
    const user = await uploadProfilePhotoService(req.user.userId, req.file);
    res.status(200).json({
      success: true,
      message: "Profile photo uploaded",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const adminDeleteUser = async (req, res, next) => {
  try {
    logger.info(`[ADMIN] PUT /admin/users/${req.params.id}/delete → adminId: ${req.user.userId}`);
    const result = await adminDeleteUserService(req.params.id, req.body.reason);
    res.status(200).json({
      success: true,
      message: 'Delete workflow processed',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};