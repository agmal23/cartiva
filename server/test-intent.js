
require('dotenv').config();

const { extractShoppingIntent } = require('./src/services/intentService');

async function testIntent() {
  try {
    const intent = await extractShoppingIntent(
      'I need headphones for studying, with excellent noise cancellation and long battery life',
      100
    );

    console.log('Extracted shopping intent:');
    console.log(JSON.stringify(intent, null, 2));
  } catch (error) {
    console.error('Intent test failed:', error.message);
  }
}

testIntent();
