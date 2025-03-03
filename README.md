# Business Coach Application

A comprehensive business planning application that helps entrepreneurs create, manage, and refine their business plans with AI assistance.

## Features

- Create and manage multiple business plans
- AI-assisted business plan creation
- Interactive chat interface for vision and goals development
- Business selector to switch between different business plans
- Dashboard with quick access to business tools
- New modern business plan editor with section-by-section guidance

## Business Plan System

The application includes a modern business plan editor with the following features:

- Section-based navigation for easy access to different parts of your plan
- Guided field inputs with helpful tooltips
- Real-time progress tracking
- Ability to export to different formats
- Clean, user-friendly interface

### Business Plan Sections

1. Executive Summary
2. Company Description
3. Products & Services
4. Market Analysis
5. Marketing Strategy
6. Operations Plan
7. Organization & Management
8. Financial Plan

## OpenAI Integration Setup

The application uses OpenAI's API to provide AI assistance for business plan development. To set up the OpenAI integration:

1. Sign up for an OpenAI API key at [https://platform.openai.com/](https://platform.openai.com/)
2. Copy your API key from the OpenAI dashboard
3. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Restart the development server

## Field Suggestions System

The AI assistant provides contextual suggestions for business plan fields using a backtick-based extraction system:

1. The AI wraps specific content suggestions in backticks (`) to indicate actionable content
2. The application extracts these suggestions and presents them as clickable options
3. Users can apply suggestions directly to the appropriate fields with a single click
4. The system intelligently associates suggestions with the most relevant fields based on content analysis

This approach provides a balance between conversational assistance and actionable content suggestions, making it easier for users to complete their business plan efficiently.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the database:
   ```
   npx prisma migrate dev
   ```
4. Set up the OpenAI API key as described above
5. Start the development server:
   ```
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Using the AI-Assisted Vision and Goals Development

1. Navigate to a business plan
2. Open the "Vision and Business Goals" section
3. Use the chat interface on the left to interact with the AI assistant
4. The AI will guide you through developing your business vision and goals
5. Your responses will be compiled into a comprehensive vision statement
6. Edit the generated content in the text area on the right
7. Click "Save" to save your changes

## Development

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: Your database connection string
- `NODE_ENV`: The environment (development, production)

### Key Files

- `src/components/business-plan-new/`: The new business plan components
- `src/app/business-plan/[id]/page.tsx`: The main business plan page
- `src/app/api/business-plans/`: API endpoints for business plan operations

## License

This project is licensed under the MIT License - see the LICENSE file for details. 