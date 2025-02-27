import { NextResponse } from 'next/server';

// Mock data for static generation
const MOCK_APPOINTMENTS = [
  {
    id: '1',
    datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  },
  {
    id: '2',
    datetime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
  },
  {
    id: '3',
    datetime: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
  },
  {
    id: '4',
    datetime: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
  },
  {
    id: '5',
    datetime: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
  },
];

// This function will be used during build time to generate static data
export async function GET(
  request: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    // For static site generation, we'll return mock data
    // In a real app, you would fetch this from Firebase using the frontend SDK
    return NextResponse.json(MOCK_APPOINTMENTS);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function generateStaticParams() {
  // For static deployment, we'll pre-render a limited set of locations
  // In a production app, you might fetch this list from a Firebase function or during build time
  const locationIds = ['1', '2', '3', '4', '5']; // Example location IDs
  
  return locationIds.map(locationId => ({
    locationId,
  }));
} 