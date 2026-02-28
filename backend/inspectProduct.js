const mongoose = require('mongoose');
const Product = require('./src/models/Product');
async function main(){
  await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/Notebook-hub-main');
  const target = await Product.findById('69a111c6fbd334743c15d27f');
  console.log('product', target && target.toObject());
  process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1);});