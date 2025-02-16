import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    // Here you would implement the actual appointment availability check
    // This is just example data
    const appointments = [
      {
        id: '1',
        datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
      {
        id: '2',
        datetime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      },
      // ... more appointments
    ];

    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function generateStaticParams() {
  // Fetch all location IDs that need to be pre-rendered
  const response = await fetch(
    'https://ttp.cbp.dhs.gov/schedulerapi/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=Global%20Entry'
  );
  const locations = await response.json();
  
  // Return an array of objects with locationId params
  return locations.map((location: { id: number }) => ({
    locationId: location.id.toString(),
  }));
} 