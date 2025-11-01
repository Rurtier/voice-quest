import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Sword, 
  Heart, 
  Package, 
  Play, 
  Save, 
  Sparkles,
  Zap,
  Brain,
  Skull,
  Globe,
  Cpu,
  ArrowLeft,
  Loader2
} from 'lucide-react'

type GameScreen = 'main-menu' | 'genre-selection' | 'character-creation' | 'playing'
type Genre = 'fantasy' | 'scifi' | 'mystery' | 'horror' | 'post-apocalyptic' | 'cyberpunk'

interface GameState {
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
7. Keep responses concise but descriptive (2-4 paragraphs max)
8. Maintain consistency with the current game state
9. Create a balance between story, exploration, and action

IMPORTANT: If the player takes damage, finds items, spends gold, or gains experience, make it VERY CLEAR in your response with specific numbers. For example:
- "You take 15 damage from the goblin's attack!"
- "You find a Health Potion and 25 gold coins!"
- "You spend 50 gold to buy the sword."

Now respond to the player's action as the Game Master.`
  }

  const parseAndUpdateGameState = (response: string) => {
    // Simple parsing for damage (we'll make this more sophisticated later)
    const damageMatch = response.match(/(?:take|took|lose|lost)\s+(\d+)\s+(?:damage|health)/i)
    if (damageMatch) {
      const damage = parseInt(damageMatch[1])
      setGameState(prev => ({
        ...prev,
        health: Math.max(0, prev.health - damage)
      }))
    }

    // Parse for healing
    const healMatch = response.match(/(?:heal|restore|gain|recover)\s+(\d+)\s+(?:health|hp)/i)
    if (healMatch) {
      const healing = parseInt(healMatch[1])
      setGameState(prev => ({
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + healing)
      }))
    }

    // Parse for gold found
    const goldFoundMatch = response.match(/(?:find|found|discover|gain)\s+(\d+)\s+gold/i)
    if (goldFoundMatch) {
      const gold = parseInt(goldFoundMatch[1])
      setGameState(prev => ({
        ...prev,
        gold: prev.gold + gold
      }))
    }

    // Parse for gold spent
    const goldSpentMatch = response.match(/(?:spend|spent|pay|paid|cost)\s+(\d+)\s+gold/i)
    if (goldSpentMatch) {
      const gold = parseInt(goldSpentMatch[1])
      setGameState(prev => ({
        ...prev,
        gold: Math.max(0, prev.gold - gold)
      }))
    }

    // Parse for items found (simple version - looks for "find/found [item name]")
    const itemMatch = response.match(/(?:find|found|discover|obtain|get)\s+(?:a|an|the)\s+([A-Z][a-zA-Z\s]+?)(?:\s+and|\s+in|\.|\!)/i)
    if (itemMatch) {
      const item = itemMatch[1].trim()
      // Only add if it looks like an item (not too long, capitalized)
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

    // Add user message to log
    setGameLog(prev => [...prev, { type: 'user', content: userCommand }])

    try {
      // Build the system prompt based on genre and game state
      const systemPrompt = buildSystemPrompt(gameState)

      // Build conversation messages
      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: userCommand }
      ]

      // Call Claude API
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

      // Add assistant response to log
      setGameLog(prev => [...prev, { type: 'assistant', content: assistantResponse }])

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userCommand },
        { role: 'assistant', content: assistantResponse }
      ])

      // Parse response for game state updates
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

  const handleStartNewGame = () => {
    setScreen('genre-selection')
  }

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre)
    setScreen('character-creation')
  }

  const handleStartGame = () => {
    if (!characterName.trim() || !selectedGenre) return

    // Initialize game state based on genre
    const startingInventory: Record<Genre, string[]> = {
      fantasy: ['Rusty Sword', 'Health Potion'],
      scifi: ['Laser Pistol', 'Med-Kit'],
      mystery: ['Magnifying Glass', 'Notebook'],
      horror: ['Flashlight', 'First Aid Kit'],
      'post-apocalyptic': ['Pipe Wrench', 'Water Bottle'],
      cyberpunk: ['Data Pad', 'Stim Pack']
    }

    const welcomeMessages: Record<Genre, string> = {
      fantasy: `Welcome, ${characterName}! Your adventure begins in the kingdom of Eldoria, where ancient magic still flows through the land...`,
      scifi: `Greetings, Captain ${characterName}. Your ship has just docked at Station Meridian, on the edge of known space...`,
      mystery: `Detective ${characterName}, you've been called to investigate a peculiar case in the foggy streets of New Haven...`,
      horror: `${characterName}... you shouldn't have come here. But it's too late to turn back now. The mansion looms before you...`,
      'post-apocalyptic': `${characterName}, you wake up in the ruins of what was once a great city. The world has changed, and so must you...`,
      cyberpunk: `Welcome to Neo-Tokyo, ${characterName}. In this city of neon and shadows, everyone has secrets...`
    }

    setGameState({
      characterName,
      genre: selectedGenre,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      gold: 50,
      inventory: startingInventory[selectedGenre],
      level: 1
    })

    setGameLog([
      { type: 'system', content: welcomeMessages[selectedGenre] },
      { type: 'system', content: 'What would you like to do?' }
    ])

    setScreen('playing')
  }

  const handleBackToMenu = () => {
    setScreen('main-menu')
    setSelectedGenre(null)
    setCharacterName('')
    setGameLog([])
    setConversationHistory([])
  }

  // Main Menu Screen
  if (screen === 'main-menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl md:text-6xl font-bold text-amber-400 tracking-wide">
              Epic Quest
            </h1>
            <p className="text-slate-400 text-lg">Voice-Controlled RPG Adventure</p>
            <Badge variant="outline" className="text-amber-400 border-amber-400">
              Powered by Claude AI
            </Badge>
          </div>

          {/* Menu Options */}
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
                disabled
                className="w-full bg-slate-700 text-slate-400 py-6 text-lg cursor-not-allowed"
              >
                <Save className="mr-2" size={24} />
                Load Saved Game
                <Badge className="ml-2 bg-slate-600">Coming in Step 7</Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-slate-500 text-sm">
            Step 2 Complete: Claude AI Integration ✓
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
          {/* Header */}
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

          {/* Genre Cards */}
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
          {/* Header */}
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-amber-400 tracking-wide">
              {gameState.characterName}
            </h1>
            <p className="text-slate-400 text-sm">
              {genres.find(g => g.id === gameState.genre)?.name} • Level {gameState.level}
            </p>
          </div>
          <Button
            onClick={handleBackToMenu}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            Menu
          </Button>
        </div>

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

        {/* Input Area */}
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
                placeholder="Type your action... (e.g., 'look around', 'attack the goblin', 'open the chest')"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 min-h-20 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendCommand}
                  disabled={isLoading || !userInput.trim()}
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
          Step 2 Complete: Claude AI Integration ✓ | Next: Voice Control
        </div>
      </div>
    </div>
  )
}

export default App
