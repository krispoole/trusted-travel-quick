const admin = require('firebase-admin');
const { updateLocations } = require('./fetchLocations');

async function testLocationSync() {
  try {
    // 1. First sync the locations
    console.log('Starting location sync test...');
    await updateLocations();
    
    // 2. Verify the data was written
    const db = admin.firestore();
    const locationsSnapshot = await db.collection('locations').get();
    
    // 3. Print out summary
    console.log('\n=== Sync Results ===');
    console.log(`Total locations synced: ${locationsSnapshot.size}`);
    
    // 4. Print out a sample location
    if (locationsSnapshot.size > 0) {
      const sampleDoc = locationsSnapshot.docs[0];
      console.log('\nSample Location Data:');
      console.log(JSON.stringify(sampleDoc.data(), null, 2));
    }

    // 5. Basic data validation
    let validationErrors = 0;
    locationsSnapshot.forEach(doc => {
      const data = doc.data();
      const requiredFields = ['name', 'city', 'state', 'address'];
      
      requiredFields.forEach(field => {
        if (!data[field]) {
          console.error(`Missing required field '${field}' in document ${doc.id}`);
          validationErrors++;
        }
      });
    });

    if (validationErrors === 0) {
      console.log('\n✅ All locations have required fields');
    } else {
      console.error(`\n❌ Found ${validationErrors} validation errors`);
    }

  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testLocationSync()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });