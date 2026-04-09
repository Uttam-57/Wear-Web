import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { uploadSingleImage } from "../../middlewares/upload.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  addAddressSchema,
  updateAddressSchema,
  addressPincodeLookupSchema,
  addressReverseGeocodeSchema,
  blockUserSchema,
  adminDeleteUserSchema,
  rejectSellerSchema,
  adminUsersQuerySchema,
  setupSellerProfileSchema,
  updateSellerProfileSchema,
} from "./user.validation.js";
import {
  getProfile,
  updateProfile,
  deleteAccount,
  uploadProfilePhoto,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  lookupAddressByPincode,
  reverseGeocodeAddress,
  getAllUsers,
  getUserById,
  blockUser,
  adminDeleteUser,
  approveSeller,
  rejectSeller,
  getPendingSellers,
  setupSellerProfile,
  getSellerProfile,
  updateSellerProfile,
  unblockUser,
} from "./user.controller.js";

const router = express.Router();

router.use(authenticate);

// ─── Profile ─────────────────────────────────────────────────────────────────
router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.delete("/account", validate(deleteAccountSchema), deleteAccount);
router.post("/profile/photo", uploadSingleImage("photo"), uploadProfilePhoto);
router.put("/change-password", validate(changePasswordSchema), changePassword);

// ─── Address ─────────────────────────────────────────────────────────────────
router.post("/addresses", validate(addAddressSchema), addAddress);
router.get("/addresses", getAddresses);
router.get("/addresses/lookup/pincode/:pincode", validate(addressPincodeLookupSchema, "params"), lookupAddressByPincode);
router.get("/addresses/lookup/reverse-geocode", validate(addressReverseGeocodeSchema, "query"), reverseGeocodeAddress);
router.put("/addresses/:id", validate(updateAddressSchema), updateAddress);
router.delete("/addresses/:id", deleteAddress);
router.put("/addresses/:id/default", setDefaultAddress);

// ─── Admin: User Management ───────────────────────────────────────────────────
router.get("/admin/users", authorize("admin"), validate(adminUsersQuerySchema, "query"), getAllUsers);
router.get("/admin/users/:id", authorize("admin"), getUserById);
router.put("/admin/users/:id/block", authorize("admin"), validate(blockUserSchema), blockUser);
router.put("/admin/users/:id/delete", authorize("admin"), validate(adminDeleteUserSchema), adminDeleteUser);

// ─── Admin: Seller Management ─────────────────────────────────────────────────
router.get("/admin/sellers/pending", authorize("admin"), getPendingSellers);
router.put("/admin/sellers/:id/approve", authorize("admin"), approveSeller);
router.put("/admin/sellers/:id/reject", authorize("admin"), validate(rejectSellerSchema), rejectSeller);
router.put("/admin/users/:id/unblock", authorize("admin"), unblockUser);

// ─── Seller Profile ───────────────────────────────────────────────────────────
router.post("/seller/profile/setup", authorize("seller"), validate(setupSellerProfileSchema), setupSellerProfile);
router.get("/seller/profile", authorize("seller"), getSellerProfile);
router.put("/seller/profile", authorize("seller"), validate(updateSellerProfileSchema), updateSellerProfile);
export default router;