import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    console.log('Fetching patients', search ? `with search: ${search}` : '')
    
    // TODO: Implement database connection when MongoDB is set up
    // Mock patient data for now
    const mockPatients = [
      {
        id: '1',
        name: 'John Doe',
        age: 45,
        email: 'john.doe@email.com',
        phone: '(555) 123-4567',
        medicalRecordNumber: 'MRN001',
        lastVisit: new Date().toISOString(),
        condition: 'Hypertension',
        status: 'Active'
      },
      {
        id: '2',
        name: 'Jane Smith',
        age: 32,
        email: 'jane.smith@email.com',
        phone: '(555) 234-5678',
        medicalRecordNumber: 'MRN002',
        lastVisit: new Date().toISOString(),
        condition: 'Diabetes Type 2',
        status: 'Active'
      },
      {
        id: '3',
        name: 'Robert Johnson',
        age: 58,
        email: 'robert.j@email.com',
        phone: '(555) 345-6789',
        medicalRecordNumber: 'MRN003',
        lastVisit: new Date().toISOString(),
        condition: 'Arthritis',
        status: 'Follow-up'
      }
    ]
    
    // Filter patients based on search if provided
    let patients = mockPatients
    if (search) {
      patients = mockPatients.filter(patient => 
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase()) ||
        patient.phone.includes(search) ||
        patient.medicalRecordNumber.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json()
    
    console.log('Creating new patient:', patientData.name)
    
    // TODO: Implement database connection when MongoDB is set up
    const patientId = Date.now().toString()
    
    return NextResponse.json({ 
      patientId,
      message: 'Patient created successfully' 
    })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}