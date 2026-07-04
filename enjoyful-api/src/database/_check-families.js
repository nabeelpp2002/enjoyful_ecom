'use strict';
require('dotenv/config');
const mongoose = require('mongoose');
const P = mongoose.model('Product', new mongoose.Schema({ name: String, productFamily: String, size: String }, { strict: false }));
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const scrubs = await P.find({ name: /scrub/i }).select('name productFamily size').lean();
  console.log('=== Scrubs ===');
  scrubs.forEach(s => console.log(`  ${s.productFamily || '(none)'}  <-  ${s.name}`));
  // Count members per family
  const agg = await P.aggregate([
    { $match: { productFamily: { $nin: [null, ''] } } },
    { $group: { _id: '$productFamily', n: { $sum: 1 }, names: { $push: '$name' } } },
    { $match: { n: { $gt: 2 } } },
    { $sort: { n: -1 } },
  ]);
  console.log('\n=== Families with >2 members (suspicious) ===');
  agg.forEach(a => { console.log(`  ${a._id} (${a.n}):`); a.names.forEach(n => console.log(`      ${n}`)); });
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
