const SHIRT_SPECS = [
  { label: 'Material', key: 'material', filterOptions: ['Cotton', 'Cotton Blend', 'Linen', 'Denim', 'Viscose'] },
  { label: 'Pattern', key: 'pattern', filterOptions: ['Solid', 'Checked', 'Striped', 'Printed'] },
  { label: 'Fit', key: 'fit', filterOptions: ['Slim', 'Regular', 'Relaxed'] },
  { label: 'Occasion', key: 'occasion', filterOptions: ['Casual', 'Formal', 'Party', 'Daily Wear'] },
  { label: 'Sleeve', key: 'sleeve', filterOptions: ['Full Sleeve', 'Half Sleeve'] },
  { label: 'Collar', key: 'collar', filterOptions: ['Spread', 'Button Down', 'Mandarin', 'Cutaway'] },
];

const TSHIRT_SPECS = [
  { label: 'Material', key: 'material', filterOptions: ['Cotton', 'Cotton Blend', 'Polyester'] },
  { label: 'Pattern', key: 'pattern', filterOptions: ['Solid', 'Graphic', 'Printed', 'Color Block'] },
  { label: 'Fit', key: 'fit', filterOptions: ['Slim', 'Regular', 'Relaxed', 'Oversized'] },
  { label: 'Occasion', key: 'occasion', filterOptions: ['Casual', 'Sports', 'Daily Wear'] },
  { label: 'Neck', key: 'neck', filterOptions: ['Round Neck', 'V-Neck', 'Polo Collar'] },
  { label: 'Sleeve', key: 'sleeve', filterOptions: ['Half Sleeve', 'Full Sleeve'] },
];

const FORMAL_WEAR_SPECS = [
  { label: 'Material', key: 'material', filterOptions: ['Poly-Viscose', 'Wool Blend', 'Cotton Blend', 'Linen Blend', 'Crepe'] },
  { label: 'Pattern', key: 'pattern', filterOptions: ['Solid', 'Pinstripe', 'Checked', 'Textured'] },
  { label: 'Fit', key: 'fit', filterOptions: ['Slim', 'Regular', 'Tailored'] },
  { label: 'Occasion', key: 'occasion', filterOptions: ['Office', 'Business', 'Meeting', 'Evening', 'Wedding'] },
  { label: 'Closure', key: 'closure', filterOptions: ['Button', 'Hook', 'Zip'] },
  { label: 'Care', key: 'care', filterOptions: ['Dry Clean', 'Gentle Wash', 'Steam Press'] },
];

const TRADITIONAL_WEAR_SPECS = [
  { label: 'Material', key: 'material', filterOptions: ['Silk Blend', 'Jacquard', 'Cotton Silk', 'Brocade', 'Linen Blend', 'Georgette'] },
  { label: 'Work', key: 'work', filterOptions: ['Embroidery', 'Zari', 'Printed', 'Woven', 'Thread Work'] },
  { label: 'Fit', key: 'fit', filterOptions: ['Slim', 'Regular', 'Relaxed'] },
  { label: 'Occasion', key: 'occasion', filterOptions: ['Festive', 'Wedding', 'Ceremony', 'Party'] },
  { label: 'Set Includes', key: 'set_includes', filterOptions: ['Single Piece', '2 Piece Set', '3 Piece Set'] },
  { label: 'Sleeve', key: 'sleeve', filterOptions: ['Full Sleeve', 'Half Sleeve', 'Sleeveless'] },
];

const WATCH_SPECS = [
  { label: 'Display Type', key: 'display_type', filterOptions: ['Analog', 'Digital', 'Analog-Digital'] },
  { label: 'Dial Shape', key: 'dial_shape', filterOptions: ['Round', 'Square', 'Rectangle'] },
  { label: 'Strap Material', key: 'strap_material', filterOptions: ['Silicone', 'Leather', 'Stainless Steel', 'Nylon'] },
  { label: 'Water Resistance', key: 'water_resistance', filterOptions: ['30 m', '50 m', '100 m'] },
  { label: 'Compatible OS', key: 'compatible_os', filterOptions: ['Android', 'iOS', 'Android & iOS', 'Not Applicable'] },
];

const SHOES_SPECS = [
  { label: 'Upper Material', key: 'upper_material', filterOptions: ['Mesh', 'Synthetic', 'Leather', 'PU', 'Canvas'] },
  { label: 'Sole Material', key: 'sole_material', filterOptions: ['Rubber', 'EVA', 'TPR', 'PU'] },
  { label: 'Closure', key: 'closure', filterOptions: ['Lace-Up', 'Slip-On', 'Velcro', 'Buckle'] },
  { label: 'Occasion', key: 'occasion', filterOptions: ['Casual', 'Sports', 'Formal', 'Party'] },
  { label: 'Sport Type', key: 'sport_type', filterOptions: ['Running', 'Walking', 'Training', 'Not Applicable'] },
  { label: 'Heel Type', key: 'heel_type', filterOptions: ['Flat', 'Block Heel', 'Stiletto', 'Not Applicable'] },
];

const ACCESSORY_SPECS = [
  { label: 'Material', key: 'material', filterOptions: ['Leather', 'Faux Leather', 'Stainless Steel', 'Sterling Silver', 'Canvas'] },
  { label: 'Type', key: 'type', filterOptions: ['Casual', 'Formal', 'Festive', 'Daily Wear'] },
  { label: 'Occasion', key: 'occasion', filterOptions: ['Casual', 'Office', 'Party', 'Festive'] },
  { label: 'Closure', key: 'closure', filterOptions: ['Buckle', 'Zip', 'Magnet', 'Slip-In', 'Clasp'] },
  { label: 'Care', key: 'care', filterOptions: ['Dry Cloth', 'Keep Dry', 'Store Flat', 'Avoid Perfume Contact'] },
];

export const CATEGORY_TREE = [
  {
    name: 'Shirt',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
    children: [
      { name: 'Plain Shirts', image: 'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=1200&q=80', template: { sizeOptions: ['38', '39', '40', '42', '44'], specFields: SHIRT_SPECS } },
      { name: 'Checked Shirts', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&q=80', template: { sizeOptions: ['38', '39', '40', '42', '44'], specFields: SHIRT_SPECS } },
      { name: 'Striped Shirts', image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=1200&q=80', template: { sizeOptions: ['38', '39', '40', '42', '44'], specFields: SHIRT_SPECS } },
      { name: 'Linen Shirts', image: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=1200&q=80', template: { sizeOptions: ['38', '39', '40', '42', '44'], specFields: SHIRT_SPECS } },
      { name: 'Formal Shirts', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80', template: { sizeOptions: ['38', '39', '40', '42', '44'], specFields: SHIRT_SPECS } },
    ],
  },
  {
    name: 'T-Shirt',
    image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80',
    children: [
      { name: 'Solid T-Shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TSHIRT_SPECS } },
      { name: 'Graphic T-Shirts', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TSHIRT_SPECS } },
      { name: 'Polo T-Shirts', image: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TSHIRT_SPECS } },
      { name: 'Oversized T-Shirts', image: 'https://images.unsplash.com/photo-1618354691267-3f3225ea236c?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TSHIRT_SPECS } },
      { name: 'Kids T-Shirts', image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&q=80', template: { sizeOptions: ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'], specFields: TSHIRT_SPECS } },
    ],
  },
  {
    name: 'Mens Formal Wear',
    image: 'https://images.unsplash.com/photo-1592878904946-b3cd5c7f7b7c?w=1200&q=80',
    children: [
      { name: 'Mens Formal Suits', image: 'https://images.unsplash.com/photo-1592878904946-b3cd5c7f7b7c?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: FORMAL_WEAR_SPECS } },
      { name: 'Mens Formal Blazers', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: FORMAL_WEAR_SPECS } },
      { name: 'Mens Formal Trousers', image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: FORMAL_WEAR_SPECS } },
      { name: 'Mens Waistcoats', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: FORMAL_WEAR_SPECS } },
    ],
  },
  {
    name: 'Womens Formal Wear',
    image: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=1200&q=80',
    children: [
      { name: 'Womens Formal Blazers', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: FORMAL_WEAR_SPECS } },
      { name: 'Womens Formal Trousers', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: FORMAL_WEAR_SPECS } },
      { name: 'Womens Formal Shirts', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: FORMAL_WEAR_SPECS } },
      { name: 'Womens Formal Skirts', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: FORMAL_WEAR_SPECS } },
    ],
  },
  {
    name: 'Mens Traditional Wear',
    image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=1200&q=80',
    children: [
      { name: 'Mens Kurta', image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TRADITIONAL_WEAR_SPECS } },
      { name: 'Mens Kurta Pajama Sets', image: 'https://images.unsplash.com/photo-1593032465171-8b61c8c687ef?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TRADITIONAL_WEAR_SPECS } },
      { name: 'Mens Sherwani', image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TRADITIONAL_WEAR_SPECS } },
      { name: 'Mens Nehru Jackets', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80', template: { sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'], specFields: TRADITIONAL_WEAR_SPECS } },
    ],
  },
  {
    name: 'Womens Traditional Wear',
    image: 'https://images.unsplash.com/photo-1611303644828-45a1f7cfbc70?w=1200&q=80',
    children: [
      { name: 'Womens Kurta', image: 'https://images.unsplash.com/photo-1614251056216-f748f76cd228?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: TRADITIONAL_WEAR_SPECS } },
      { name: 'Womens Kurta Sets', image: 'https://images.unsplash.com/photo-1610030469668-8e7f4f9ec8a2?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: TRADITIONAL_WEAR_SPECS } },
      { name: 'Womens Ethnic Gowns', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80', template: { sizeOptions: ['XS', 'S', 'M', 'L', 'XL'], specFields: TRADITIONAL_WEAR_SPECS } },
      { name: 'Womens Sarees', image: 'https://images.unsplash.com/photo-1610189012215-45853f4f2d8f?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: TRADITIONAL_WEAR_SPECS } },
    ],
  },
  {
    name: 'Watch',
    image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=1200&q=80',
    children: [
      { name: 'Analog Watches', image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: WATCH_SPECS } },
      { name: 'Smart Watches', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: WATCH_SPECS } },
      { name: 'Sports Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: WATCH_SPECS } },
      { name: 'Luxury Watches', image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: WATCH_SPECS } },
    ],
  },
  {
    name: 'Shoes',
    image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80',
    children: [
      { name: 'Running Shoes', image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80', template: { sizeOptions: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'], specFields: SHOES_SPECS } },
      { name: 'Casual Sneakers', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80', template: { sizeOptions: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'], specFields: SHOES_SPECS } },
      { name: 'Formal Shoes', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80', template: { sizeOptions: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'], specFields: SHOES_SPECS } },
      { name: 'Flats', image: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=1200&q=80', template: { sizeOptions: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'], specFields: SHOES_SPECS } },
      { name: 'Heels', image: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=1200&q=80', template: { sizeOptions: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'], specFields: SHOES_SPECS } },
      { name: 'Kids Sneakers', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80', template: { sizeOptions: ['UK 11C', 'UK 12C', 'UK 13C', 'UK 1', 'UK 2', 'UK 3'], specFields: SHOES_SPECS } },
    ],
  },
  {
    name: 'Accessory',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80',
    children: [
      { name: 'Rings', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: ACCESSORY_SPECS } },
      { name: 'Belts', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: ACCESSORY_SPECS } },
      { name: 'Wallets', image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: ACCESSORY_SPECS } },
      { name: 'Jewellery', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80', template: { sizeOptions: ['Free Size'], specFields: ACCESSORY_SPECS } },
    ],
  },
];
