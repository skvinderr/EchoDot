import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: Implement database connection when MongoDB is set up
    console.log('Fetching transcription sessions')
    
    // Mock data for now
    const sessions = [
      {
        id: '1',
        patientName: 'John Doe',
        doctorName: 'Dr. Smith',
        status: 'completed',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        patientName: 'Jane Smith',
        doctorName: 'Dr. Johnson',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ]
    
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientName, doctorName } = await request.json()
    
    // TODO: Implement database connection when MongoDB is set up
    console.log('Creating new session:', { patientName, doctorName })
    
    const sessionId = Date.now().toString()
    
    return NextResponse.json({ 
      sessionId,
      message: 'Session created successfully' 
    })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}