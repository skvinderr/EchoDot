'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MicrophoneIcon, 
  StopIcon, 
  PlayIcon, 
  PauseIcon,
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TranscriptEntry {
  id: string
  timestamp: string
  speaker: 'doctor' | 'patient'
  text: string
  confidence: number
}

export default function TranscriptionPage() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [interimTranscript, setInterimTranscript] = useState('')
  const [sessionDuration, setSessionDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const interimTranscriptRef = useRef<string>('')

  // Sample conversation data for demonstration
  const sampleConversations = [
    { speaker: 'doctor' as const, text: 'Good morning, how are you feeling today?' },
    { speaker: 'patient' as const, text: 'I\'ve been having some chest pain for the past few days.' },
    { speaker: 'doctor' as const, text: 'Can you describe the pain? Is it sharp or dull?' },
    { speaker: 'patient' as const, text: 'It\'s more of a dull ache, especially when I breathe deeply.' },
    { speaker: 'doctor' as const, text: 'Have you experienced any shortness of breath or dizziness?' },
    { speaker: 'patient' as const, text: 'Yes, I get winded easily when I climb stairs.' },
    { speaker: 'doctor' as const, text: 'Any family history of heart problems?' },
    { speaker: 'patient' as const, text: 'My father had a heart attack when he was 55.' },
    { speaker: 'doctor' as const, text: 'I\'d like to run some tests to rule out any serious conditions.' },
    { speaker: 'patient' as const, text: 'What kind of tests are we talking about?' },
  ]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true 
        } 
      })
      
      streamRef.current = stream
      
      // Setup audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.start(2000) // Record in 2-second chunks
      
      // Setup Web Speech API for real transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started')
        }
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          let interimText = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            const confidence = event.results[i][0].confidence
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript
              
              // Advanced speaker detection with multiple strategies
              const detectSpeaker = (text: string, previousSpeaker?: 'doctor' | 'patient'): 'doctor' | 'patient' => {
                const lowerText = text.toLowerCase()
                
                // Enhanced doctor phrases/patterns with medical terminology
                const doctorPatterns = [
                  // Questions and examinations
                  'can you', 'how long', 'any pain', 'let me', 'show me', 'describe the', 'rate your pain',
                  'when did', 'have you ever', 'family history', 'take a deep breath', 'open your mouth',
                  
                  // Medical decisions and advice
                  'i recommend', 'we need to', 'i\'d like to', 'i want to', 'we should', 'you should',
                  'prescription', 'medication', 'treatment', 'therapy', 'surgery',
                  
                  // Medical terminology
                  'diagnosis', 'prognosis', 'examination', 'symptoms', 'condition', 'disease',
                  'blood pressure', 'heart rate', 'temperature', 'pulse', 'blood test', 'x-ray',
                  'mri', 'ct scan', 'ultrasound', 'lab results', 'vital signs',
                  
                  // Professional language
                  'based on your', 'according to', 'medical history', 'clinical', 'patient',
                  'follow up', 'appointment', 'referral', 'specialist'
                ]
                
                // Enhanced patient phrases with personal experiences
                const patientPatterns = [
                  // Personal experiences and feelings
                  'i feel', 'i\'m feeling', 'it hurts', 'i have', 'i\'ve been', 'i\'ve had',
                  'my pain', 'my symptoms', 'i can\'t', 'i couldn\'t', 'i\'m unable',
                  'it started', 'since yesterday', 'for the past', 'i\'m worried', 'i\'m concerned',
                  
                  // Pain and symptom descriptions
                  'sharp pain', 'dull pain', 'burning', 'tingling', 'numbness', 'swelling',
                  'headache', 'nausea', 'dizzy', 'tired', 'weak', 'sore', 'ache',
                  
                  // Personal context
                  'at home', 'at work', 'when i', 'i noticed', 'i think', 'i believe',
                  'my family', 'my job', 'i work', 'i live', 'i usually',
                  
                  // Questions about condition
                  'what does this mean', 'is this serious', 'will i be okay', 'how long',
                  'what should i do', 'can i', 'is it normal', 'what causes'
                ]
                
                // Calculate pattern scores
                const doctorScore = doctorPatterns.reduce((score, pattern) => 
                  lowerText.includes(pattern) ? score + 1 : score, 0
                )
                
                const patientScore = patientPatterns.reduce((score, pattern) => 
                  lowerText.includes(pattern) ? score + 1 : score, 0
                )
                
                // Enhanced scoring with length and context considerations
                let adjustedDoctorScore = doctorScore
                let adjustedPatientScore = patientScore
                
                // Medical terminology bonus for doctors
                const medicalTerms = ['diagnosis', 'prescription', 'medication', 'blood pressure', 'heart rate']
                const medicalTermBonus = medicalTerms.reduce((bonus, term) => 
                  lowerText.includes(term) ? bonus + 2 : bonus, 0
                )
                adjustedDoctorScore += medicalTermBonus
                
                // Personal pronouns bonus for patients
                const personalPronouns = ['i feel', 'i have', 'i\'m', 'my', 'me']
                const personalBonus = personalPronouns.reduce((bonus, pronoun) => 
                  lowerText.includes(pronoun) ? bonus + 1.5 : bonus, 0
                )
                adjustedPatientScore += personalBonus
                
                // Question pattern analysis
                if (lowerText.includes('?')) {
                  if (lowerText.match(/^(how|when|where|what|why|can you|have you|do you|are you)/)) {
                    adjustedDoctorScore += 2 // Doctor asking questions
                  } else if (lowerText.match(/(what does|is this|will i|should i|can i)/)) {
                    adjustedPatientScore += 2 // Patient asking about their condition
                  }
                }
                
                // Length consideration (doctors often give longer explanations)
                if (text.length > 100) {
                  adjustedDoctorScore += 1
                }
                
                // Context-based adjustment using previous speaker
                if (previousSpeaker) {
                  // If scores are close, consider conversation flow
                  if (Math.abs(adjustedDoctorScore - adjustedPatientScore) <= 1) {
                    // Slight bias toward alternating speakers in conversation
                    if (previousSpeaker === 'doctor') {
                      adjustedPatientScore += 0.5
                    } else {
                      adjustedDoctorScore += 0.5
                    }
                  }
                }
                
                console.log(`Speaker Detection Analysis:
                  Text: "${text.substring(0, 50)}..."
                  Doctor Score: ${adjustedDoctorScore}
                  Patient Score: ${adjustedPatientScore}
                  Previous: ${previousSpeaker || 'none'}
                `)
                
                // Determine speaker based on adjusted scores
                if (adjustedDoctorScore > adjustedPatientScore) return 'doctor'
                if (adjustedPatientScore > adjustedDoctorScore) return 'patient'
                
                // Enhanced fallback logic
                if (previousSpeaker) {
                  // If unclear, alternate from previous speaker
                  return previousSpeaker === 'doctor' ? 'patient' : 'doctor'
                }
                
                // Final fallback: analyze sentence structure
                if (lowerText.startsWith('i ') || lowerText.includes(' i ')) {
                  return 'patient' // First person usually indicates patient
                }
                
                return 'doctor' // Default to doctor for medical context
              }
              
              // Get previous speaker for context
              const previousSpeaker = transcript.length > 0 ? transcript[transcript.length - 1].speaker : undefined
              
              // Add to transcript array
              const newEntry: TranscriptEntry = {
                id: `entry_${Date.now()}_${Math.random()}`,
                timestamp: new Date().toLocaleTimeString(),
                speaker: detectSpeaker(transcript, previousSpeaker),
                text: transcript.trim(),
                confidence: confidence || 0.8,
              }
              
              if (newEntry.text.length > 0) {
                setTranscript((prev: any) => [...prev, newEntry])
              }
            } else {
              interimText += transcript
            }
          }
          
          // Update interim transcript state
          setInterimTranscript(interimText)
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone permissions and try again.')
          }
        }
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended')
          if (isRecording && !isPaused) {
            // Restart recognition if still recording
            setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                recognitionRef.current.start()
              }
            }, 100)
          }
        }
        
        recognitionRef.current.start()
      } else {
        alert('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
        // Fallback to simulation for unsupported browsers
        simulateTranscription()
      }
      
      setIsRecording(true)
      setIsPaused(false)
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
      
      // Start audio level monitoring
      monitorAudioLevel()
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      
      // Clear interim transcript
      setInterimTranscript('')
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: any) => track.stop())
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        // Resume speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.start()
        }
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        // Pause speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
        setIsPaused(true)
      }
    }
  }

  const monitorAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const checkLevel = () => {
        if (analyserRef.current && isRecording && !isPaused) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255 * 100)
          requestAnimationFrame(checkLevel)
        }
      }
      
      checkLevel()
    }
  }

  const simulateTranscription = () => {
    if (transcript.length >= sampleConversations.length) return
    
    setIsProcessing(true)
    
    setTimeout(() => {
      const nextEntry = sampleConversations[transcript.length]
      if (nextEntry) {
        const newEntry: TranscriptEntry = {
          id: `entry_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          speaker: nextEntry.speaker,
          text: nextEntry.text,
          confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
        }
        
        setTranscript(prev => [...prev, newEntry])
      }
      setIsProcessing(false)
    }, 1000 + Math.random() * 2000)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const generateSOAPNote = () => {
    if (transcript.length > 0) {
      router.push('/notes')
    } else {
      alert('No transcript available to generate SOAP note.')
    }
  }

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  useEffect(() => {
    if (isRecording && !isPaused) {
      monitorAudioLevel()
    }
  }, [isRecording, isPaused])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <HomeIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Real-time Transcription Session</h1>
                <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                {formatDuration(sessionDuration)}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isRecording 
                  ? isPaused 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Stopped'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recording Controls */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recording Controls</h3>
              
              <div className="space-y-4">
                {!isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startRecording}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <MicrophoneIcon className="h-6 w-6 mr-2" />
                    Start Recording
                  </motion.button>
                ) : (
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={togglePause}
                      className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center ${
                        isPaused 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                      }`}
                    >
                      {isPaused ? <PlayIcon className="h-5 w-5 mr-2" /> : <PauseIcon className="h-5 w-5 mr-2" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={stopRecording}
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                      <StopIcon className="h-5 w-5 mr-2" />
                      Stop Recording
                    </motion.button>
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateSOAPNote}
                  disabled={transcript.length === 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Generate SOAP Note
                </motion.button>
              </div>

              {/* Audio Level Meter */}
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <p className="text-sm font-medium text-gray-700 mb-2">Audio Level</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        audioLevel > 70 ? 'bg-red-500' : 
                        audioLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${audioLevel}%` }}
                      animate={{ 
                        scale: audioLevel > 50 ? [1, 1.02, 1] : 1 
                      }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: audioLevel > 50 ? Infinity : 0 
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Session Stats */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Session Statistics</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{formatDuration(sessionDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries:</span>
                    <span className="font-medium">{transcript.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">
                      {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Stopped'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Transcript */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center text-sm text-blue-600"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Processing...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {transcript.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MicrophoneIcon className="h-16 w-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      {isRecording 
                        ? 'Listening... Start speaking to see real-time transcription.'
                        : 'Click "Start Recording" to begin transcription session.'
                      }
                    </p>
                    <p className="text-sm text-center max-w-md">
                      The AI will automatically detect speakers and transcribe the conversation in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {transcript.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`p-4 rounded-lg border-l-4 ${
                            entry.speaker === 'doctor' 
                              ? 'bg-blue-50 border-blue-500' 
                              : 'bg-green-50 border-green-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                                entry.speaker === 'doctor' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-green-500 text-white'
                              }`}>
                                <UserIcon className="h-4 w-4" />
                              </div>
                              <span className={`text-sm font-semibold capitalize ${
                                entry.speaker === 'doctor' ? 'text-blue-700' : 'text-green-700'
                              }`}>
                                {entry.speaker}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <span>{entry.timestamp}</span>
                              <span className="ml-2">
                                {Math.round(entry.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-800 leading-relaxed">{entry.text}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Interim Transcript Display */}
                    {interimTranscript && isRecording && !isPaused && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        className="p-4 rounded-lg border-l-4 border-gray-300 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full mr-3 bg-gray-400 text-white">
                              <MicrophoneIcon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold text-gray-600">
                              Live (Processing...)
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <div className="animate-pulse rounded-full h-2 w-2 bg-red-500 mr-2"></div>
                            <span>Real-time</span>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed italic">
                          {interimTranscript}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}