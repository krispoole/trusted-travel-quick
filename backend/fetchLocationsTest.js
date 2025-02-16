const admin = require('firebase-admin');
const { updateLocations, fetchLocationsFromAPI } = require('./fetchLocations');

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

    // Add new tests for API data
    
    // Test direct API fetch
    console.log('\nTesting direct API fetch...');
    const apiLocations = await fetchLocationsFromAPI();
    console.log(`Fetched ${apiLocations.length} locations from API`);
    
    // Verify API data structure
    if (apiLocations.length > 0) {
      const sampleLocation = apiLocations[0];
      console.log('\nSample API Location Data:');
      console.log(JSON.stringify(sampleLocation, null, 2));
      
      // Verify required fields from API
      const requiredApiFields = ['id', 'name', 'city', 'state', 'address'];
      const missingFields = requiredApiFields.filter(field => !sampleLocation[field]);
      
      if (missingFields.length === 0) {
        console.log('\n✅ API data contains all required fields');
      } else {
        console.error(`\n❌ API data missing fields: ${missingFields.join(', ')}`);
      }
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