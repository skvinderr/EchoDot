import { NextRequest, NextResponse } from 'next/server'
import { generateSOAPNote } from '../../../lib/gemini'

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
    console.log('API Key available:', !!process.env.GOOGLE_AI_API_KEY)
    
    try {
      // Use real Gemini AI to generate SOAP note
      console.log('Calling Gemini API...')
      const soapNote = await generateSOAPNote(transcriptText)
      console.log('Gemini API response received:', soapNote)
      
      // TODO: Save to database when MongoDB is set up
      if (sessionId) {
        console.log('Saving SOAP note for session:', sessionId)
      }
      
      return NextResponse.json({ soapNote })
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      const errorDetails = aiError instanceof Error ? { message: aiError.message, stack: aiError.stack } : aiError
      console.error('Error details:', errorDetails)
      
      // Fallback SOAP note if AI fails
      const fallbackSoapNote = {
        subjective: `Patient conversation transcript (AI generation temporarily unavailable):\n\n${transcriptText.substring(0, 500)}${transcriptText.length > 500 ? '...' : ''}`,
        objective: 'Physical examination findings to be documented during clinical assessment. AI-generated content temporarily unavailable.',
        assessment: 'Clinical assessment and diagnosis to be completed based on subjective and objective findings. Please review transcript manually.',
        plan: 'Treatment plan and follow-up care recommendations to be determined by healthcare provider.'
      }
      
      return NextResponse.json({ soapNote: fallbackSoapNote })
    }
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