'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ChatResponse, Role } from '@/types/chat'
import { Clipboard, Calendar, CheckSquare, ListTodo, Send, Plus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { API_ENDPOINTS, INITIAL_MESSAGES, ASSISTANT_CONFIG } from '@/config/constants'
import ReactMarkdown from 'react-markdown'
import LoadingIndicator from './business-plan/LoadingIndicator'

/**
 * Journal starter prompts for business owners
 * Each item represents a common business task that the AI can help with
 */
const JOURNAL_STARTERS = [
  {
    title: "Marketing Strategy",
    prompt: "Help me create a marketing strategy for my small business focusing on social media and content marketing.",
  },
  {
    title: "Daily Tasks",
    prompt: "Help me organize my tasks for today. I need to focus on customer outreach, inventory management, and team meetings.",
  },
  {
    title: "Competitor Analysis",
    prompt: "Help me analyze my top 3 competitors and identify opportunities to differentiate my business.",
  },
  {
    title: "Customer Feedback",
    prompt: "I've collected customer feedback from recent sales. Help me organize it and identify actionable improvements.",
  },
  {
    title: "Sales Pipeline",
    prompt: "Help me create a better sales pipeline process to increase conversion rates.",
  },
  {
    title: "Team Management",
    prompt: "I'm struggling with delegation and team management. Help me develop a better approach.",
  },
  {
    title: "Business Metrics",
    prompt: "What key metrics should I be tracking for my small business? Help me set up a tracking system.",
  },
  {
    title: "Content Calendar",
    prompt: "Help me create a 3-month content calendar for my business blog and social media.",
  }
];

/**
 * Interface for the SmartJournal component props
 */
interface SmartJournalProps {
  conversationId?: string
  onConversationCreated?: (id: string) => void
  onTodoListCreated?: (todoList: any) => void
}

/**
 * Store thread IDs for conversations
 * This map associates conversation IDs with their corresponding OpenAI thread IDs
 * It's used to maintain continuity in conversations across sessions
 */
const threadMap = new Map<string, string>();

/**
 * SmartJournal component that extends chat functionality with business-specific features
 * Includes task extraction, journal entry templates, and activity tracking
 */
export default function SmartJournal({ 
  conversationId, 
  onConversationCreated,
  onTodoListCreated
}: SmartJournalProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: `${ASSISTANT_CONFIG.INSTRUCTIONS}\n\nYou are now in Smart Journal mode. Help the business owner track activities, brainstorm ideas, and manage tasks. When the user discusses activities or tasks, identify and suggest creating a to-do list from them. Organize tasks logically with clear, actionable items. For each task, suggest a priority level (high, medium, low) when appropriate.`
    },
    {
      role: 'assistant',
      content: "Welcome to your Smart Business Journal! I'm here to help you track your business activities, brainstorm ideas, and manage your tasks. What would you like to work on today?"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showStarters, setShowStarters] = useState(false)
  const [extractingTasks, setExtractingTasks] = useState(false)
  const [processingResponseId, setProcessingResponseId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load existing conversation if ID is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([
        {
          role: 'system',
          content: `${ASSISTANT_CONFIG.INSTRUCTIONS}\n\nYou are now in Smart Journal mode. Help the business owner track activities, brainstorm ideas, and manage tasks. When the user discusses activities or tasks, identify and suggest creating a to-do list from them. Organize tasks logically with clear, actionable items. For each task, suggest a priority level (high, medium, low) when appropriate.`
        },
        {
          role: 'assistant',
          content: "Welcome to your Smart Business Journal! I'm here to help you track your business activities, brainstorm ideas, and manage your tasks. What would you like to work on today?"
        }
      ])
    }
  }, [conversationId])

  /**
   * Loads a conversation by ID from the API
   * @param id - The conversation ID to load
   */
  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (!response.ok) throw new Error('Failed to load conversation')
      const data = await response.json()
      
      // Store the threadId if it exists
      if (data.threadId) {
        threadMap.set(id, data.threadId);
      }
      
      // Ensure system message is included
      const systemMessage = {
        role: 'system' as Role,
        content: `${ASSISTANT_CONFIG.INSTRUCTIONS}\n\nYou are now in Smart Journal mode. Help the business owner track activities, brainstorm ideas, and manage tasks. When the user discusses activities or tasks, identify and suggest creating a to-do list from them. Organize tasks logically with clear, actionable items. For each task, suggest a priority level (high, medium, low) when appropriate.`
      }
      
      const conversationMessages = data.messages.map((msg: any) => ({
        role: msg.role as Role,
        content: msg.content,
        id: msg.id
      }))
      
      setMessages([systemMessage, ...conversationMessages])
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  /**
   * Saves a new conversation to the API
   * @param title - Title for the conversation
   * @param newMessages - Messages to save
   * @param threadId - OpenAI thread ID for continuity
   */
  const saveConversation = async (title: string, newMessages: ChatMessage[], threadId?: string) => {
    try {
      // Filter out system messages when saving
      const messagesToSave = newMessages.filter(msg => msg.role !== 'system')
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          messages: messagesToSave.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          threadId // Include the OpenAI thread ID
        }),
      })

      if (!response.ok) throw new Error('Failed to save conversation')
      
      const data = await response.json()
      
      // Store the threadId if it exists
      if (threadId && data.id) {
        threadMap.set(data.id, threadId);
      }
      
      if (onConversationCreated) {
        onConversationCreated(data.id)
      }
      return data
    } catch (error) {
      console.error('Error saving conversation:', error)
      toast.error('Failed to save conversation')
    }
  }

  /**
   * Updates an existing conversation in the API
   * @param id - The conversation ID to update
   * @param newMessages - New messages to save
   */
  const updateConversation = async (id: string, newMessages: ChatMessage[]) => {
    try {
      // Filter out system messages when saving
      const messagesToSave = newMessages.filter(msg => msg.role !== 'system')
      
      // Get the threadId from the map
      const threadId = threadMap.get(id);
      
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSave.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          threadId // Include the OpenAI thread ID if available
        }),
      })

      if (!response.ok) throw new Error('Failed to update conversation')
    } catch (error) {
      console.error('Error updating conversation:', error)
      toast.error('Failed to update conversation')
    }
  }

  /**
   * Gets the relevant context messages for the API
   * Manages the context window to stay within token limits
   * @param allMessages - All messages in the conversation
   * @param newMessage - New message being added
   * @returns Filtered messages to send to the API
   */
  const getContextMessages = (allMessages: ChatMessage[], newMessage: ChatMessage): ChatMessage[] => {
    // Always include the system message
    const systemMessage = allMessages.find(m => m.role === 'system');
    const contextMessages = systemMessage ? [systemMessage] : [];
    
    // Add the most recent messages up to the limit
    const recentMessages = [...allMessages.filter(m => m.role !== 'system'), newMessage]
      .slice(-ASSISTANT_CONFIG.MAX_CONTEXT_MESSAGES);
    
    // Calculate total content length (rough approximation of tokens)
    let totalLength = 0;
    const messagesToInclude: ChatMessage[] = [];
    
    for (const msg of recentMessages.reverse()) { // Start from most recent
      const messageLength = msg.content.length;
      if (totalLength + messageLength > ASSISTANT_CONFIG.MAX_CONTEXT_LENGTH) {
        break;
      }
      messagesToInclude.unshift(msg); // Add to start to maintain order
      totalLength += messageLength;
    }
    
    return [...contextMessages, ...messagesToInclude];
  }

  /**
   * Scrolls the chat container to the bottom
   * Used when new messages are added
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Handles form submit for sending a message
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    await sendMessage(input.trim())
  }

  /**
   * Sends a message to the API and processes the response
   * @param messageContent - Content of the message to send
   */
  const sendMessage = async (messageContent: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const isFirstMessage = !conversationId && messages.length <= 2 // Account for system message
      const contextMessages = getContextMessages(messages, userMessage);
      
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: contextMessages,
          isFirstMessage,
          conversationId: conversationId || undefined,
          isJournalMode: true // Flag to use the Smart Journal assistant
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to send message')
      }

      const data: ChatResponse & { title?: string, threadId?: string } = await response.json()
      
      // Store the threadId if it exists
      if (data.threadId && conversationId) {
        threadMap.set(conversationId, data.threadId);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
        id: data.id
      }

      const newMessages = [...messages, userMessage, assistantMessage]
      setMessages(newMessages)

      // If this is a new conversation, save it with the generated title
      if (isFirstMessage && data.title) {
        // Pass the threadId to be stored with the conversation
        await saveConversation(data.title, newMessages, data.threadId)
      } else if (conversationId) {
        // Update existing conversation
        await updateConversation(conversationId, newMessages)
      }
      
      // Check if the latest messages contain task-like content that could be extracted
      checkForTaskContent(newMessages);
    } catch (error) {
      console.error('Chat error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Checks if content contains task-like elements using a scoring system
   * @param content - The text content to analyze
   * @returns boolean indicating if content has task elements
   */
  const hasTaskContent = (content: string): boolean => {
    // Initialize score
    let score = 0;
    const contentLower = content.toLowerCase();
    const debugInfo: Record<string, number> = {}; // For debugging
    
    // Task indicators - words and phrases that suggest task content
    const taskIndicators = [
      { term: 'task', weight: 2 },
      { term: 'tasks', weight: 2 },
      { term: 'to do', weight: 3 },
      { term: 'to-do', weight: 3 },
      { term: 'todo', weight: 3 },
      { term: 'checklist', weight: 3 },
      { term: 'action item', weight: 3 },
      { term: 'action items', weight: 3 },
      { term: 'step', weight: 1 },
      { term: 'steps', weight: 2 },
      { term: 'follow up', weight: 2 },
      { term: 'follow-up', weight: 2 },
      { term: 'priority', weight: 2 },
      { term: 'deadline', weight: 2 },
      { term: 'schedule', weight: 1 },
      { term: 'assign', weight: 1 },
      { term: 'complete', weight: 1 },
      { term: 'finish', weight: 1 },
      { term: 'implement', weight: 1 },
      { term: 'plan', weight: 1 },
      { term: 'goals', weight: 1 },
      { term: 'objectives', weight: 2 },
      { term: 'milestones', weight: 2 },
      { term: 'deliverables', weight: 2 }
    ];
    
    // Add score for task indicator words
    let taskWordsScore = 0;
    taskIndicators.forEach(({ term, weight }) => {
      // Count occurrences
      const regex = new RegExp(term, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        const termScore = matches.length * weight;
        taskWordsScore += termScore;
        debugInfo[`term_${term}`] = termScore;
      }
    });
    score += taskWordsScore;
    debugInfo.taskWordsTotal = taskWordsScore;
    
    // List patterns - structural indicators of lists
    const listPatterns = [
      { pattern: /^\s*[\d]+\.\s+.+/gm, weight: 3 },  // Numbered lists (1. Item)
      { pattern: /^\s*[\-\*•]\s+.+/gm, weight: 3 },   // Bullet points (- Item, * Item, • Item)
      { pattern: /^\s*[\[\(]?[\w\d][\]\)]?\s+.+/gm, weight: 2 }, // Lettered lists (a) Item, [A] Item
      { pattern: /first,?\s+.*second,?\s+.*third/i, weight: 2 }, // Sequential language
      { pattern: /^\s*step\s+[\d]+:?\s+.+/gim, weight: 3 }, // Step indicators (Step 1: Do this)
    ];
    
    // Add score for list-like structures
    let listStructureScore = 0;
    listPatterns.forEach(({ pattern, weight }, index) => {
      const matches = content.match(pattern);
      if (matches) {
        // More matches = higher score
        const patternScore = Math.min(matches.length * weight, 10); // Cap at 10 to prevent overweighting
        listStructureScore += patternScore;
        debugInfo[`list_pattern_${index}`] = patternScore;
      }
    });
    score += listStructureScore;
    debugInfo.listStructureTotal = listStructureScore;
    
    // Check for multiple lines that might be tasks
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const shortLines = lines.filter(line => line.length < 100 && line.length > 10);
    
    // If we have multiple short lines, add to score
    let shortLinesScore = 0;
    if (shortLines.length >= 3) {
      shortLinesScore = Math.min(shortLines.length, 5);
      score += shortLinesScore;
    }
    debugInfo.shortLinesScore = shortLinesScore;
    
    // Additional heuristic: Check for task-like phrases
    const taskPhrasePatterns = [
      { pattern: /you\s+(?:should|need\s+to|must|could|can|might\s+want\s+to)\s+[\w\s]+/gi, weight: 2 },
      { pattern: /(?:consider|try|attempt|begin|start)\s+[\w\s]+ing/gi, weight: 2 },
      { pattern: /(?:important|essential|critical|necessary|recommended)\s+to\s+[\w\s]+/gi, weight: 2 }
    ];
    
    // Add score for task-like phrases
    let taskPhrasesScore = 0;
    taskPhrasePatterns.forEach(({ pattern, weight }, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const phraseScore = matches.length * weight;
        taskPhrasesScore += phraseScore;
        debugInfo[`task_phrase_${index}`] = phraseScore;
      }
    });
    score += taskPhrasesScore;
    debugInfo.taskPhrasesTotal = taskPhrasesScore;
    
    // Check for time-related terms which often indicate tasks
    const timePatterns = [
      /\b(?:today|tomorrow|next week|next month|by \w+day)\b/gi,
      /\b(?:morning|afternoon|evening|night)\b/gi,
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi
    ];
    
    // Add score for time-related terms
    let timeTermsScore = 0;
    timePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const timeScore = matches.length;
        timeTermsScore += timeScore;
        debugInfo[`time_pattern_${index}`] = timeScore;
      }
    });
    score += timeTermsScore;
    debugInfo.timeTermsTotal = timeTermsScore;
    
    // Threshold for considering content as task-like
    // This can be adjusted based on testing
    const TASK_THRESHOLD = 5;
    
    debugInfo.totalScore = score;
    debugInfo.threshold = TASK_THRESHOLD;
    
    // Log debug info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Task detection score:', score, 'Threshold:', TASK_THRESHOLD);
      console.log('Task detection details:', debugInfo);
    }
    
    return score >= TASK_THRESHOLD;
  };

  /**
   * Checks if recent messages contain task-like content
   * Offers to extract tasks if appropriate
   * @param messages - Recent conversation messages to analyze
   */
  const checkForTaskContent = (messages: ChatMessage[]) => {
    // This is a simplified version - in a real implementation, we might use more
    // sophisticated techniques to detect task-like content
    const recentMessages = messages.slice(-4); // Get last few messages
    
    // Check if any recent messages contain task indicators
    const containsTaskIndicators = recentMessages.some(msg => 
      hasTaskContent(msg.content)
    );
    
    if (containsTaskIndicators) {
      // In a more advanced implementation, we might show a UI element 
      // asking if the user wants to extract tasks
      toast.info('It looks like you discussed some tasks. Would you like to create a structured to-do list?', {
        autoClose: 10000,
        closeOnClick: true,
        onClick: () => extractTodoList(messages),
        closeButton: true
      });
    }
  }
  
  /**
   * Extracts a todo list from conversation content
   * @param messages - Messages to analyze for task content
   */
  const extractTodoList = async (messagesToAnalyze: ChatMessage[]) => {
    setExtractingTasks(true);
    try {
      // Get relevant message content
      const relevantMessages = messagesToAnalyze
        .filter(msg => msg.role !== 'system')
        .slice(-10) // Take last 10 non-system messages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');
      
      // Add a clear instruction to create a todo list
      const enhancedContent = `
PLEASE CREATE A TODO LIST FROM THE FOLLOWING CONVERSATION:

${relevantMessages}

I need a clear, structured todo list with priorities and due dates (if mentioned).
`;
      
      // Call the API to extract tasks
      const response = await fetch('/api/todo-list/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationId,
          conversationContent: enhancedContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract tasks');
      }
      
      const data = await response.json();
      
      if (onTodoListCreated) {
        onTodoListCreated(data);
      }
      
      toast.success('To-do list created successfully!');
      
      // Add a message to the conversation about the extracted tasks
      const systemConfirmation: ChatMessage = {
        role: 'assistant',
        content: `I've created a to-do list based on our conversation. You can find it in your task manager section.`,
      };
      
      setMessages(prev => [...prev, systemConfirmation]);
      
      if (conversationId) {
        updateConversation(conversationId, [...messages, systemConfirmation]);
      }
      
    } catch (error) {
      console.error('Error extracting tasks:', error);
      toast.error('Failed to create to-do list');
    } finally {
      setExtractingTasks(false);
    }
  };

  /**
   * Creates a new to-do list manually
   */
  const createEmptyTodoList = async () => {
    try {
      const response = await fetch('/api/todo-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New To-Do List',
          description: 'Created from Smart Journal',
          conversationId: conversationId,
          items: [],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create to-do list');
      }
      
      const data = await response.json();
      
      if (onTodoListCreated) {
        onTodoListCreated(data);
      }
      
      toast.success('Empty to-do list created successfully!');
    } catch (error) {
      console.error('Error creating empty task list:', error);
      toast.error('Failed to create to-do list');
    }
  };

  /**
   * Selects a starter prompt and sends it as a message
   * @param prompt - The starter prompt to use
   */
  const handleStarterSelect = (prompt: string) => {
    setInput(prompt);
    setShowStarters(false);
  };

  /**
   * Extracts a todo list from a specific assistant response
   * @param responseContent - The content of the assistant response
   * @param responseId - The ID of the response being processed
   */
  const extractTodoListFromResponse = async (responseContent: string, responseId: string) => {
    setProcessingResponseId(responseId);
    setExtractingTasks(true);
    try {
      // Create an enhanced prompt for the todo extraction
      const enhancedContent = `
PLEASE CREATE A TODO LIST FROM THE FOLLOWING ASSISTANT RESPONSE:

${responseContent}

I need a clear, structured todo list with priorities, categories, and descriptions.
`;
      
      // Call the API to extract tasks
      const response = await fetch('/api/todo-list/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationId,
          conversationContent: enhancedContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract tasks');
      }
      
      const data = await response.json();
      
      if (onTodoListCreated) {
        onTodoListCreated(data);
      }
      
      // Add a message to the current conversation about the todo list
      const systemConfirmation: ChatMessage = {
        role: 'assistant',
        content: `I've created a to-do list titled "${data.title}" from that response. You can find it in your task manager.`,
      };
      
      setMessages(prev => [...prev, systemConfirmation]);
      
      // Update the current conversation if we have an ID
      if (conversationId) {
        updateConversation(conversationId, [...messages, systemConfirmation]);
      }
      
      toast.success('To-do list created successfully!');
    } catch (error) {
      console.error('Error extracting tasks from response:', error);
      toast.error('Failed to create to-do list from response');
    } finally {
      setExtractingTasks(false);
      setProcessingResponseId(null);
    }
  };

  /**
   * Creates a journal entry from a specific assistant response
   * @param responseContent - The content of the assistant response
   * @param responseId - The ID of the response being processed
   */
  const createJournalEntryFromResponse = async (responseContent: string, responseId: string) => {
    setProcessingResponseId(responseId);
    try {
      // Create a new conversation with this response as the first message
      const journalTitle = `Journal Entry: ${new Date().toLocaleDateString()}`;
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: journalTitle,
          messages: [
            {
              role: 'assistant',
              content: `📝 Journal Entry (${new Date().toLocaleDateString()}):\n\n${responseContent}`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create journal entry');
      }
      
      const data = await response.json();
      
      // Add a message to the current conversation about the journal entry
      const systemConfirmation: ChatMessage = {
        role: 'assistant',
        content: `I've saved that response as a separate journal entry titled "${journalTitle}".`,
      };
      
      setMessages(prev => [...prev, systemConfirmation]);
      
      // Update the current conversation if we have an ID
      if (conversationId) {
        updateConversation(conversationId, [...messages, systemConfirmation]);
      }
      
      toast.success('Journal entry created successfully!');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to create journal entry');
    } finally {
      setProcessingResponseId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages
            .filter((message) => message.role !== 'system')
            .map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'assistant' 
                    ? 'justify-start' 
                    : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'assistant'
                      ? 'bg-blue-100 text-blue-900 relative'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  
                  {/* Action buttons for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="flex mt-2 justify-end gap-2">
                      {processingResponseId === message.id ? (
                        <span className="text-xs text-blue-600 flex items-center">
                          <LoadingIndicator size={12} /> Processing...
                        </span>
                      ) : (
                        <>
                          {/* Journal button always shows */}
                          <button
                            onClick={() => createJournalEntryFromResponse(message.content, message.id || `msg-${index}`)}
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 flex items-center gap-1 border border-blue-200"
                            title="Save as Journal Entry"
                          >
                            <Clipboard size={14} />
                            <span className="text-xs hidden sm:inline">Journal</span>
                          </button>
                          
                          {/* Todo List button only shows when content has task-like elements */}
                          {hasTaskContent(message.content) && (
                            <button
                              onClick={() => extractTodoListFromResponse(message.content, message.id || `msg-${index}`)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 flex items-center gap-1 border border-blue-200 relative animate-pulse-subtle"
                              title="Create Todo List from this response"
                            >
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                              <CheckSquare size={14} />
                              <span className="text-xs hidden sm:inline">Todo List</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick actions bar */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
        <button
          onClick={() => setShowStarters(!showStarters)}
          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
          title="Journal Starters"
        >
          <Clipboard size={20} />
        </button>
        
        <button
          onClick={() => extractTodoList(messages)}
          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 flex items-center gap-1"
          title="Extract To-Do List from Conversation"
          disabled={extractingTasks}
        >
          <CheckSquare size={20} />
          <span className="text-xs font-medium">Create Todo List</span>
        </button>
        
        <button
          onClick={createEmptyTodoList}
          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 flex items-center gap-1"
          title="Create Empty To-Do List"
        >
          <ListTodo size={20} />
          <span className="text-xs font-medium">Empty List</span>
        </button>
        
        <div className="flex-1"></div>
        
        {extractingTasks && (
          <span className="text-sm text-gray-500 flex items-center">
            <LoadingIndicator size={16} type="dots" /> Creating todo list...
          </span>
        )}
      </div>

      {/* Journal starters dropdown */}
      {showStarters && (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-2 mx-4 mb-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800">Journal Starters</h3>
            <button 
              onClick={() => setShowStarters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {JOURNAL_STARTERS.map((starter, index) => (
              <button
                key={index}
                className="text-left p-2 hover:bg-gray-100 rounded text-sm"
                onClick={() => handleStarterSelect(starter.prompt)}
              >
                {starter.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your journal entry..."
            disabled={isLoading}
            className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isLoading ? <LoadingIndicator size={20} color="white" /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  )
} 