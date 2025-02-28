import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle, Save, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the KPI Questionnaire component
 */
interface KPIQuestionnaireProps {
  businessPlanId: string;
  onComplete: (kpis: string, kpiData: any) => void;
}

/**
 * Interface for chat message structure
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for KPI data structure
 */
interface KPIData {
  financialKPIs?: string[];
  operationalKPIs?: string[];
  customerKPIs?: string[];
  employeeKPIs?: string[];
  marketingKPIs?: string[];
  measurementFrequency?: string;
  reportingMethods?: string;
  benchmarks?: string;
  responsibleParties?: string;
  improvementProcess?: string;
}

/**
 * Initial system message to guide the KPI discussion
 */
const initialMessage: Message = {
  role: 'system',
  content: `I'll help you define Key Performance Indicators (KPIs) for your business. KPIs are measurable values that demonstrate how effectively your business is achieving key objectives.

Let's discuss:
1. Financial KPIs (revenue growth, profit margins, cash flow)
2. Operational KPIs (production efficiency, delivery times, error rates)
3. Customer KPIs (satisfaction scores, retention rates, acquisition costs)
4. Employee KPIs (productivity, satisfaction, turnover)
5. Marketing KPIs (conversion rates, customer acquisition cost, ROI)
6. How often you'll measure these KPIs
7. How you'll report and review KPI data
8. Industry benchmarks you'll use for comparison
9. Who will be responsible for tracking KPIs
10. How you'll use KPI data to drive improvement

Please share your thoughts on the KPIs that would be most relevant for your business.`
};

/**
 * KPI Questionnaire component for chat-based KPI definition
 */
const KPIQuestionnaire: React.FC<KPIQuestionnaireProps> = ({ businessPlanId, onComplete }) => {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for KPI data
  const [kpiData, setKpiData] = useState<KPIData>({});
  
  // State for formatted KPI text
  const [formattedKPIs, setFormattedKPIs] = useState('');
  
  // Ref for message container to auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch existing KPI data when component mounts
   */
  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        const response = await fetch(`/api/business-plans/${businessPlanId}/operations/kpis`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => [initialMessage, ...data.messages.filter((m: Message) => m.role !== 'system')]);
          }
          
          if (data.kpiData) {
            setKpiData(data.kpiData);
          }
          
          if (data.kpis) {
            setFormattedKPIs(data.kpis);
            onComplete(data.kpis, data.kpiData || {});
          }
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error);
        toast.error('Failed to load KPI data');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchKPIData();
  }, [businessPlanId, onComplete]);

  /**
   * Auto-scroll to bottom of messages when messages change
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Format KPI data into readable text
   */
  const formatKPIData = (data: KPIData): string => {
    let formatted = '## Key Performance Indicators (KPIs)\n\n';
    
    if (data.financialKPIs && data.financialKPIs.length > 0) {
      formatted += '### Financial KPIs\n';
      data.financialKPIs.forEach(kpi => formatted += `- ${kpi}\n`);
      formatted += '\n';
    }
    
    if (data.operationalKPIs && data.operationalKPIs.length > 0) {
      formatted += '### Operational KPIs\n';
      data.operationalKPIs.forEach(kpi => formatted += `- ${kpi}\n`);
      formatted += '\n';
    }
    
    if (data.customerKPIs && data.customerKPIs.length > 0) {
      formatted += '### Customer KPIs\n';
      data.customerKPIs.forEach(kpi => formatted += `- ${kpi}\n`);
      formatted += '\n';
    }
    
    if (data.employeeKPIs && data.employeeKPIs.length > 0) {
      formatted += '### Employee KPIs\n';
      data.employeeKPIs.forEach(kpi => formatted += `- ${kpi}\n`);
      formatted += '\n';
    }
    
    if (data.marketingKPIs && data.marketingKPIs.length > 0) {
      formatted += '### Marketing KPIs\n';
      data.marketingKPIs.forEach(kpi => formatted += `- ${kpi}\n`);
      formatted += '\n';
    }
    
    if (data.measurementFrequency) {
      formatted += '### Measurement Frequency\n';
      formatted += data.measurementFrequency + '\n\n';
    }
    
    if (data.reportingMethods) {
      formatted += '### Reporting Methods\n';
      formatted += data.reportingMethods + '\n\n';
    }
    
    if (data.benchmarks) {
      formatted += '### Industry Benchmarks\n';
      formatted += data.benchmarks + '\n\n';
    }
    
    if (data.responsibleParties) {
      formatted += '### Responsible Parties\n';
      formatted += data.responsibleParties + '\n\n';
    }
    
    if (data.improvementProcess) {
      formatted += '### Improvement Process\n';
      formatted += data.improvementProcess + '\n\n';
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/kpis`, {
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
      
      if (data.kpiData) {
        setKpiData(data.kpiData);
      }
      
      if (data.kpis) {
        setFormattedKPIs(data.kpis);
        onComplete(data.kpis, data.kpiData || {});
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request help with KPI definition
   */
  const handleRequestHelp = async () => {
    if (isLoading) return;
    
    const helpMessage = "I'm not sure what KPIs to include. Can you suggest some common KPIs for my type of business?";
    const userMessage: Message = { role: 'user', content: helpMessage };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/kpis`, {
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
   * Save KPI data
   */
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/kpis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Save KPI data',
          messages: messages.filter(m => m.role !== 'system'),
          finalizing: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save KPI data');
      }
      
      const data = await response.json();
      
      if (data.kpiData) {
        setKpiData(data.kpiData);
      }
      
      if (data.kpis) {
        setFormattedKPIs(data.kpis);
        onComplete(data.kpis, data.kpiData || {});
      }
      
      toast.success('KPI data saved successfully');
    } catch (error) {
      console.error('Error saving KPI data:', error);
      toast.error('Failed to save KPI data');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while fetching initial data
  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingIndicator />
        <p className="mt-2 text-gray-500">Loading KPI data...</p>
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
            title="Get help with KPIs"
          >
            <HelpCircle size={20} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message about KPIs..."
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
          <h3 className="text-lg font-semibold">KPI Preview</h3>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            disabled={isSaving || messages.length <= 1}
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save KPIs
          </button>
        </div>
        
        <div className="prose max-w-none h-96 overflow-y-auto bg-white p-4 border rounded">
          {formattedKPIs ? (
            <ReactMarkdown>{formattedKPIs}</ReactMarkdown>
          ) : (
            <p className="text-gray-500 italic">
              Your KPIs will appear here as you discuss them in the chat. Once you're satisfied with the KPIs, click "Save KPIs" to finalize.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPIQuestionnaire; 