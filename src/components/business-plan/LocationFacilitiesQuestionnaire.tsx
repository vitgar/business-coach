import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';

/**
 * Props for the LocationFacilitiesQuestionnaire component
 */
interface Props {
  /** ID of the business plan */
  businessPlanId: string;
  /** Callback function to be called when the questionnaire is completed */
  onComplete: (formattedText: string) => void;
}

/**
 * Represents a message in the chat interface
 */
interface Message {
  /** Content of the message */
  content: string;
  /** Role of the message sender (user or assistant) */
  role: 'user' | 'assistant' | 'system';
}

/**
 * Structure for location and facilities data
 */
interface LocationFacilitiesData {
  /** Type of location (physical, online, hybrid) */
  locationType: string;
  /** Address and details of physical locations */
  locationDetails: string;
  /** Description of the facilities and space requirements */
  facilities: string;
  /** Reasons for choosing the location */
  locationRationale: string;
  /** Information about zoning, permits, and regulatory requirements */
  regulatoryRequirements: string;
  /** Plans for future expansion or relocation */
  expansionPlans: string;
}

/**
 * Questions to guide the conversation about location and facilities
 */
const LOCATION_FACILITIES_QUESTIONS = [
  "What type of location does your business require? (physical storefront, office space, manufacturing facility, online only, home-based, etc.)",
  "For physical locations, what are the specific address details? Include size, layout, and any special features.",
  "What facilities and equipment will your business need to operate effectively?",
  "Why did you choose this location? Consider factors like proximity to customers, suppliers, transportation, etc.",
  "Are there any zoning restrictions, permits, or regulatory requirements for your location?",
  "Do you have plans for future expansion or potential relocation as your business grows?"
];

/**
 * Initial message to prompt the user about location and facilities
 */
const INITIAL_MESSAGE = {
  content: "Let's discuss your business location and facilities. This includes where your business will be located, why you've chosen this location, and what facilities or space you'll need. Please describe your business location strategy.",
  role: 'assistant' as const
};

/**
 * LocationFacilitiesQuestionnaire component
 * 
 * A chat interface for gathering information about business location and facilities
 */
export default function LocationFacilitiesQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State variables
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationFacilitiesData>({
    locationType: '',
    locationDetails: '',
    facilities: '',
    locationRationale: '',
    regulatoryRequirements: '',
    expansionPlans: ''
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to fetch existing location data
  useEffect(() => {
    async function fetchLocationData() {
      if (!businessPlanId) return;
      
      try {
        setIsDataLoading(true);
        const response = await fetch(`/api/business-plans/${businessPlanId}/location-facilities`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch location data: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.locationFacilities) {
          setLocationData(data.locationFacilities);
          
          // Add a message showing the existing data
          setMessages(prevMessages => [
            INITIAL_MESSAGE,
            {
              role: 'assistant',
              content: 'I see you already have some information about your location and facilities. You can continue our conversation to add more details or refine what you have.'
            }
          ]);
          
          // Call onComplete to update parent component with existing data
          const formattedText = formatLocationData(data.locationFacilities);
          onComplete(formattedText);
        }
      } catch (error) {
        console.error('Failed to fetch location data:', error);
        // Don't show an error toast - it's ok if no data exists yet
      } finally {
        setIsDataLoading(false);
      }
    }
    
    fetchLocationData();
  }, [businessPlanId, onComplete]);

  /**
   * Handles message submission
   * Sends user message to API and processes response
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = { content: input, role: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare all messages for API call, excluding system messages
      const apiMessages = [...messages, userMessage].filter(
        msg => msg.role !== 'system'
      );
      
      // Call the API to process the message
      const response = await fetch(`/api/business-plans/${businessPlanId}/location-facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          isFirstMessage: messages.length <= 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response to messages
      if (data.message) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.message.content 
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Update location data if it was returned
      if (data.locationFacilities) {
        setLocationData(data.locationFacilities);
        
        // Format the location data and call onComplete
        const formattedText = formatLocationData(data.locationFacilities);
        onComplete(formattedText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Formats the location data into readable text
   */
  const formatLocationData = (data: LocationFacilitiesData): string => {
    let sections = [];
    
    if (data.locationType) {
      sections.push(`## Location Type\n${data.locationType}`);
    }
    
    if (data.locationDetails) {
      sections.push(`## Location Details\n${data.locationDetails}`);
    }
    
    if (data.facilities) {
      sections.push(`## Facilities and Equipment\n${data.facilities}`);
    }
    
    if (data.locationRationale) {
      sections.push(`## Location Rationale\n${data.locationRationale}`);
    }
    
    if (data.regulatoryRequirements) {
      sections.push(`## Regulatory Requirements\n${data.regulatoryRequirements}`);
    }
    
    if (data.expansionPlans) {
      sections.push(`## Future Expansion Plans\n${data.expansionPlans}`);
    }
    
    return sections.join('\n\n');
  };

  /**
   * Handles the "Help me" button click
   * Sends a predefined help request to the API
   */
  const handleNotSure = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Add a system message for help that maintains focus on location and facilities
      const helpMessage: Message = {
        role: 'system',
        content: `The user needs help understanding location and facilities planning. Provide guidance on:

1. Different types of business locations (physical, online, hybrid)
2. Key factors in selecting a physical location
3. Considerations for space and facility requirements
4. Regulatory requirements for business locations
5. Future expansion planning

Format your response with clear headings and concise explanations for each area.`
      };
      
      // Add user question to messages
      const userQuestion: Message = {
        role: 'user',
        content: "I'm not sure about my location strategy. Can you help me understand what I should consider?"
      };
      
      setMessages(prev => [...prev, userQuestion]);
      
      // Call the API with the help request
      const response = await fetch(`/api/business-plans/${businessPlanId}/location-facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, helpMessage, userQuestion],
          isFirstMessage: messages.length <= 1
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
      const data = await response.json();
      
      // Add assistant response to messages
      if (data.message) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.message.content 
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles saving the current location data
   */
  const handleSave = () => {
    try {
      const formattedText = formatLocationData(locationData);
      console.log('Saving location data:', locationData);
      console.log('Formatted location text:', formattedText);
      
      // Call onComplete to update parent component
      onComplete(formattedText);
      
      toast.success('Location & facilities information saved');
    } catch (error) {
      console.error('Error saving location data:', error);
      toast.error('Failed to save location information');
    }
  };

  /**
   * Format location and facilities data into readable text
   */
  const formatLocationText = (data: LocationFacilitiesData): string => {
    let sections = [];
    
    if (data.locationType) {
      sections.push(`## Location Type\n${data.locationType}`);
    }
    
    if (data.locationDetails) {
      sections.push(`## Location Details\n${data.locationDetails}`);
    }
    
    if (data.facilities) {
      sections.push(`## Facilities and Equipment\n${data.facilities}`);
    }
    
    if (data.locationRationale) {
      sections.push(`## Location Rationale\n${data.locationRationale}`);
    }
    
    if (data.regulatoryRequirements) {
      sections.push(`## Regulatory Requirements\n${data.regulatoryRequirements}`);
    }
    
    if (data.expansionPlans) {
      sections.push(`## Future Expansion Plans\n${data.expansionPlans}`);
    }
    
    return sections.join('\n\n');
  };

  /**
   * Handle save button click
   */
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const formattedText = formatLocationText(locationData);
    console.log('Saving location data:', locationData);
    console.log('Formatted location text:', formattedText);
    onComplete(formattedText);
  };

  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          ref={chatContainerRef}
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          {isDataLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  } mb-4`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="rounded-lg px-4 py-2 max-w-[80%] bg-white text-gray-900 shadow-sm">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <form onSubmit={handleSubmit} className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type about your business location..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading || isDataLoading}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            disabled={isLoading || isDataLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              if (!input.trim() || isLoading) e.preventDefault();
            }}
          >
            <Send className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading || isDataLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Help me
          </button>
        </form>
      </div>

      {/* Right side - Location & Facilities Text Editor */}
      <div className="w-1/2 space-y-4">
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 h-[600px] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium text-blue-700 mb-4">Location & Facilities</h3>
          
          {isDataLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none mb-4 prose-headings:text-blue-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
              {Object.values(locationData).some(value => value.length > 0) ? (
                <ReactMarkdown>{formatLocationData(locationData)}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">
                  No location information yet. Start the conversation on the left to describe your business location and facilities.
                </p>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveClick}
              disabled={isDataLoading || !Object.values(locationData).some(value => value.length > 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Save Location & Facilities
            </button>
          </div>
          
          {/* Show a message if location data exists */}
          {!isDataLoading && locationData.locationType && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Location & facilities data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Location & Facilities" to use the current data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 