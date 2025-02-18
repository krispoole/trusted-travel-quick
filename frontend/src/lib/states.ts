export interface USState {
  name: string
  abbreviation: string
  type: 'state' | 'territory' | 'district'
}

export const US_STATES: USState[] = [
  { name: 'Alabama', abbreviation: 'AL', type: 'state' },
  { name: 'Alaska', abbreviation: 'AK', type: 'state' },
  { name: 'Arizona', abbreviation: 'AZ', type: 'state' },
  { name: 'Arkansas', abbreviation: 'AR', type: 'state' },
  { name: 'California', abbreviation: 'CA', type: 'state' },
  { name: 'Colorado', abbreviation: 'CO', type: 'state' },
  { name: 'Connecticut', abbreviation: 'CT', type: 'state' },
  { name: 'Delaware', abbreviation: 'DE', type: 'state' },
  { name: 'Florida', abbreviation: 'FL', type: 'state' },
  { name: 'Georgia', abbreviation: 'GA', type: 'state' },
  { name: 'Hawaii', abbreviation: 'HI', type: 'state' },
  { name: 'Idaho', abbreviation: 'ID', type: 'state' },
  { name: 'Illinois', abbreviation: 'IL', type: 'state' },
  { name: 'Indiana', abbreviation: 'IN', type: 'state' },
  { name: 'Iowa', abbreviation: 'IA', type: 'state' },
  { name: 'Kansas', abbreviation: 'KS', type: 'state' },
  { name: 'Kentucky', abbreviation: 'KY', type: 'state' },
  { name: 'Louisiana', abbreviation: 'LA', type: 'state' },
  { name: 'Maine', abbreviation: 'ME', type: 'state' },
  { name: 'Maryland', abbreviation: 'MD', type: 'state' },
  { name: 'Massachusetts', abbreviation: 'MA', type: 'state' },
  { name: 'Michigan', abbreviation: 'MI', type: 'state' },
  { name: 'Minnesota', abbreviation: 'MN', type: 'state' },
  { name: 'Mississippi', abbreviation: 'MS', type: 'state' },
  { name: 'Missouri', abbreviation: 'MO', type: 'state' },
  { name: 'Montana', abbreviation: 'MT', type: 'state' },
  { name: 'Nebraska', abbreviation: 'NE', type: 'state' },
  { name: 'Nevada', abbreviation: 'NV', type: 'state' },
  { name: 'New Hampshire', abbreviation: 'NH', type: 'state' },
  { name: 'New Jersey', abbreviation: 'NJ', type: 'state' },
  { name: 'New Mexico', abbreviation: 'NM', type: 'state' },
  { name: 'New York', abbreviation: 'NY', type: 'state' },
  { name: 'North Carolina', abbreviation: 'NC', type: 'state' },
  { name: 'North Dakota', abbreviation: 'ND', type: 'state' },
  { name: 'Ohio', abbreviation: 'OH', type: 'state' },
  { name: 'Oklahoma', abbreviation: 'OK', type: 'state' },
  { name: 'Oregon', abbreviation: 'OR', type: 'state' },
  { name: 'Pennsylvania', abbreviation: 'PA', type: 'state' },
  { name: 'Rhode Island', abbreviation: 'RI', type: 'state' },
  { name: 'South Carolina', abbreviation: 'SC', type: 'state' },
  { name: 'South Dakota', abbreviation: 'SD', type: 'state' },
  { name: 'Tennessee', abbreviation: 'TN', type: 'state' },
  { name: 'Texas', abbreviation: 'TX', type: 'state' },
  { name: 'Utah', abbreviation: 'UT', type: 'state' },
  { name: 'Vermont', abbreviation: 'VT', type: 'state' },
  { name: 'Virginia', abbreviation: 'VA', type: 'state' },
  { name: 'Washington', abbreviation: 'WA', type: 'state' },
  { name: 'West Virginia', abbreviation: 'WV', type: 'state' },
  { name: 'Wisconsin', abbreviation: 'WI', type: 'state' },
  { name: 'Wyoming', abbreviation: 'WY', type: 'state' },
  { name: 'American Samoa', abbreviation: 'AS', type: 'territory' },
  { name: 'District of Columbia', abbreviation: 'DC', type: 'district' },
  { name: 'Guam', abbreviation: 'GU', type: 'territory' },
  { name: 'Northern Mariana Islands', abbreviation: 'MP', type: 'territory' },
  { name: 'Puerto Rico', abbreviation: 'PR', type: 'territory' },
  { name: 'U.S. Virgin Islands', abbreviation: 'VI', type: 'territory' }
];

// Helper functions
export function getStateByAbbreviation(abbreviation: string): USState | undefined {
  return US_STATES.find(state => state.abbreviation === abbreviation);
}

export function getStateName(abbreviation: string): string {
  return getStateByAbbreviation(abbreviation)?.name || abbreviation;
}

export function searchStates(query: string): USState[] {
  const searchTerm = query.toLowerCase();
  return US_STATES.filter(state => 
    state.name.toLowerCase().includes(searchTerm) ||
    state.abbreviation.toLowerCase().includes(searchTerm)
  );
}

// Improved fuzzy search for state names with prioritization
export function findMatchingStates(query: string): Set<string> {
  const matches = new Set<string>();
  const searchTerm = query.toLowerCase();
  
  // First pass: check for exact matches at the start of the name
  US_STATES.forEach(state => {
    if (
      state.name.toLowerCase().startsWith(searchTerm) ||
      state.abbreviation.toLowerCase() === searchTerm
    ) {
      matches.add(state.abbreviation);
    }
  });

  // Second pass: check for partial matches if no exact matches found
  if (matches.size === 0) {
    US_STATES.forEach(state => {
      // Split state name into words and check if any word starts with the search term
      const words = state.name.toLowerCase().split(' ');
      if (
        words.some(word => word.startsWith(searchTerm)) ||
        state.name.toLowerCase().includes(searchTerm) ||
        state.abbreviation.toLowerCase().includes(searchTerm)
      ) {
        matches.add(state.abbreviation);
      }
    });
  }

  // If still no matches, do a more lenient search
  if (matches.size === 0) {
    US_STATES.forEach(state => {
      if (
        state.name.toLowerCase().includes(searchTerm) ||
        state.abbreviation.toLowerCase().includes(searchTerm)
      ) {
        matches.add(state.abbreviation);
      }
    });
  }

  return matches;
}

// Add a helper function to sort states by match relevance
export function sortStatesByRelevance(states: string[], query: string): string[] {
  const searchTerm = query.toLowerCase();
  return [...states].sort((a, b) => {
    const stateA = getStateByAbbreviation(a)!;
    const stateB = getStateByAbbreviation(b)!;
    
    // Exact matches first
    const aStartsWithQuery = stateA.name.toLowerCase().startsWith(searchTerm);
    const bStartsWithQuery = stateB.name.toLowerCase().startsWith(searchTerm);
    if (aStartsWithQuery && !bStartsWithQuery) return -1;
    if (!aStartsWithQuery && bStartsWithQuery) return 1;
    
    // Then sort alphabetically
    return stateA.name.localeCompare(stateB.name);
  });
} 