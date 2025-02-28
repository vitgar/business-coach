import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the ExpenseProjectionsQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param expenseProjectionsText - Formatted text content for the expense projections
   * @param expenseProjectionsData - Structured data for the expense projections
   */
  onComplete: (expenseProjectionsText: string, expenseProjectionsData: any) => void;
}

/**
 * Message object structure for chat interface
 */
interface Message {
  /**
   * Role of the message sender
   */
  role: 'assistant' | 'user' | 'system';
  
  /**
   * Content of the message
   */
  content: string;
}

/**
 * Interface for expense projections data
 */
interface ExpenseProjectionsData {
  /**
   * Fixed expenses with details
   */
  fixedExpenses?: {
    category: string;
    description: string;
    monthlyAmount: number;
    annualAmount: number;
  }[];
  
  /**
   * Variable expenses with details
   */
  variableExpenses?: {
    category: string;
    description: string;
    percentOfRevenue?: number;
    estimatedAmount: number;
    timeframe: string;
  }[];
  
  /**
   * One-time expenses with details
   */
  oneTimeExpenses?: {
    category: string;
    description: string;
    amount: number;
    expectedDate: string;
  }[];
  
  /**
   * Expense growth assumptions
   */
  growthAssumptions?: string;
  
  /**
   * Cost-saving strategies
   */
  costSavingStrategies?: string;
  
  /**
   * Expense forecast by period
   */
  expenseForecast?: {
    period: string;
    amount: number;
    growthRate?: number;
  }[];
  
  /**
   * Largest expense categories
   */
  largestExpenseCategories?: string;
  
  /**
   * Expense management approach
   */
  expenseManagementApproach?: string;
}

/**
 * Initial system message to guide the conversation
 */
const initialMessage: Message = {
  role: 'system',
  content: `Let's discuss your expense projections. Accurate expense forecasting is crucial for your business plan and financial strategy.

Please share details about:
- Your fixed expenses (rent, salaries, insurance, etc.)
- Your variable expenses (materials, commissions, etc.)
- One-time expenses you anticipate
- How you expect expenses to grow over time
- Your largest expense categories
- Any cost-saving strategies you plan to implement
- Your approach to expense management

If you're not sure where to start, I can guide you through each aspect.`
};

/**
 * ExpenseProjectionsQuestionnaire component
 * 
 * A chat interface for discussing and defining expense projections
 */
export default function ExpenseProjectionsQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for expense projections data
  const [expenseProjectionsData, setExpenseProjectionsData] = useState<ExpenseProjectionsData>({});
  
  // State for formatted expense projections text
  const [formattedExpenseProjectionsText, setFormattedExpenseProjectionsText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing expense projections data when component mounts
  useEffect(() => {
    fetchExpenseProjectionsData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing expense projections data from API
   */
  const fetchExpenseProjectionsData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/expense-projections`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expense projections data');
      }
      
      const data = await response.json();
      
      if (data.expenseProjectionsData) {
        setExpenseProjectionsData(data.expenseProjectionsData);
        
        // Format the expense projections data into text
        const formattedText = formatExpenseProjectionsText(data.expenseProjectionsData);
        setFormattedExpenseProjectionsText(formattedText);
        
        // Add a message showing the existing data
        if (Object.keys(data.expenseProjectionsData).length > 0) {
          setMessages([
            initialMessage,
            {
              role: 'assistant',
              content: 'I see you already have some expense projections information. Would you like to review and update it?'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching expense projections data:', error);
      // Don't show error toast as this might be the first time setting up expense projections
    } finally {
      setIsDataLoading(false);
    }
  };
  
  /**
   * Format expense projections data into readable text
   * 
   * @param data - The expense projections data to format
   * @returns Formatted markdown text
   */
  const formatExpenseProjectionsText = (data: ExpenseProjectionsData): string => {
    let text = '## Expense Projections\n\n';
    
    if (data.fixedExpenses && data.fixedExpenses.length > 0) {
      text += '### Fixed Expenses\n';
      text += '| Category | Description | Monthly Amount | Annual Amount |\n';
      text += '| -------- | ----------- | -------------- | ------------- |\n';
      data.fixedExpenses.forEach(expense => {
        text += `| ${expense.category} | ${expense.description} | $${expense.monthlyAmount.toLocaleString()} | $${expense.annualAmount.toLocaleString()} |\n`;
      });
      text += '\n';
      
      // Calculate total fixed expenses
      const totalMonthly = data.fixedExpenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0);
      const totalAnnual = data.fixedExpenses.reduce((sum, expense) => sum + expense.annualAmount, 0);
      text += `**Total Fixed Expenses:** $${totalMonthly.toLocaleString()} monthly / $${totalAnnual.toLocaleString()} annually\n\n`;
    }
    
    if (data.variableExpenses && data.variableExpenses.length > 0) {
      text += '### Variable Expenses\n';
      text += '| Category | Description | % of Revenue | Estimated Amount | Timeframe |\n';
      text += '| -------- | ----------- | ------------ | ---------------- | --------- |\n';
      data.variableExpenses.forEach(expense => {
        text += `| ${expense.category} | ${expense.description} | ${expense.percentOfRevenue ? `${expense.percentOfRevenue}%` : 'N/A'} | $${expense.estimatedAmount.toLocaleString()} | ${expense.timeframe} |\n`;
      });
      text += '\n';
      
      // Calculate total variable expenses
      const totalVariable = data.variableExpenses.reduce((sum, expense) => sum + expense.estimatedAmount, 0);
      text += `**Total Estimated Variable Expenses:** $${totalVariable.toLocaleString()}\n\n`;
    }
    
    if (data.oneTimeExpenses && data.oneTimeExpenses.length > 0) {
      text += '### One-Time Expenses\n';
      text += '| Category | Description | Amount | Expected Date |\n';
      text += '| -------- | ----------- | ------ | ------------- |\n';
      data.oneTimeExpenses.forEach(expense => {
        text += `| ${expense.category} | ${expense.description} | $${expense.amount.toLocaleString()} | ${expense.expectedDate} |\n`;
      });
      text += '\n';
      
      // Calculate total one-time expenses
      const totalOneTime = data.oneTimeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      text += `**Total One-Time Expenses:** $${totalOneTime.toLocaleString()}\n\n`;
    }
    
    if (data.expenseForecast && data.expenseForecast.length > 0) {
      text += '### Expense Forecast\n';
      text += '| Period | Amount | Growth Rate |\n';
      text += '| ------ | ------ | ----------- |\n';
      data.expenseForecast.forEach(forecast => {
        text += `| ${forecast.period} | $${forecast.amount.toLocaleString()} | ${forecast.growthRate ? `${forecast.growthRate}%` : 'N/A'} |\n`;
      });
      text += '\n';
    }
    
    if (data.growthAssumptions) {
      text += `### Growth Assumptions\n${data.growthAssumptions}\n\n`;
    }
    
    if (data.largestExpenseCategories) {
      text += `### Largest Expense Categories\n${data.largestExpenseCategories}\n\n`;
    }
    
    if (data.costSavingStrategies) {
      text += `### Cost-Saving Strategies\n${data.costSavingStrategies}\n\n`;
    }
    
    if (data.expenseManagementApproach) {
      text += `### Expense Management Approach\n${data.expenseManagementApproach}\n\n`;
    }
    
    // Calculate total expenses if we have all categories
    if (
      data.fixedExpenses && data.fixedExpenses.length > 0 &&
      data.variableExpenses && data.variableExpenses.length > 0 &&
      data.oneTimeExpenses && data.oneTimeExpenses.length > 0
    ) {
      const totalFixed = data.fixedExpenses.reduce((sum, expense) => sum + expense.annualAmount, 0);
      const totalVariable = data.variableExpenses.reduce((sum, expense) => sum + expense.estimatedAmount, 0);
      const totalOneTime = data.oneTimeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      const totalExpenses = totalFixed + totalVariable + totalOneTime;
      
      text += `### Total Projected Expenses\n**Total:** $${totalExpenses.toLocaleString()}\n\n`;
    }
    
    return text;
  };
  
  /**
   * Handle form submission to send a message
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/expense-projections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update expense projections data and formatted text
      if (data.expenseProjectionsData) {
        setExpenseProjectionsData(data.expenseProjectionsData);
        setFormattedExpenseProjectionsText(data.expenseProjections || formatExpenseProjectionsText(data.expenseProjectionsData));
      }
      
      // Reset help mode
      setIsInHelpMode(false);
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle "Help me" button click
   */
  const handleNotSure = async () => {
    if (isLoading) return;
    
    setIsInHelpMode(true);
    setIsLoading(true);
    
    try {
      // Send help request to API
      const helpMessage = "I'm not sure how to project my expenses. Can you guide me through the key aspects?";
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/expense-projections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: helpMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Scroll to the bottom of the message container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * Save the expense projections data
   */
  const handleSave = () => {
    if (formattedExpenseProjectionsText) {
      onComplete(formattedExpenseProjectionsText, expenseProjectionsData);
      toast.success('Expense projections saved!');
    } else {
      toast.warning('Please provide some expense projections information before saving.');
    }
  };
  
  // Show loading indicator while fetching data
  if (isDataLoading) {
    return <LoadingIndicator />;
  }
  
  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
        >
          {messages.slice(1).map((message, index) => (
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
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && <LoadingIndicator type="dots" />}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
      
      {/* Right side - Preview */}
      <div className="w-1/2">
        <div className="h-[600px] overflow-y-auto p-4 bg-white rounded-lg border-l-4 border-blue-600 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Projections Preview</h3>
          
          {formattedExpenseProjectionsText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedExpenseProjectionsText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your expense projections. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Expense Projections
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your expense projections will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 