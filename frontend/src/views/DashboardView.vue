<script setup lang="ts">
import { ref, computed } from 'vue'

// Dummy location data
const locations = [
  'New York, USA',
  'London, UK',
  'Tokyo, Japan',
  'Paris, France',
  'Sydney, Australia',
  'Dubai, UAE',
  'Singapore',
  'Toronto, Canada'
]

const email = ref('')
const selectedLocations = ref<string[]>([])
const currentLocation = ref('')

const showSubmitButton = computed(() => {
  return selectedLocations.value.length > 0 && email.value.length > 0
})

const addLocation = () => {
  if (currentLocation.value && !selectedLocations.value.includes(currentLocation.value)) {
    selectedLocations.value.push(currentLocation.value)
    currentLocation.value = ''
  }
}

const removeLocation = (location: string) => {
  selectedLocations.value = selectedLocations.value.filter(loc => loc !== location)
}

const handleSubmit = () => {
  console.log('Submitted:', {
    email: email.value,
    locations: selectedLocations.value
  })
}
</script>

<template>
  <div class="dashboard">
    <h1>Travel Dashboard</h1>
    
    <div class="form-container">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input 
          type="email" 
          id="email" 
          v-model="email" 
          placeholder="Enter your email"
        >
      </div>

      <div class="form-group">
        <label for="location">Select Location</label>
        <div class="location-input">
          <select 
            id="location" 
            v-model="currentLocation"
            @change="addLocation"
          >
            <option value="">Choose a location</option>
            <option v-for="location in locations" :key="location" :value="location">
              {{ location }}
            </option>
          </select>
        </div>
      </div>

      <div class="selected-locations" v-if="selectedLocations.length > 0">
        <h3>Selected Locations:</h3>
        <div class="location-tags">
          <div v-for="location in selectedLocations" :key="location" class="location-tag">
            {{ location }}
            <button @click="removeLocation(location)" class="remove-btn">&times;</button>
          </div>
        </div>
      </div>

      <button 
        v-if="showSubmitButton" 
        @click="handleSubmit" 
        class="submit-btn"
      >
        Submit
      </button>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.location-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.location-tag {
  background: #e9ecef;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.submit-btn:hover {
  background: #0056b3;
}
</style> 