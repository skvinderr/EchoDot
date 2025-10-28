import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcript } = await request.json()
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }
    
    // Convert transcript array to text
    const transcriptText = Array.isArray(transcript) 
      ? transcript.map((entry: { speaker: string; text: string }) => `${entry.speaker}: ${entry.text}`).join('\n')
      : transcript
    
    console.log('Generating SOAP note for transcript:', transcriptText.substring(0, 100) + '...')
    
    // Mock SOAP note generation (TODO: Implement AI when Google Gemini is set up)
    const soapNote = {
      subjective: `Patient reports symptoms based on the conversation. Key complaints and history from the transcript:\n\n${transcriptText.substring(0, 200)}...`,
      objective: 'Physical examination findings to be documented based on clinical assessment.',
      assessment: 'Clinical assessment and diagnosis based on subjective and objective findings.',
      plan: 'Treatment plan and follow-up care recommendations.'
    }
    
    // TODO: Save to database when MongoDB is set up
    if (sessionId) {
      console.log('Saving SOAP note for session:', sessionId)
    }
    
    return NextResponse.json({ soapNote })
  } catch (error) {
    console.error('Error generating SOAP note:', error)
    return NextResponse.json(
      { error: 'Failed to generate SOAP note' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    console.log('Fetching SOAP notes', sessionId ? `for session: ${sessionId}` : '')
    
    // TODO: Implement database connection when MongoDB is set up
    // Mock data for now
    const mockSoapNotes = [
      {
        id: '1',
        sessionId: sessionId || '1',
        soapNote: {
          subjective: 'Patient presents with chest pain...',
          objective: 'Vital signs stable...',
          assessment: 'Possible cardiac etiology...',
          plan: 'Further cardiac evaluation...'
        },
        createdAt: new Date().toISOString()
      }
    ]
    
    if (sessionId) {
      const soapNote = mockSoapNotes.find(note => note.sessionId === sessionId)
      return NextResponse.json({ soapNote })
    } else {
      return NextResponse.json({ soapNotes: mockSoapNotes })
    }
  } catch (error) {
    console.error('Error fetching SOAP notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SOAP notes' },
      { status: 500 }
    )
  }
}