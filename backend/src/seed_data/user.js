import User from '../modules/user/user.model.js';
import SellerProfile from '../modules/user/sellerProfile.model.js';
import Address from '../modules/user/address.model.js';

const DEFAULT_PASSWORD = 'Password@123';
const USER_IMAGE = {
  url: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=80',
  publicId: null,
};

export const seedUsers = async ({
  clearExisting = true,
  customerCount = 10,
  sellerCount = 50,
} = {}) => {
  if (clearExisting) {
    console.log('Clearing old users, seller profiles, and addresses...');
    await Promise.all([
      Address.deleteMany({}),
      SellerProfile.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  const admin = await User.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@gmail.com',
    phone: '+919999999999',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    status: 'active',
    profilePhoto: USER_IMAGE,
  });

  const indianCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];
  const indianStates = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Maharashtra', 'Rajasthan'];
  const customerDocs = [];
  const customerAddressDocs = [];

  for (let i = 1; i <= customerCount; i++) {
    const customer = await User.create({
      firstName: 'Customer',
      lastName: `${i}`,
      email: `customer${i}@gmail.com`,
      phone: `+9198765000${i.toString().padStart(2, '0')}`,
      password: DEFAULT_PASSWORD,
      role: 'customer',
      status: 'active',
      profilePhoto: USER_IMAGE,
    });

    customerDocs.push(customer);
    customerAddressDocs.push({
      userId: customer._id,
      isDefault: true,
      label: 'home',
      fullName: `Customer ${i} Kumar`,
      phone: customer.phone,
      street: `Flat ${i}0${i}, Residency Road, Phase ${i}`,
      city: indianCities[(i - 1) % indianCities.length],
      district: indianCities[(i - 1) % indianCities.length],
      state: indianStates[(i - 1) % indianStates.length],
      pincode: `4000${i.toString().padStart(2, '0')}`,
      country: 'India',
    });
  }

  if (customerAddressDocs.length > 0) {
    await Address.insertMany(customerAddressDocs);
  }

  const sellerDocs = [];
  for (let i = 1; i <= sellerCount; i++) {
    const seller = await User.create({
      firstName: 'Seller',
      lastName: `${i}`,
      email: `seller${i}@gmail.com`,
      phone: `+9188765000${i.toString().padStart(2, '0')}`,
      password: DEFAULT_PASSWORD,
      role: 'seller',
      status: 'active',
      profilePhoto: USER_IMAGE,
    });
    sellerDocs.push(seller);
  }

  if (sellerDocs.length > 0) {
    const sellerProfiles = sellerDocs.map((seller, index) => {
      const i = index + 1;
      return {
        userId: seller._id,
        companyName: `Retailer Network ${i} Pvt Ltd`,
        ownerName: `Seller ${i} Sharma`,
        companyEmail: `contact@retailer${i}.in`,
        companyPhone: seller.phone,
        location: {
          country: 'India',
          state: 'Delhi',
          district: 'Central Delhi',
          addressLine: `Shop ${i}, Wholesale Market, Delhi`,
        },
        bankDetails: {
          accountHolderName: `Seller ${i} Sharma`,
          accountNumber: `9876543210${i}`,
          ifscCode: 'SBIN0001234',
        },
        gstNumber: `27ABCDE1234F1Z${(i % 9) + 1}`,
        companyProof: ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'],
        profileComplete: true,
      };
    });

    await SellerProfile.insertMany(sellerProfiles);
  }

  const summary = {
    admin: 1,
    customers: customerDocs.length,
    sellers: sellerDocs.length,
    addresses: customerAddressDocs.length,
    sellerProfiles: sellerDocs.length,
  };

  console.log(`Seeded users -> admin: ${summary.admin}, customers: ${summary.customers}, sellers: ${summary.sellers}`);
  return {
    summary,
    admin,
    customers: customerDocs,
    sellers: sellerDocs,
  };
};

export default seedUsers;