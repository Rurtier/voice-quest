import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  Sword, 
  Heart, 
  Package, 
  Play, 
  Save as SaveIcon, 
  Sparkles,
  Zap,
  Brain,
  Skull,
  Globe,
  Cpu,
  ArrowLeft,
  Loader2,
  Trash2,
  Download,
  Mic,
  MicOff,
  Volume2,
  Settings
} from 'lucide-react'
import { initAuth } from './lib/firebase'
import { saveGame, listSaves, deleteSave, type SavedGame } from './lib/gameStorage'

type GameScreen = 'main-menu' | 'genre-selection' | 'character-creation' | 'playing' | 'load-game'
type Genre = 'fantasy' | 'scifi' | 'mystery' | 'horror' | 'post-apocalyptic' | 'cyberpunk'

export interface GameState {
  characterName: string
  genre: Genre | null
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  gold: number
  inventory: string[]
  level: number
}

const genres = [
  {
    id: 'fantasy' as Genre,
    name: 'Fantasy Adventure',
    description: 'Classic medieval fantasy with magic, dragons, and ancient dungeons',
    icon: Sparkles,
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'scifi' as Genre,
    name: 'Sci-Fi Space Opera',
    description: 'Explore the cosmos, alien worlds, and advanced technology',
    icon: Zap,
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'mystery' as Genre,
    name: 'Mystery Detective',
    description: 'Noir detective stories with puzzles, clues, and intrigue',
    icon: Brain,
    color: 'from-slate-600 to-slate-800'
  },
  {
    id: 'horror' as Genre,
    name: 'Horror Survival',
    description: 'Face supernatural terrors and survive in a world of darkness',
    icon: Skull,
    color: 'from-red-900 to-black'
  },
  {
    id: 'post-apocalyptic' as Genre,
    name: 'Post-Apocalyptic',
    description: 'Survive in a world after civilization has fallen',
    icon: Globe,
    color: 'from-orange-800 to-stone-900'
  },
  {
    id: 'cyberpunk' as Genre,
    name: 'Cyberpunk',
    description: 'High-tech, low-life in a dystopian future megacity',
    icon: Cpu,
    color: 'from-fuchsia-600 to-purple-900'
  }
]

function App() {
  const [screen, setScreen] = useState<GameScreen>('main-menu')
  const [userInput, setUserInput] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const [gameLog, setGameLog] = useState<Array<{ type: 'system' | 'user' | 'assistant', content: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [authReady, setAuthReady] = useState(false)
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Voice control state
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [showSettings, setShowSettings] = useState(false)
  const [drivingMode, setDrivingMode] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const lastSpokenRef = useRef<string>('')
  const drivingModeActiveRef = useRef(false)
  
  const [gameState, setGameState] = useState<GameState>({
    characterName: '',
    genre: null,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    gold: 50,
    inventory: [],
    level: 1
  })

  // Initialize Firebase auth on mount
  useEffect(() => {
    initAuth().then(() => {
      setAuthReady(true)
    })
  }, [])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('=== Speech Recognition Initialization ===')
      console.log('User Agent:', navigator.userAgent)
      console.log('Platform:', navigator.platform)
      console.log('Max Touch Points:', navigator.maxTouchPoints)
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      console.log('SpeechRecognition available:', !!SpeechRecognition)
      console.log('SpeechRecognition type:', SpeechRecognition ? 'webkitSpeechRecognition' : 'not found')
      
      if (SpeechRecognition) {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        
        console.log('iOS detected:', isIOS)
        
        try {
          recognitionRef.current = new SpeechRecognition()
          console.log('SpeechRecognition object created successfully')
          
          // CRITICAL: iOS Safari doesn't support continuous mode properly
          recognitionRef.current.continuous = !isIOS // false for iOS, true for others
          recognitionRef.current.interimResults = false
          recognitionRef.current.lang = 'en-US'
          recognitionRef.current.maxAlternatives = 1
          
          console.log('Recognition settings:')
          console.log('- continuous:', recognitionRef.current.continuous)
          console.log('- interimResults:', recognitionRef.current.interimResults)
          console.log('- lang:', recognitionRef.current.lang)

          recognitionRef.current.onstart = () => {
            console.log('✅ Speech recognition STARTED')
            setIsListening(true)
          }

          recognitionRef.current.onresult = (event: any) => {
            console.log('✅ Speech recognition RESULT received')
            console.log('Event:', event)
            console.log('Results length:', event.results.length)
            
            const lastResultIndex = event.results.length - 1
            const result = event.results[lastResultIndex]
            const transcript = result[0].transcript
            const confidence = result[0].confidence
            
            console.log('Transcript:', transcript)
            console.log('Confidence:', confidence)
            console.log('Is final:', result.isFinal)
            
            setUserInput(transcript)
            
            // In driving mode, auto-send after getting transcript
            if (drivingModeActiveRef.current) {
              console.log('Driving mode active, will auto-send in 800ms')
              setTimeout(() => {
                const sendButton = document.querySelector('[data-send-command]') as HTMLButtonElement
                if (sendButton && transcript.trim()) {
                  console.log('Auto-clicking send button')
                  sendButton.click()
                }
              }, 800)
            } else {
              setIsListening(false)
            }
          }

          recognitionRef.current.onerror = (event: any) => {
            console.error('❌ Speech recognition ERROR:', event.error)
            console.error('Error details:', event)
            
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              console.error('Permission or service denied')
              
              // Stop driving mode
              setDrivingMode(false)
              drivingModeActiveRef.current = false
              setIsListening(false)
              
              alert('Speech Recognition Blocked\n\nThis happens because iOS requires explicit permission.\n\nTo fix:\n\n1. Close this page completely\n2. Go to Settings > Safari > Advanced\n3. Look for "Experimental Features"\n4. Enable any speech-related features\n5. Reload this page\n6. When you click Driving mode, iOS should ask for permission\n\nAlternatively:\n• Try using Chrome on iOS instead of Safari\n• Or use the text input (always works!)')
            } else if (event.error === 'no-speech') {
              console.log('⚠️ No speech detected')
              if (drivingModeActiveRef.current && isIOS) {
                console.log('Restarting for iOS driving mode...')
                setTimeout(() => {
                  try {
                    if (recognitionRef.current) {
                      recognitionRef.current.start()
                    }
                  } catch (e) {
                    console.error('Error restarting after no-speech:', e)
                  }
                }, 300)
              } else if (!drivingModeActiveRef.current) {
                setIsListening(false)
              }
            } else if (event.error === 'aborted') {
              console.log('⚠️ Recognition aborted')
              if (drivingModeActiveRef.current) {
                setTimeout(() => {
                  try {
                    recognitionRef.current?.start()
                  } catch (e) {
                    console.error('Error restarting after abort:', e)
                  }
                }, 300)
              } else {
                setIsListening(false)
              }
            } else if (event.error === 'audio-capture') {
              console.error('❌ Audio capture failed - mic not available or permission denied')
              alert('Could not access microphone. Please check:\n\n1. Microphone is not being used by another app\n2. Safari has microphone permission\n3. Try closing other apps using the microphone')
              setDrivingMode(false)
              drivingModeActiveRef.current = false
              setIsListening(false)
            } else if (event.error === 'network') {
              console.error('❌ Network error - check internet connection')
              alert('Network error. Speech recognition requires an internet connection.')
              setIsListening(false)
            } else {
              console.error('❌ Unhandled recognition error:', event.error)
              if (!drivingModeActiveRef.current) {
                setIsListening(false)
              }
            }
          }

          recognitionRef.current.onend = () => {
            console.log('⚠️ Speech recognition ENDED')
            if (drivingModeActiveRef.current) {
              console.log('Driving mode still active, restarting in 300ms...')
              setTimeout(() => {
                try {
                  if (recognitionRef.current && drivingModeActiveRef.current) {
                    console.log('Attempting to restart recognition...')
                    recognitionRef.current.start()
                  }
                } catch (e) {
                  console.error('Error restarting in driving mode:', e)
                  setDrivingMode(false)
                  drivingModeActiveRef.current = false
                  setIsListening(false)
                }
              }, 300)
            } else {
              setIsListening(false)
            }
          }

          // iOS-specific: add all event handlers for comprehensive debugging
          recognitionRef.current.onaudiostart = () => {
            console.log('🎤 Audio capture STARTED')
          }
          
          recognitionRef.current.onaudioend = () => {
            console.log('🎤 Audio capture ENDED')
          }
          
          recognitionRef.current.onsoundstart = () => {
            console.log('🔊 Sound DETECTED')
          }
          
          recognitionRef.current.onsoundend = () => {
            console.log('🔊 Sound ENDED')
          }
          
          recognitionRef.current.onspeechstart = () => {
            console.log('💬 Speech STARTED')
          }
          
          recognitionRef.current.onspeechend = () => {
            console.log('💬 Speech ENDED')
          }
          
          console.log('All event handlers attached successfully')
          
        } catch (error) {
          console.error('Failed to create SpeechRecognition:', error)
          alert('Failed to initialize speech recognition: ' + error)
        }
      } else {
        console.error('❌ Speech recognition NOT available in this browser')
        alert('Speech recognition is not supported in this browser.\n\nPlease use:\n- Safari on iOS 14.5+\n- Chrome on desktop\n- Edge on desktop')
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          console.log('Cleaning up speech recognition')
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Error during cleanup (can be ignored):', e)
        }
      }
    }
  }, [])

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!speechEnabled || !synthRef.current) return

    const lastMessage = gameLog[gameLog.length - 1]
    if (lastMessage && lastMessage.type === 'assistant' && lastMessage.content !== lastSpokenRef.current) {
      lastSpokenRef.current = lastMessage.content
      speakText(lastMessage.content)
    }
  }, [gameLog, speechEnabled])

  const speakText = (text: string) => {
    if (!synthRef.current) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    utterance.pitch = 1
    utterance.volume = 1

    synthRef.current.speak(utterance)
  }

  const toggleDrivingMode = async () => {
    console.log('=== toggleDrivingMode clicked ===')
    console.log('recognitionRef.current exists:', !!recognitionRef.current)
    console.log('Current drivingMode:', drivingMode)
    
    if (!recognitionRef.current) {
      console.error('Recognition not initialized!')
      alert('Speech recognition is not supported in your browser. Try Chrome or Safari.')
      return
    }

    const newDrivingMode = !drivingMode
    console.log('Setting driving mode to:', newDrivingMode)
    setDrivingMode(newDrivingMode)
    drivingModeActiveRef.current = newDrivingMode

    if (newDrivingMode) {
      console.log('Starting driving mode...')
      // Enable speech output automatically in driving mode
      setSpeechEnabled(true)
      
      // iOS requires explicit permission flow
      // Show a prompt before starting
      const userConfirmed = confirm('Driving Mode will:\n\n• Keep microphone active\n• Auto-send your voice commands\n• Read responses aloud\n\nAllow speech recognition?')
      
      if (!userConfirmed) {
        console.log('User declined speech recognition')
        setDrivingMode(false)
        drivingModeActiveRef.current = false
        return
      }
      
      // Start continuous listening
      try {
        console.log('Calling recognitionRef.current.start()...')
        recognitionRef.current.start()
        console.log('✅ Start called successfully')
        setIsListening(true)
      } catch (e: any) {
        console.error('❌ Error starting driving mode:', e)
        console.error('Error message:', e.message)
        console.error('Error name:', e.name)
        
        if (e.message && e.message.includes('already started')) {
          console.log('Recognition already started, setting isListening to true')
          setIsListening(true)
        } else {
          setDrivingMode(false)
          drivingModeActiveRef.current = false
          
          // Provide specific guidance based on error
          if (e.message && e.message.includes('not-allowed')) {
            alert('Speech recognition permission denied.\n\nTo fix:\n1. Go to Settings > Safari > Advanced\n2. Enable "Website Settings"\n3. Reload this page\n4. Allow microphone AND speech recognition when prompted')
          } else {
            alert('Could not start driving mode: ' + e.message + '\n\nPlease:\n1. Reload the page\n2. Grant ALL permissions when asked\n3. Try again')
          }
        }
      }
    } else {
      console.log('Stopping driving mode...')
      // Stop listening
      try {
        recognitionRef.current.stop()
        console.log('✅ Stop called successfully')
        setIsListening(false)
      } catch (e) {
        console.error('Error stopping driving mode:', e)
        setIsListening(false)
      }
    }
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Safari.')
      return
    }

    if (isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (e) {
        console.error('Error stopping recognition:', e)
        setIsListening(false)
      }
    } else {
      try {
        // iOS Safari requires user gesture to start
        setIsListening(true)
        recognitionRef.current.start()
      } catch (e: any) {
        console.error('Error starting recognition:', e)
        if (e.message && e.message.includes('already started')) {
          // Recognition is already running, stop and restart
          recognitionRef.current.stop()
          setTimeout(() => {
            try {
              recognitionRef.current.start()
            } catch (err) {
              console.error('Error restarting:', err)
              setIsListening(false)
            }
          }, 100)
        } else {
          setIsListening(false)
          alert('Could not start voice recognition. Please check your microphone permissions.')
        }
      }
    }
  }

  const toggleSpeechOutput = () => {
    const newState = !speechEnabled
    setSpeechEnabled(newState)
    
    if (!newState && synthRef.current) {
      synthRef.current.cancel()
    }
  }

  const buildSystemPrompt = (state: GameState): string => {
    const genreData = genres.find(g => g.id === state.genre)
    
    return `You are the Game Master for a ${genreData?.name} RPG adventure. The player's character is named ${state.characterName}.

CURRENT GAME STATE:
- Health: ${state.health}/${state.maxHealth}
- Stamina: ${state.stamina}/${state.maxStamina}
- Gold: ${state.gold}
- Level: ${state.level}
- Inventory: ${state.inventory.join(', ') || 'Empty'}

RULES:
1. Create an engaging, immersive narrative in the ${genreData?.name} genre
2. Respond to the player's actions with vivid descriptions and consequences
3. Present choices and challenges appropriate to the genre
4. Track combat, item usage, and resource management
5. When combat occurs, describe outcomes and update health/stamina accordingly
6. When items are found, mention them clearly so they can be added to inventory
7. Keep responses concise but descriptive (a sentence-2 paragraphs max) change length depending on context (in combat, exploring ext.)
8. Maintain consistency with the current game state
9. Create a balance between story, exploration, and action

IMPORTANT: If the player takes damage, finds items, spends gold, or gains experience, make it VERY CLEAR in your response with specific numbers. For example:
- "You take 15 damage from the goblin's attack!"
- "You find a Health Potion and 25 gold coins!"
- "You spend 50 gold to buy the sword."

Now respond to the player's action as the Game Master.`
  }

  const parseAndUpdateGameState = (response: string) => {
    const damageMatch = response.match(/(?:take|took|lose|lost)\s+(\d+)\s+(?:damage|health)/i)
    if (damageMatch) {
      const damage = parseInt(damageMatch[1])
      setGameState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage)
      }))
    }

    const healMatch = response.match(/(?:heal|restore|gain|recover)\s+(\d+)\s+(?:health|hp)/i)
    if (healMatch) {
      const healing = parseInt(healMatch[1])
      setGameState(prev => ({
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + healing)
      }))
    }

    const goldFoundMatch = response.match(/(?:find|found|discover|gain)\s+(\d+)\s+gold/i)
    if (goldFoundMatch) {
      const gold = parseInt(goldFoundMatch[1])
      setGameState(prev => ({
        ...prev,
        gold: prev.gold + gold
      }))
    }

    const goldSpentMatch = response.match(/(?:spend|spent|pay|paid|cost)\s+(\d+)\s+gold/i)
    if (goldSpentMatch) {
      const gold = parseInt(goldSpentMatch[1])
      setGameState(prev => ({
        ...prev,
        gold: Math.max(0, prev.gold - gold)
      }))
    }

    const itemMatch = response.match(/(?:find|found|discover|obtain|get)\s+(?:a|an|the)\s+([A-Z][a-zA-Z\s]+?)(?:\s+and|\s+in|\.|\!)/i)
    if (itemMatch) {
      const item = itemMatch[1].trim()
      if (item.length < 30 && item.length > 3) {
        setGameState(prev => ({
          ...prev,
          inventory: [...prev.inventory, item]
        }))
      }
    }
  }

  const handleSendCommand = async () => {
    if (!userInput.trim() || isLoading) return

    const userCommand = userInput
    setUserInput('')
    setIsLoading(true)

    setGameLog(prev => [...prev, { type: 'user', content: userCommand }])

    try {
      const systemPrompt = buildSystemPrompt(gameState)

      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: userCommand }
      ]

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const assistantResponse = data.content[0].text

      setGameLog(prev => [...prev, { type: 'assistant', content: assistantResponse }])

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userCommand },
        { role: 'assistant', content: assistantResponse }
      ])

      parseAndUpdateGameState(assistantResponse)

    } catch (error) {
      console.error("Error calling Claude API:", error)
      setGameLog(prev => [...prev, { 
        type: 'system', 
        content: 'Error: Failed to get response. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGame = async () => {
    if (!authReady) {
      alert('Authentication not ready. Please wait a moment and try again.')
      return
    }

    setIsSaving(true)
    try {
      const saveId = await saveGame(gameState, conversationHistory, gameLog, currentSaveId)
      setCurrentSaveId(saveId)
      setShowSaveDialog(false)
      alert('Game saved successfully!')
    } catch (error) {
      console.error('Error saving game:', error)
      alert('Failed to save game. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadSaves = async () => {
    if (!authReady) {
      alert('Authentication not ready. Please wait a moment.')
      return
    }

    try {
      const saves = await listSaves()
      setSavedGames(saves)
      setScreen('load-game')
    } catch (error) {
      console.error('Error loading saves:', error)
      alert('Failed to load saved games.')
    }
  }

  const handleLoadGame = async (save: SavedGame) => {
    try {
      setGameState({
        characterName: save.characterName,
        genre: save.genre as Genre,
        health: save.health,
        maxHealth: save.maxHealth,
        stamina: save.stamina,
        maxStamina: save.maxStamina,
        gold: save.gold,
        inventory: save.inventory,
        level: save.level
      })
      setConversationHistory(save.conversationHistory)
      setGameLog(save.gameLog)
      setCurrentSaveId(save.id)
      setScreen('playing')
    } catch (error) {
      console.error('Error loading game:', error)
      alert('Failed to load game.')
    }
  }

  const handleDeleteSave = async (saveId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this save?')) {
      return
    }

    try {
      await deleteSave(saveId)
      const saves = await listSaves()
      setSavedGames(saves)
    } catch (error) {
      console.error('Error deleting save:', error)
      alert('Failed to delete save.')
    }
  }

  const handleStartNewGame = () => {
    setScreen('genre-selection')
  }

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre)
    setScreen('character-creation')
  }

  const handleStartGame = async () => {
    if (!characterName.trim() || !selectedGenre) return

    const startingInventory: Record<Genre, string[]> = {
      fantasy: ['Rusty Sword', 'Health Potion'],
      scifi: ['Laser Pistol', 'Med-Kit'],
      mystery: ['Magnifying Glass', 'Notebook'],
      horror: ['Flashlight', 'First Aid Kit'],
      'post-apocalyptic': ['Pipe Wrench', 'Water Bottle'],
      cyberpunk: ['Data Pad', 'Stim Pack']
    }

    const newGameState = {
      characterName,
      genre: selectedGenre,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      gold: 50,
      inventory: startingInventory[selectedGenre],
      level: 1
    }

    setGameState(newGameState)
    setConversationHistory([])
    setCurrentSaveId(null)
    setScreen('playing')
    setIsLoading(true)

    // Show loading message
    setGameLog([
      { type: 'system', content: 'The Game Master is preparing your adventure...' }
    ])

    try {
      const genreData = genres.find(g => g.id === selectedGenre)
      
      // Create opening prompt for Claude
      const openingPrompt = `You are the Game Master starting a new ${genreData?.name} RPG adventure.

The player's character is named ${characterName}.

STARTING STATE:
- Health: 100/100
- Stamina: 100/100
- Gold: 50
- Level: 1
- Starting Inventory: ${startingInventory[selectedGenre].join(', ')}

Create an immersive opening scene that:
1. Introduces the world and setting in the ${genreData?.name} genre
2. Describes where ${characterName} is and what they see/hear/feel
3. Sets up the initial situation or hook for the adventure
4. Ends with what ${characterName} can do or where they can go

Keep it engaging but concise (a couple sentences-2 paragraphs max). Make the player feel immediately immersed in the world.`

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are an expert Game Master for tabletop RPGs. Create vivid, immersive opening scenes that hook players immediately.",
          messages: [
            { role: 'user', content: openingPrompt }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const openingScene = data.content[0].text

      // Set the opening scene as the first message
      setGameLog([
        { type: 'assistant', content: openingScene }
      ])

      // Add to conversation history
      setConversationHistory([
        { role: 'user', content: openingPrompt },
        { role: 'assistant', content: openingScene }
      ])

    } catch (error) {
      console.error("Error generating opening:", error)
      
      // Fallback to a generic message if API fails
      const genreData = genres.find(g => g.id === selectedGenre)
      setGameLog([
        { type: 'assistant', content: `Welcome, ${characterName}! Your ${genreData?.name} adventure begins now. What would you like to do?` }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToMenu = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setScreen('main-menu')
    setSelectedGenre(null)
    setCharacterName('')
    setGameLog([])
    setConversationHistory([])
    setCurrentSaveId(null)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return 'Unknown date'
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Main Menu Screen
  if (screen === 'main-menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-5xl md:text-6xl font-bold text-amber-400 tracking-wide">
              Epic Quest
            </h1>
            <p className="text-slate-400 text-lg">Voice-Controlled RPG Adventure</p>
            <Badge variant="outline" className="text-amber-400 border-amber-400">
              Powered by Claude AI
            </Badge>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={handleStartNewGame}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
              >
                <Play className="mr-2" size={24} />
                Start New Adventure
              </Button>
              
              <Button
                onClick={handleLoadSaves}
                disabled={!authReady}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              >
                <Download className="mr-2" size={24} />
                Load Saved Game
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-slate-500 text-sm">
            Steps 5 & 6 Complete: Voice Control ✓
          </div>
        </div>
      </div>
    )
  }

  // Load Game Screen
  if (screen === 'load-game') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleBackToMenu}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back to Menu
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-amber-400">Load Game</h2>
            <p className="text-slate-400">Choose a saved game to continue your adventure</p>
          </div>

          <div className="space-y-4">
            {savedGames.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400">
                  <p>No saved games found.</p>
                  <p className="text-sm mt-2">Start a new adventure to create your first save!</p>
                </CardContent>
              </Card>
            ) : (
              savedGames.map((save) => {
                const genreData = genres.find(g => g.id === save.genre)
                const Icon = genreData?.icon || Sparkles

                return (
                  <Card
                    key={save.id}
                    onClick={() => handleLoadGame(save)}
                    className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${genreData?.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="text-white" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-amber-400">{save.characterName}</h3>
                            <p className="text-slate-400 text-sm">{genreData?.name} • Level {save.level}</p>
                            <div className="mt-2 flex gap-4 text-sm text-slate-300">
                              <span>❤️ {save.health}/{save.maxHealth}</span>
                              <span>⚡ {save.stamina}/{save.maxStamina}</span>
                              <span>💰 {save.gold}</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-2">Saved: {formatDate(save.savedAt)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteSave(save.id, e)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }

  // Genre Selection Screen
  if (screen === 'genre-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleBackToMenu}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back to Menu
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-amber-400">Choose Your Genre</h2>
            <p className="text-slate-400">Select the type of adventure you'd like to experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {genres.map((genre) => {
              const Icon = genre.icon
              return (
                <Card
                  key={genre.id}
                  onClick={() => handleGenreSelect(genre.id)}
                  className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all group"
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${genre.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    <CardTitle className="text-amber-400 group-hover:text-amber-300">
                      {genre.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {genre.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Character Creation Screen
  if (screen === 'character-creation') {
    const selectedGenreData = genres.find(g => g.id === selectedGenre)
    const Icon = selectedGenreData?.icon || Sparkles

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setScreen('genre-selection')}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2" size={20} />
              Back
            </Button>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${selectedGenreData?.color} flex items-center justify-center mb-3`}>
                <Icon className="text-white" size={32} />
              </div>
              <CardTitle className="text-2xl text-amber-400">
                {selectedGenreData?.name}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Create your character to begin your adventure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="characterName" className="text-slate-300">
                  Character Name
                </Label>
                <Input
                  id="characterName"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter your character's name..."
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStartGame()
                    }
                  }}
                />
              </div>

              <Button
                onClick={handleStartGame}
                disabled={!characterName.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
              >
                <Play className="mr-2" size={24} />
                Begin Adventure
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Playing Screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-amber-400 tracking-wide">
              {gameState.characterName}
            </h1>
            <p className="text-slate-400 text-sm">
              {genres.find(g => g.id === gameState.genre)?.name} • Level {gameState.level}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              <Settings size={18} />
            </Button>
            <Button
              onClick={() => setShowSaveDialog(true)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white"
              disabled={!authReady}
            >
              <SaveIcon className="mr-2" size={18} />
              Save
            </Button>
            <Button
              onClick={handleBackToMenu}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              Menu
            </Button>
          </div>
        </div>

        {/* Voice Controls Banner */}
        {(voiceEnabled || speechEnabled || drivingMode) && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  {drivingMode && (
                    <div className="flex items-center gap-2">
                      <Mic className="text-green-400 animate-pulse" size={16} />
                      <span className="text-sm text-green-300 font-bold">🚗 DRIVING MODE: Always Listening</span>
                    </div>
                  )}
                  {!drivingMode && voiceEnabled && (
                    <div className="flex items-center gap-2">
                      <Mic className="text-purple-400" size={16} />
                      <span className="text-sm text-purple-300">Voice Input: ON</span>
                    </div>
                  )}
                  {speechEnabled && (
                    <div className="flex items-center gap-2">
                      <Volume2 className="text-blue-400" size={16} />
                      <span className="text-sm text-blue-300">Voice Output: ON</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400">Configure in Settings</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Stats */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-amber-400">Character Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Health */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="text-red-500" size={20} />
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">Health</div>
                    <div className="text-lg font-bold text-white">
                      {gameState.health}/{gameState.maxHealth}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${(gameState.health / gameState.maxHealth) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stamina */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-500" size={20} />
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">Stamina</div>
                    <div className="text-lg font-bold text-white">
                      {gameState.stamina}/{gameState.maxStamina}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${(gameState.stamina / gameState.maxStamina) * 100}%` }}
                  />
                </div>
              </div>

              {/* Gold */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold">
                  G
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-300">Gold</div>
                  <div className="text-lg font-bold text-white">{gameState.gold}</div>
                </div>
              </div>
            </div>

            {/* Inventory Items */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Package className="text-blue-500" size={18} />
                <div className="text-sm text-slate-400">Inventory ({gameState.inventory.length} items):</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {gameState.inventory.length > 0 ? (
                  gameState.inventory.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Empty</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Log */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-amber-400">Adventure Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 md:h-80 w-full rounded-md border border-slate-700 bg-slate-900/50 p-4">
              <div className="space-y-4">
                {gameLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`${
                      entry.type === 'user'
                        ? 'text-blue-300 font-semibold'
                        : entry.type === 'assistant'
                        ? 'text-slate-200'
                        : 'text-amber-400 italic'
                    }`}
                  >
                    {entry.type === 'user' && (
                      <span className="text-blue-500 mr-2">You:</span>
                    )}
                    {entry.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area with Voice Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendCommand()
                  }
                }}
                placeholder={isListening ? "Listening..." : "Type your action... or use the microphone button"}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-20 resize-none"
                disabled={isListening}
              />
              <div className="flex gap-2">
                {recognitionRef.current && !drivingMode && (
                  <Button
                    onClick={toggleVoiceInput}
                    variant="outline"
                    className={`border-slate-700 ${isListening ? 'bg-red-600 text-white border-red-600' : 'text-slate-300 hover:text-white'}`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="mr-2 animate-pulse" size={18} />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2" size={18} />
                        Voice
                      </>
                    )}
                  </Button>
                )}
                {recognitionRef.current && (
                  <Button
                    onClick={toggleDrivingMode}
                    variant="outline"
                    className={`border-slate-700 ${drivingMode ? 'bg-green-600 text-white border-green-600' : 'text-slate-300 hover:text-white'}`}
                  >
                    {drivingMode ? (
                      <>
                        <MicOff className="mr-2 animate-pulse" size={18} />
                        Driving ON
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2" size={18} />
                        Driving
                      </>
                    )}
                  </Button>
                )}
                <Button
                  data-send-command
                  onClick={handleSendCommand}
                  disabled={isLoading || !userInput.trim() || (isListening && !drivingMode)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Claude is thinking...
                    </>
                  ) : (
                    <>
                      <Sword className="mr-2" size={18} />
                      Send Command
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          Steps 5 & 6 Complete: Voice Control ✓ | Full Experience Enabled
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Voice Settings</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure voice input and output preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Voice Input Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mic className="text-purple-400" size={18} />
                  <Label className="text-slate-200">Voice Input</Label>
                </div>
                <p className="text-xs text-slate-400">Speak your commands using the microphone</p>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
                disabled={!recognitionRef.current}
              />
            </div>

            {/* Voice Output Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="text-blue-400" size={18} />
                  <Label className="text-slate-200">Voice Output</Label>
                </div>
                <p className="text-xs text-slate-400">Hear the story read aloud automatically</p>
              </div>
              <Switch
                checked={speechEnabled}
                onCheckedChange={toggleSpeechOutput}
                disabled={!synthRef.current}
              />
            </div>

            {/* Driving Mode Info */}
            <div className="pt-4 border-t border-slate-700">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚗</span>
                  <Label className="text-slate-200 text-lg">Driving Mode</Label>
                </div>
                <p className="text-sm text-slate-300">
                  For hands-free operation, use the <strong className="text-green-400">"Driving"</strong> button in the game.
                </p>
                <ul className="text-xs text-slate-400 space-y-1 ml-4 list-disc">
                  <li>Mic stays on continuously</li>
                  <li>Commands auto-send after speech</li>
                  <li>Voice output enabled automatically</li>
                  <li>Perfect for iPhone and driving!</li>
                </ul>
              </div>
            </div>

            {/* Speech Rate Slider */}
            {speechEnabled && (
              <div className="space-y-2">
                <Label className="text-slate-200">Speech Speed: {speechRate.toFixed(1)}x</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-400">Adjust how fast the story is read aloud</p>
              </div>
            )}

            {/* Browser Support Info */}
            <div className="pt-4 border-t border-slate-700 space-y-2">
              <p className="text-xs text-slate-400">
                {!recognitionRef.current && '⚠️ Voice input not supported in this browser'}
                {!synthRef.current && '⚠️ Voice output not supported in this browser'}
                {recognitionRef.current && synthRef.current && '✓ All voice features supported'}
              </p>
            </div>

            <Button
              onClick={() => setShowSettings(false)}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Save Game</DialogTitle>
            <DialogDescription className="text-slate-400">
              {currentSaveId 
                ? 'Update your existing save or create a new one?'
                : 'Your game will be saved to the cloud.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={handleSaveGame}
              disabled={isSaving}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2" size={18} />
                  {currentSaveId ? 'Update Save' : 'Save Game'}
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowSaveDialog(false)}
              variant="outline"
              className="w-full border-slate-700"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App