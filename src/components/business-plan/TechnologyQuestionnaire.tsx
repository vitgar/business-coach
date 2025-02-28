import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle, Save, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the Technology Questionnaire component
 */
interface TechnologyQuestionnaireProps {
  businessPlanId: string;
  onComplete: (technology: string, technologyData: any) => void;
}

/**
 * Interface for chat message structure
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for Technology data structure
 */
interface TechnologyData {
  softwareSystems?: string[];
  hardwareRequirements?: string[];
  dataManagement?: string;
  cybersecurity?: string;
  techSupport?: string;
  futureUpgrades?: string;
  integrations?: string[];
  trainingNeeds?: string;
  disasterRecovery?: string;
  techBudget?: string;
}

/**
 * Initial system message to guide the Technology discussion
 */
const initialMessage: Message = {
  role: 'system',
  content: `I'll help you define the Technology & Systems for your business. This section outlines the technology infrastructure that will support your operations.

Let's discuss:
1. Software systems (CRM, ERP, accounting, etc.)
2. Hardware requirements (computers, servers, specialized equipment)
3. Data management and storage solutions
4. Cybersecurity measures and protocols
5. Technical support and maintenance plans
6. Future technology upgrades and roadmap
7. System integrations and compatibility
8. Technology training needs for staff
9. Disaster recovery and business continuity plans
10. Technology budget and cost considerations

Please share your thoughts on the technology and systems that would be most relevant for your business.`
};

/**
 * Technology Questionnaire component for chat-based technology definition
 */
const TechnologyQuestionnaire: React.FC<TechnologyQuestionnaireProps> = ({ businessPlanId, onComplete }) => {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for Technology data
  const [technologyData, setTechnologyData] = useState<TechnologyData>({});
  
  // State for formatted Technology text
  const [formattedTechnology, setFormattedTechnology] = useState('');
  
  // Ref for message container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch existing Technology data when component mounts
   */
  useEffect(() => {
    const fetchTechnologyData = async () => {
      try {
        const response = await fetch(`/api/business-plans/${businessPlanId}/operations/technology`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => [initialMessage, ...data.messages.filter((m: Message) => m.role !== 'system')]);
          }
          
          if (data.technologyData) {
            setTechnologyData(data.technologyData);
          }
          
          if (data.technology) {
            setFormattedTechnology(data.technology);
            onComplete(data.technology, data.technologyData || {});
          }
        }
      } catch (error) {
        console.error('Error fetching Technology data:', error);
        toast.error('Failed to load Technology data');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchTechnologyData();
  }, [businessPlanId, onComplete]);

  /**
   * Auto-scroll to bottom of messages when messages change
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Format Technology data into readable text
   */
  const formatTechnologyData = (data: TechnologyData): string => {
    let formatted = '## Technology & Systems\n\n';
    
    if (data.softwareSystems && data.softwareSystems.length > 0) {
      formatted += '### Software Systems\n';
      data.softwareSystems.forEach(system => formatted += `- ${system}\n`);
      formatted += '\n';
    }
    
    if (data.hardwareRequirements && data.hardwareRequirements.length > 0) {
      formatted += '### Hardware Requirements\n';
      data.hardwareRequirements.forEach(hardware => formatted += `- ${hardware}\n`);
      formatted += '\n';
    }
    
    if (data.dataManagement) {
      formatted += '### Data Management\n';
      formatted += data.dataManagement + '\n\n';
    }
    
    if (data.cybersecurity) {
      formatted += '### Cybersecurity\n';
      formatted += data.cybersecurity + '\n\n';
    }
    
    if (data.techSupport) {
      formatted += '### Technical Support\n';
      formatted += data.techSupport + '\n\n';
    }
    
    if (data.futureUpgrades) {
      formatted += '### Future Technology Upgrades\n';
      formatted += data.futureUpgrades + '\n\n';
    }
    
    if (data.integrations && data.integrations.length > 0) {
      formatted += '### System Integrations\n';
      data.integrations.forEach(integration => formatted += `- ${integration}\n`);
      formatted += '\n';
    }
    
    if (data.trainingNeeds) {
      formatted += '### Technology Training\n';
      formatted += data.trainingNeeds + '\n\n';
    }
    
    if (data.disasterRecovery) {
      formatted += '### Disaster Recovery\n';
      formatted += data.disasterRecovery + '\n\n';
    }
    
    if (data.techBudget) {
      formatted += '### Technology Budget\n';
      formatted += data.techBudget + '\n\n';
    }
    
    return formatted;
  };

  /**
   * Handle form submission to send message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/technology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          messages: [...messages, userMessage].filter(m => m.role !== 'system'),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      if (data.message) {
        const assistantMessage: Message = { role: 'assistant', content: data.message };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      if (data.technologyData) {
        setTechnologyData(data.technologyData);
      }
      
      if (data.technology) {
        setFormattedTechnology(data.technology);
        onComplete(data.technology, data.technologyData || {});
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request help with Technology definition
   */
  const handleRequestHelp = async () => {
    if (isLoading) return;
    
    const helpMessage = "I'm not sure what technology and systems to include. Can you suggest some common technologies for my type of business?";
    const userMessage: Message = { role: 'user', content: helpMessage };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/technology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: helpMessage,
          messages: [...messages, userMessage].filter(m => m.role !== 'system'),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process help request');
      }
      
      const data = await response.json();
      
      if (data.message) {
        const assistantMessage: Message = { role: 'assistant', content: data.message };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error processing help request:', error);
      toast.error('Failed to get help');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save Technology data
   */
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/technology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Save Technology data',
          messages: messages.filter(m => m.role !== 'system'),
          finalizing: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Technology data');
      }
      
      const data = await response.json();
      
      if (data.technologyData) {
        setTechnologyData(data.technologyData);
      }
      
      if (data.technology) {
        setFormattedTechnology(data.technology);
        onComplete(data.technology, data.technologyData || {});
      }
      
      toast.success('Technology data saved successfully');
    } catch (error) {
      console.error('Error saving Technology data:', error);
      toast.error('Failed to save Technology data');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while fetching initial data
  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingIndicator />
        <p className="mt-2 text-gray-500">Loading Technology data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Chat Interface */}
      <div className="flex-1 border rounded-lg overflow-hidden">
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.filter(m => m.role !== 'system').map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-2 border-t flex gap-2">
          <button
            type="button"
            onClick={handleRequestHelp}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Get help with Technology"
          >
            <HelpCircle size={20} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message about Technology & Systems..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
      
      {/* Preview Panel */}
      <div className="flex-1 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Technology Preview</h3>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            disabled={isSaving || messages.length <= 1}
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save Technology
          </button>
        </div>
        
        <div className="prose max-w-none h-96 overflow-y-auto bg-white p-4 border rounded">
          {formattedTechnology ? (
            <ReactMarkdown>{formattedTechnology}</ReactMarkdown>
          ) : (
            <p className="text-gray-500 italic">
              Your Technology & Systems will appear here as you discuss them in the chat. Once you're satisfied, click "Save Technology" to finalize.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnologyQuestionnaire; 