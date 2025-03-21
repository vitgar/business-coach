'use client'

import React, { useState, useEffect } from 'react'
import { HelpCircle, ListTodo, RefreshCw, ChevronLeft, FileText, Save, ArrowRight, Undo, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ClientLayout from '@/components/ClientLayout'
import SimpleChat from '@/components/chat/SimpleChat'
import { toast } from 'react-toastify'
import Link from 'next/link'

/**
 * Interface for a chat message
 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Interface for action list structure
 */
interface ActionList {
  id: string;
  title: string;
  items: string[];
  parentId?: string;
}

/**
 * Interface for conversation context
 */
interface ConversationContext {
  mainTopic: string | null;
  currentSubtopic: string | null;
  subtopicDepth: number;
  stepInCurrentTopic: number;
  completedSteps: number;
  totalSteps?: number;
  workingOnChildItems?: boolean;
  currentTopicId?: string;
  currentActionItemId?: string;
}

/**
 * HowTo Page
 * 
 * Provides a streamlined interface with chat for getting step-by-step guidance on business activities.
 * Users can ask specific questions about business activities and get detailed responses.
 * 
 * Key features:
 * 1. Ask questions about how to accomplish business tasks
 * 2. Get detailed step-by-step responses
 * 3. Create action lists from chat responses
 * 4. Save highlights or summaries from responses
 */
export default function HowToPage() {
  const { isAuthenticated, currentBusinessId } = useAuth()
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(true)
  const [currentResponse, setCurrentResponse] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const [extractedActionLists, setExtractedActionLists] = useState<ActionList[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    mainTopic: null,
    currentSubtopic: null,
    subtopicDepth: 0,
    stepInCurrentTopic: 0,
    completedSteps: 0
  })
  
  // Example questions for the placeholder rotation
  const placeholderExamples = [
    "How do I do online marketing?",
    "How do I register my business?",
    "How do I create a business plan?",
    "How do I find investors?",
    "How do I set up a website?",
    "How do I hire my first employee?",
    "How do I manage business taxes?",
    "How do I price my products?"
  ]
  
  /**
   * Creates an action list from the entire conversation history
   */
  const createActionList = async () => {
    if (conversationHistory.length === 0 || !isAuthenticated) {
      toast.error('No conversation available to create action list')
      return
    }
    
    setIsProcessing(true)
    setExtractedActionLists([])
    
    try {
      // Format the entire conversation history into a single string
      const conversationText = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'You' : 'Helper'}: ${msg.content}`)
        .join('\n\n');
      
      // Call the AI endpoint to extract hierarchical action lists
      const response = await fetch('/api/ai/extract-action-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: conversationText
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to extract action lists')
      }
      
      const data = await response.json()
      
      if (data.actionLists && data.actionLists.length > 0) {
        // Process the extracted action lists to ensure they're detailed and well-structured
        let lists = data.actionLists;
        
        // Sort lists to ensure parent lists come before their children
        lists.sort((a: ActionList, b: ActionList) => {
          // Put lists without parents (top-level) first
          if (!a.parentId && b.parentId) return -1;
          if (a.parentId && !b.parentId) return 1;
          
          // Then sort by parentId (to group children of the same parent)
          if (a.parentId && b.parentId) {
            if (a.parentId < b.parentId) return -1;
            if (a.parentId > b.parentId) return 1;
          }
          
          // Finally sort by title if needed
          return a.title.localeCompare(b.title);
        });
        
        // Set the action lists and show success message with counts
        setExtractedActionLists(lists);
        
        // Count total action items across all lists
        const totalItems = lists.reduce((sum: number, list: ActionList) => sum + list.items.length, 0);
        const topLevelLists = lists.filter((list: ActionList) => !list.parentId).length;
        const subLists = lists.filter((list: ActionList) => !!list.parentId).length;
        
        toast.success(
          `Extracted ${totalItems} action items in ${lists.length} lists ` +
          `(${topLevelLists} main categories, ${subLists} subcategories)`
        );
      } else {
        // If AI couldn't extract structured lists, fall back to basic extraction
        const basicResponse = await fetch('/api/action-items/bulk-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: conversationText,
            businessId: currentBusinessId || undefined,
            conversationId: currentConversationId || undefined,
            messageId: currentMessageId || undefined
          })
        })
        
        if (!basicResponse.ok) {
          throw new Error('Failed to create action list with basic extraction')
        }
        
        const basicData = await basicResponse.json()
        toast.success(`Created ${basicData.count} action items with basic extraction`)
      }
    } catch (error) {
      console.error('Error extracting action lists:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to extract action lists')
    } finally {
      setIsProcessing(false)
    }
  }
  
  /**
   * Saves action lists to the database
   */
  const saveActionLists = async () => {
    if (extractedActionLists.length === 0) {
      toast.info('No action lists to save')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Start with a toast notification to show progress
      const progressToast = toast.info('Starting to save action lists...', {
        autoClose: false,
        closeButton: false
      });
      
      // Create a map to store created list IDs by original ID
      const createdLists: Record<string, string> = {};
      let totalItems = 0;
      let successCount = 0;
      let errorCount = 0;
      
      // Helper function to make API calls with timeout and retry logic
      const makeApiCall = async (url: string, method: string, data: any) => {
        const maxRetries = 2;
        const timeout = 15000; // 15 seconds timeout
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data),
              signal: controller.signal
            });
            
            // Clear timeout
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`API error (${url}):`, errorData);
              throw new Error(errorData.error || `Failed with status ${response.status}`);
            }
            
            return await response.json();
          } catch (error) {
            console.error(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
            
            // If we've reached max retries, throw the error
            if (attempt === maxRetries) {
              throw error;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      };
      
      // First create all top-level lists (no parent)
      const topLevelLists = extractedActionLists.filter(list => !list.parentId);
      
      // Update progress toast
      toast.update(progressToast, { 
        render: `Creating ${topLevelLists.length} top-level lists...`
      });
      
      // Process lists in batches to prevent overwhelming the server
      const processInBatches = async (items: any[], processFn: (item: any) => Promise<void>, batchSize = 3) => {
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          await Promise.all(batch.map(processFn));
        }
      };
      
      // Process top-level lists
      await processInBatches(topLevelLists, async (list) => {
        try {
          // Create the list
          const newList = await makeApiCall('/api/action-item-lists', 'POST', {
            title: list.title,
            color: getRandomColor()
          });
          
          // Store the new list ID
          createdLists[list.id] = newList.id;
          
          // Create all items for this list
          await processInBatches(list.items, async (item) => {
            try {
              await makeApiCall('/api/action-items', 'POST', {
                content: item,
                listId: newList.id,
                conversationId: currentConversationId || null,
                messageId: null // Set to null to avoid constraint errors
              });
              
              totalItems++;
              successCount++;
            } catch (error) {
              console.error(`Failed to create item "${item.substring(0, 30)}..."`, error);
              errorCount++;
            }
          }, 5);
        } catch (error) {
          console.error(`Failed to create list "${list.title}"`, error);
          
          // Create items with bracketed prefix as fallback
          await processInBatches(list.items, async (item) => {
            try {
              await makeApiCall('/api/action-items', 'POST', {
                content: `[${list.title}] ${item}`,
                conversationId: currentConversationId || null,
                messageId: null
              });
              
              totalItems++;
              successCount++;
            } catch (error) {
              console.error(`Failed to create fallback item "${item.substring(0, 30)}..."`, error);
              errorCount++;
            }
          }, 5);
        }
      });
      
      // Update progress toast for child lists
      toast.update(progressToast, { 
        render: `Creating child lists and items...`
      });
      
      // Process child lists after all parent lists are created
      const childLists = extractedActionLists.filter(list => !!list.parentId);
      
      // Group child lists by parent ID for ordinal assignment
      const childListsByParent: Record<string, ActionList[]> = {};
      childLists.forEach(list => {
        if (list.parentId) {
          if (!childListsByParent[list.parentId]) {
            childListsByParent[list.parentId] = [];
          }
          childListsByParent[list.parentId].push(list);
        }
      });
      
      // Sort child lists within each parent group for proper ordering
      Object.keys(childListsByParent).forEach(parentId => {
        childListsByParent[parentId].sort((a, b) => a.title.localeCompare(b.title));
      });
      
      await processInBatches(childLists, async (list) => {
        // If we have the parent ID in our map, create the list with parent reference
        if (list.parentId && createdLists[list.parentId]) {
          const parentId = createdLists[list.parentId];
          
          try {
            // Determine ordinal position for this child list
            const ordinal = childListsByParent[list.parentId]
              ? childListsByParent[list.parentId].indexOf(list)
              : 0;
            
            const newList = await makeApiCall('/api/action-item-lists', 'POST', {
              title: list.title,
              color: getRandomColor(),
              parentId: parentId, // Set the parent ID reference
              ordinal: ordinal // Set the ordinal position within parent
            });
            
            // Store the new list ID
            createdLists[list.id] = newList.id;
            
            // Create all items for this list
            await processInBatches(list.items, async (item) => {
              try {
                await makeApiCall('/api/action-items', 'POST', {
                  content: item,
                  listId: newList.id,
                  conversationId: currentConversationId || null,
                  messageId: null
                });
                
                totalItems++;
                successCount++;
              } catch (error) {
                console.error(`Failed to create child item "${item.substring(0, 30)}..."`, error);
                errorCount++;
              }
            }, 5);
          } catch (error) {
            console.error(`Failed to create child list "${list.title}"`, error);
            
            // Fallback: create items with bracketed prefix showing hierarchy
            await processInBatches(list.items, async (item) => {
              try {
                // Include parent name to show hierarchy
                const parentName = extractedActionLists.find(l => l.id === list.parentId)?.title || '';
                await makeApiCall('/api/action-items', 'POST', {
                  content: `[${parentName} > ${list.title}] ${item}`,
                  conversationId: currentConversationId || null,
                  messageId: null
                });
                
                totalItems++;
                successCount++;
              } catch (error) {
                console.error(`Failed to create fallback child item "${item.substring(0, 30)}..."`, error);
                errorCount++;
              }
            }, 5);
          }
        } else {
          // If parent wasn't created successfully, create as standalone items with bracketed prefix
          await processInBatches(list.items, async (item) => {
            try {
              await makeApiCall('/api/action-items', 'POST', {
                content: `[${list.title}] ${item}`,
                conversationId: currentConversationId || null,
                messageId: null
              });
              
              totalItems++;
              successCount++;
            } catch (error) {
              console.error(`Failed to create standalone item "${item.substring(0, 30)}..."`, error);
              errorCount++;
            }
          }, 5);
        }
      });
      
      // Close the progress toast
      toast.dismiss(progressToast);
      
      // Show summary toast based on results
      if (errorCount === 0) {
        toast.success(`Successfully saved ${totalItems} action items from ${extractedActionLists.length} lists`);
      } else if (successCount > 0) {
        toast.info(`Saved ${successCount} action items, but ${errorCount} items failed to save`);
      } else {
        toast.error(`Failed to save action items. Please try again.`);
      }
    } catch (error) {
      console.error('Error saving action lists:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save action lists')
    } finally {
      setIsProcessing(false)
    }
  }
  
  /**
   * Generates a random color for action lists
   */
  const getRandomColor = () => {
    const colors = [
      'light-blue',
      'light-green',
      'light-purple',
      'light-orange',
      'light-pink',
      'light-teal',
      'light-yellow',
      'light-red'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Saves highlights or summary from the current response
   */
  const saveHighlightsSummary = async () => {
    if (!currentResponse || !isAuthenticated) {
      toast.error('No content available to save highlights')
      return
    }
    
    try {
      // First, get a concise summary of the content
      const summarizeResponse = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: currentResponse,
          maxLength: 750 // Adjust for desired summary length
        })
      })
      
      if (!summarizeResponse.ok) {
        const errorData = await summarizeResponse.json()
        throw new Error(errorData.error || 'Failed to summarize content')
      }
      
      // Get the summarized content
      const { summary } = await summarizeResponse.json()
      
      // Format the title based on the conversation context
      const title = conversationContext.mainTopic 
        ? `HowTo: ${conversationContext.mainTopic}` 
        : 'HowTo Highlights'
      
      // Add a header to the summary to indicate the original content
      const formattedSummary = `# Key Points Summary\n\n${summary}\n\n---\n\n*This is an AI-generated summary of the key information.*`
      
      // Save the summary to the database
      const saveResponse = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: formattedSummary,
          title,
          businessId: currentBusinessId || undefined,
          conversationId: currentConversationId || undefined,
          type: 'highlights'
        })
      })
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(errorData.error || 'Failed to save highlights')
      }
      
      toast.success('Highlights summary saved successfully')
    } catch (error) {
      console.error('Error saving highlights:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save highlights')
    }
  }
  
  /**
   * Callback when a new message is received from the chat
   */
  const handleNewMessage = (content: string, messageId?: string, conversationId?: string, allMessages?: Array<{role: string; content: string}>, newContext?: any) => {
    // Store the current response for highlighting
    setCurrentResponse(content)
    
    // Store IDs
    if (messageId) setCurrentMessageId(messageId)
    if (conversationId) setCurrentConversationId(conversationId)
    
    // Update conversation context if provided
    if (newContext) {
      setConversationContext(newContext)
    }
    
    // Update conversation history if provided
    if (allMessages && allMessages.length > 0) {
      // Convert to our ChatMessage format
      const formattedMessages = allMessages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        } as ChatMessage));
      
      setConversationHistory(formattedMessages);
    } else {
      // Just add this message to history
      setConversationHistory(prev => [
        ...prev, 
        { role: 'assistant', content }
      ]);
    }
    
    // Clear any previously extracted action lists
    setExtractedActionLists([])
  }

  /**
   * Callback when a user sends a new message
   */
  const handleUserMessage = (content: string) => {
    // Add user message to history
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content }
    ]);
  }

  /**
   * Helper function to return to the main topic
   */
  const handleReturnToMainTopic = () => {
    if (!conversationContext.mainTopic) return;
    
    // Add a user message indicating return to main topic
    const content = `Let's return to our main discussion about ${conversationContext.mainTopic}.`;
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content }
    ]);
    
    // Update the conversation context
    setConversationContext(prev => ({
      ...prev,
      currentSubtopic: null,
      subtopicDepth: 0,
      // Don't reset step in current topic - let the AI determine that
    }));
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <HelpCircle className="mr-3 text-blue-600" size={32} />
                How To Guide
              </h1>
              <p className="text-gray-600 mt-2">
                Ask specific questions about how to accomplish different business activities.
                Get step-by-step guidance and create action lists from the answers.
                <Link 
                  href="/howto/help" 
                  className="ml-2 text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                >
                  <HelpCircle size={14} className="mr-1" />
                  How to use this guide
                </Link>
              </p>
            </div>
            
            {/* Mobile view toggle for smaller screens */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileChatVisible(!isMobileChatVisible)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                {isMobileChatVisible ? (
                  <>
                    <ListTodo size={16} />
                    View Actions
                  </>
                ) : (
                  <>
                    <ChevronLeft size={16} />
                    Back to Chat
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Topic navigation bar - only show when in a conversation */}
          {conversationContext.mainTopic && (
            <div className="mt-3 bg-gray-50 p-2 rounded-md flex items-center flex-wrap gap-2">
              <div className="flex items-center">
                <BookOpen size={16} className="text-blue-600 mr-1" />
                <span className="text-sm font-medium">
                  Topic: {conversationContext.mainTopic}
                </span>
              </div>
              
              {conversationContext.currentSubtopic && (
                <>
                  <div className="text-gray-400 mx-1">→</div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-600">
                      Subtopic: {conversationContext.currentSubtopic}
                    </span>
                    <button 
                      onClick={handleReturnToMainTopic}
                      className="ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-600"
                      title="Return to main topic"
                    >
                      <Undo size={14} />
                    </button>
                  </div>
                </>
              )}
              
              {conversationContext.stepInCurrentTopic > 0 && (
                <div className="ml-auto text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                  Step {conversationContext.stepInCurrentTopic} 
                  {conversationContext.totalSteps ? ` of ~${conversationContext.totalSteps}` : ''}
                </div>
              )}
            </div>
          )}
        </header>
        
        {/* Authentication check */}
        {!isAuthenticated ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-700 mb-4">
              Please sign in to access the How To Guide and create action lists.
            </p>
            <button
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {/* Handle sign in */}}
            >
              Sign In
            </button>
          </div>
        ) : (
          /* Main content grid with chat and action buttons */
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Chat section - Hidden on mobile when viewing actions */}
            <div className={`${!isMobileChatVisible ? 'hidden md:block' : ''} md:col-span-4 md:h-[calc(100vh-12rem)]`}>
              <SimpleChat 
                businessId={currentBusinessId || undefined}
                placeholderExamples={placeholderExamples}
                onNewAssistantMessage={handleNewMessage}
                onUserMessage={handleUserMessage}
              />
            </div>
            
            {/* Action buttons section - Hidden on mobile when viewing chat */}
            <div className={`${isMobileChatVisible ? 'hidden md:block' : ''} md:col-span-2 md:h-[calc(100vh-12rem)] overflow-y-auto pb-6`}>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
                  <h2 className="text-lg font-semibold flex items-center">
                    <ListTodo className="mr-2" size={18} />
                    Actions
                  </h2>
                </div>
                
                <div className="p-4 flex flex-col gap-4 overflow-y-auto">
                  <button
                    onClick={createActionList}
                    disabled={conversationHistory.length === 0 || isProcessing}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors group relative"
                  >
                    {isProcessing ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <ListTodo size={18} />
                    )}
                    <span className="font-medium text-sm">Create Action List</span>
                    <div className="absolute hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      Create structured action lists from your conversation
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-solid border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
                    </div>
                  </button>
                  
                  <button
                    onClick={saveHighlightsSummary}
                    disabled={!currentResponse || isProcessing}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors relative group"
                  >
                    <Save size={18} />
                    <span className="font-medium text-sm">Save Highlights</span>
                    <div className="absolute hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      Creates a concise bullet-point summary of key information from this response
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-solid border-t-gray-800 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
                    </div>
                  </button>
                  
                  {/* Display conversation status */}
                  {conversationHistory.length > 0 && (
                    <div className="mt-2 text-sm bg-gray-50 rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">Conversation Status</span>
                        <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                          {conversationHistory.length} messages
                        </span>
                      </div>
                      
                      {conversationContext.mainTopic && (
                        <div className="text-gray-600 text-sm">
                          <div className="flex items-center mb-1">
                            <BookOpen size={14} className="text-blue-600 mr-1" />
                            <span>Topic: <span className="font-medium">{conversationContext.mainTopic}</span></span>
                          </div>
                          
                          {conversationContext.currentSubtopic && (
                            <div className="flex items-center mb-1 ml-4">
                              <ArrowRight size={12} className="text-gray-400 mr-1" />
                              <span>Subtopic: <span className="font-medium text-blue-600">{conversationContext.currentSubtopic}</span></span>
                              <button 
                                onClick={handleReturnToMainTopic}
                                className="ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-600"
                                title="Return to main topic"
                              >
                                <Undo size={12} />
                              </button>
                            </div>
                          )}
                          
                          {conversationContext.stepInCurrentTopic > 0 && (
                            <div className="flex items-center">
                              <span>Progress: Step {conversationContext.stepInCurrentTopic} 
                              {conversationContext.totalSteps ? ` of ~${conversationContext.totalSteps}` : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Display extracted action lists */}
                  {extractedActionLists.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Extracted Action Lists
                        </h3>
                        <button 
                          onClick={saveActionLists}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center text-sm"
                        >
                          <Save size={14} className="mr-1" />
                          Save All Lists
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3 max-h-[300px] overflow-y-auto">
                        {/* Render top-level action lists only */}
                        {extractedActionLists
                          .filter(list => !list.parentId)
                          .map(list => (
                            <div key={list.id} className="mb-3">
                              <div className="font-medium text-gray-800 mb-1">{list.title}</div>
                              <ul className="list-disc pl-5 mb-2">
                                {list.items.map((item, index) => (
                                  <li key={`${list.id}-item-${index}`} className="text-gray-700 mb-1">{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-auto">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">About This Feature</h3>
                    <div className="bg-blue-50 rounded p-4 text-blue-800 text-sm">
                      <p className="mb-2">
                        <strong>Create Action List</strong> - AI analyzes the conversation to extract structured action lists.
                      </p>
                      <p className="mb-2">
                        <strong>Save Highlights</strong> - Creates a concise bullet-point summary of key information from this response.
                      </p>
                      <p className="text-xs mt-3 text-blue-600">
                        Summaries are stored in the Summaries section, accessible from the navigation menu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 