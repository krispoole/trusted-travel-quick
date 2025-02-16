const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

async function fetchLocationsFromAPI() {
  const url = 'https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const locations = await response.json();
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

async function updateLocations() {
  try {
    // Fetch locations from API
    const locations = await fetchLocationsFromAPI();
    
    // Get Firestore reference
    const db = admin.firestore();
    const batch = db.batch();
    
    // Reference to locations collection
    const locationsRef = db.collection('locations');

    // First, get all existing location docs to track which ones to delete
    const existingDocs = await locationsRef.get();
    const existingIds = new Set(existingDocs.docs.map(doc => doc.id));
    
    // Process each location
    for (const location of locations) {
      const locationId = location.id.toString();
      const docRef = locationsRef.doc(locationId);
      
      // Remove from set of existing IDs since we're updating this one
      existingIds.delete(locationId);
      
      // Transform the location data
      const locationData = {
        id: location.id,
        name: location.name,
        shortName: location.shortName,
        address: location.address,
        addressAdditional: location.addressAdditional,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        countryCode: location.countryCode,
        phoneNumber: location.phoneNumber,
        phoneExtension: location.phoneExtension,
        phoneAltNumber: location.phoneAltNumber,
        phoneAltExtension: location.phoneAltExtension,
        locationType: location.locationType,
        operational: location.operational,
        directions: location.directions,
        notes: location.notes,
        services: location.services,
        tzData: location.tzData
      };

      // Add to batch
      batch.set(docRef, locationData, { merge: true });
    }
    
    // Delete any locations that no longer exist in the API
    for (const oldId of existingIds) {
      const docRef = locationsRef.doc(oldId);
      batch.delete(docRef);
    }

    // Commit the batch
    await batch.commit();
    
    console.log(`Successfully updated ${locations.length} locations`);
    console.log(`Deleted ${existingIds.size} old locations`);
    
    return locations.length;
  } catch (error) {
    console.error('Error updating locations:', error);
    throw error;
  }
}

module.exports = {
  updateLocations,
  fetchLocationsFromAPI
};