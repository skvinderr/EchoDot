import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const { transcript, speaker, text, timestamp } = await request.json()
    
    // TODO: Implement database connection when MongoDB is set up
    console.log('Updating transcript for session:', sessionId)
    console.log('Data:', { transcript, speaker, text, timestamp })
    
    return NextResponse.json({ 
      message: 'Transcript updated successfully',
      sessionId 
    })
  } catch (error) {
    console.error('Error updating transcript:', error)
    return NextResponse.json(
      { error: 'Failed to update transcript' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    
    // TODO: Implement database connection when MongoDB is set up
    console.log('Fetching session:', sessionId)
    
    // Mock data for now
    const session = {
      id: sessionId,
      patientName: 'John Doe',
      doctorName: 'Dr. Smith',
      transcript: [
        { speaker: 'doctor', text: 'Good morning, how are you feeling today?', timestamp: '10:30:15' },
        { speaker: 'patient', text: 'I\'ve been having chest pain for the past few days.', timestamp: '10:30:18' }
      ],
      status: 'active',
      createdAt: new Date().toISOString()
    }
    
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}