'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  HomeIcon,
  PencilIcon,
  PrinterIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface SOAPSection {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

const sampleTranscript = [
  { speaker: 'doctor', text: 'Good morning, how are you feeling today?', timestamp: '10:30:15' },
  { speaker: 'patient', text: 'I\'ve been having chest pain for the past few days.', timestamp: '10:30:18' },
  { speaker: 'doctor', text: 'Can you describe the pain? Is it sharp or dull?', timestamp: '10:30:25' },
  { speaker: 'patient', text: 'It\'s a dull ache, gets worse when I breathe deeply.', timestamp: '10:30:30' },
  { speaker: 'doctor', text: 'Any shortness of breath or dizziness?', timestamp: '10:30:40' },
  { speaker: 'patient', text: 'Yes, I get winded easily and feel lightheaded sometimes.', timestamp: '10:30:45' },
]

export default function SOAPNotesPage() {
  const [soapNote, setSoapNote] = useState<SOAPSection>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  useEffect(() => {
    // Auto-generate SOAP note on page load
    generateSOAPNote()
  }, [])

  const generateSOAPNote = async () => {
    setIsGenerating(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const generatedSOAP: SOAPSection = {
      subjective: `Chief Complaint: Patient reports chest pain for the past 3 days.

History of Present Illness: Patient describes experiencing dull chest pain that has persisted for three days. The pain is characterized as a dull ache that worsens with deep breathing and movement. Patient also reports associated symptoms of shortness of breath and occasional lightheadedness. No reported radiation of pain or specific triggers identified during initial questioning.

Review of Systems: 
- Cardiovascular: Positive for chest pain, shortness of breath, and lightheadedness
- Respiratory: Positive for dyspnea on exertion
- Constitutional: Denies fever, chills, or weight loss`,

      objective: `Vital Signs: (To be recorded)
- Blood Pressure: ___
- Heart Rate: ___  
- Respiratory Rate: ___
- Temperature: ___
- Oxygen Saturation: ___

Physical Examination:
- General Appearance: Patient appears comfortable at rest
- Cardiovascular: Heart sounds to be assessed, regular rate and rhythm
- Respiratory: Lung sounds to be evaluated, no obvious distress
- Chest wall: Inspection and palpation pending

Diagnostic Tests: (Pending)
- 12-lead ECG
- Chest X-ray
- Laboratory studies as indicated`,

      assessment: `Primary Concerns:
1. Chest pain - differential includes:
   • Musculoskeletal etiology (costochondritis, muscle strain)
   • Cardiac causes (angina, myocardial infarction - requires ruling out)
   • Pulmonary causes (pneumonia, pulmonary embolism)
   • Gastrointestinal causes (GERD, peptic ulcer disease)

2. Associated dyspnea and lightheadedness - concerning for potential cardiac etiology

Risk Stratification: Given the combination of chest pain, dyspnea, and lightheadedness, cardiac evaluation is warranted to rule out acute coronary syndrome. Patient requires immediate assessment and workup.`,

      plan: `Immediate Actions:
1. Complete cardiovascular examination and obtain 12-lead ECG
2. Chest X-ray to evaluate for pulmonary pathology
3. Laboratory studies: CBC, CMP, troponin levels, D-dimer if indicated
4. Vital signs monitoring

Diagnostic Workup:
- ECG to assess for ischemic changes or arrhythmias
- Chest imaging to rule out pneumonia or other pulmonary causes
- Cardiac biomarkers to evaluate for myocardial injury
- Consider stress testing or cardiology consultation based on initial findings

Treatment:
- Supportive care pending evaluation results
- Pain management as appropriate
- Continuous monitoring if indicated
- NPO pending evaluation if intervention required

Follow-up:
- Results review and clinical correlation
- Cardiology referral if cardiac etiology suspected
- Patient education on warning signs
- Return precautions for worsening symptoms
- Follow-up appointment in 2-3 days or sooner if symptoms persist

Patient Instructions:
- Return immediately if chest pain worsens or becomes severe
- Seek immediate care for severe shortness of breath
- Avoid strenuous activity until evaluation complete
- Take medications as prescribed`
    }

    setSoapNote(generatedSOAP)
    setIsGenerating(false)
    setHasGenerated(true)
  }

  const handleSectionChange = (section: keyof SOAPSection, value: string) => {
    setSoapNote(prev => ({
      ...prev,
      [section]: value
    }))
  }

  const saveNote = () => {
    // Simulate saving
    alert('SOAP Note saved successfully!')
    setIsEditing(false)
  }

  const printNote = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SOAP Notes</h1>
                <p className="text-sm text-gray-500">AI-Generated Medical Documentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  isEditing 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'View Mode' : 'Edit Mode'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={printNote}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Session Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session ID:</span>
                  <span className="font-medium">session_12345</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">15:30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entries:</span>
                  <span className="font-medium">{sampleTranscript.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Transcript Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript Summary</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sampleTranscript.map((entry, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      entry.speaker === 'doctor' 
                        ? 'bg-blue-50 border-l-2 border-blue-500' 
                        : 'bg-green-50 border-l-2 border-green-500'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className={`text-xs font-semibold uppercase ${
                        entry.speaker === 'doctor' ? 'text-blue-700' : 'text-green-700'
                      }`}>
                        {entry.speaker}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{entry.timestamp}</span>
                    </div>
                    <p className="text-gray-800">{entry.text}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveNote}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                  Save Note
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Main Content - SOAP Note */}
          <div className="lg:col-span-3">
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    <SparklesIcon className="h-8 w-8 text-blue-600 animate-pulse mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Generating SOAP Note with AI</h3>
                      <p className="text-gray-600">Analyzing transcript and creating structured medical documentation...</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {hasGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">SOAP Note</h2>
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">Generated Successfully</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {/* Subjective */}
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                        S
                      </div>
                      <h3 className="text-xl font-semibold text-blue-700">Subjective</h3>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={soapNote.subjective}
                        onChange={(e) => handleSectionChange('subjective', e.target.value)}
                        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Patient's symptoms, history, and complaints..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                          {soapNote.subjective}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Objective */}
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                        O
                      </div>
                      <h3 className="text-xl font-semibold text-green-700">Objective</h3>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={soapNote.objective}
                        onChange={(e) => handleSectionChange('objective', e.target.value)}
                        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Physical examination, vital signs, test results..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                          {soapNote.objective}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Assessment */}
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                        A
                      </div>
                      <h3 className="text-xl font-semibold text-orange-700">Assessment</h3>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={soapNote.assessment}
                        onChange={(e) => handleSectionChange('assessment', e.target.value)}
                        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Diagnosis, differential diagnosis, clinical reasoning..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                          {soapNote.assessment}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Plan */}
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                        P
                      </div>
                      <h3 className="text-xl font-semibold text-red-700">Plan</h3>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={soapNote.plan}
                        onChange={(e) => handleSectionChange('plan', e.target.value)}
                        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Treatment plan, follow-up, patient education..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                          {soapNote.plan}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}