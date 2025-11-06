# Claude Code Project Guidance

## Repository Purpose

This repository serves as **training materials, example projects, and templates for teaching AI to SMBs and individuals** through SherpaTech.AI. Our goal is to provide clear, practical examples that demonstrate AI capabilities and best practices for real-world applications.

## SherpaTech.AI Project Context

### Our 6A Framework
SherpaTech.AI guides organizations through AI adoption using our proven 6A Method:
- **Assess**: Understand current state and AI readiness
- **Align**: Strategic fit & governance frameworks
- **Activate**: Build guardrails and responsible AI policies
- **Accelerate**: Build team capability through training
- **Apply**: Practical implementation of AI solutions
- **Amplify**: Scale what works across the organization

### Active Projects in This Repo

#### 1. SherpaTech Copilot (Lead Gen)
- **Purpose**: Book discovery calls + educate prospects on 6A Method
- **Tech Stack**: Microsoft Copilot Studio
- **Integration**: Responses stored in HubSpot
- **Location**: `/projects/sherpatech-copilot/`

#### 2. AI Readiness Assessment Bot
- **Purpose**: Lead qualification + personalized AI readiness reports
- **Tech Stack**: Web app (React/Node.js)
- **Output**: PDF report + HubSpot lead scoring
- **Features**:
  - Interactive assessment questionnaire
  - Scoring across 6A dimensions
  - Personalized recommendations
  - Automated HubSpot contact creation
- **Location**: `/projects/ai-readiness-assessment/`

#### 3. Client Success Story Curator
- **Purpose**: Quick case study generation + LinkedIn content creation
- **Tech Stack**: CLI tool or web app (Python/Node.js)
- **Input**: Client project notes, outcomes, testimonials
- **Output**:
  - Formatted case study (PDF/Web)
  - LinkedIn posts (multiple formats)
  - Twitter/X threads
  - Email newsletter content
- **Location**: `/projects/client-story-curator/`

### HubSpot Integration
All lead-gen tools sync to HubSpot via API. Standard contact properties include:
- **AI Readiness Score** (0-100): Composite score from assessment
- **6A Phase of Interest**: Which phase resonates most with the lead
- **Meeting Type**: Discovery, Demo, Training, or Consulting
- **Industry Focus**: Primary industry vertical
- **Team Size**: Company size for tailored recommendations
- **Use Case Priority**: Top AI use case identified

### Content Standards
All projects and examples must reflect SherpaTech.AI's teaching philosophy:
- **"Teach a person to fish"**: Focus on capability building, not dependency
- **No hard selling**: Lead with education and value
- **6A Method integration**: Reference relevant phases in every tool
- **Practical over theoretical**: Show real-world applications
- **Transparent about AI**: Explain what AI does and its limitations
- **Ethical considerations**: Address bias, privacy, and responsible use

## Key Principles

### 1. Clean, Readable Code
- Write code that teaches by example
- Favor clarity over cleverness
- Break complex operations into well-named functions
- Keep functions focused on a single responsibility

### 2. Comprehensive Documentation
- Every example should explain the "why" not just the "what"
- Include inline comments for complex logic
- Provide README files that guide users through setup and usage
- Document prerequisites and dependencies clearly

### 3. Security-First Approach
- **Never** commit sensitive information (API keys, passwords, credentials)
- Use environment variables for configuration
- Include security best practices in examples
- Validate and sanitize user inputs in all examples

### 4. Beginner-Friendly
- Assume users are learning - don't skip steps
- Provide clear error messages and troubleshooting tips
- Include "Common Issues" sections in documentation
- Link to external resources for deeper learning

## Preferred Tech Stack

### Python Projects (AI/ML/Data)
- **Python 3.9+** for AI and data science examples
- **Virtual environments** (venv or conda) for dependency isolation
- **Common libraries**:
  - `pandas`, `numpy` for data manipulation
  - `scikit-learn`, `transformers` for ML
  - `openai`, `anthropic` for AI APIs
  - `requests`, `httpx` for API calls
  - `python-dotenv` for environment management

### JavaScript/TypeScript Projects (Web)
- **Node.js 18+** for backend services
- **React 18+** for frontend applications
- **TypeScript** preferred for larger projects
- **Common libraries**:
  - `express` or `fastify` for APIs
  - `axios` for HTTP requests
  - `dotenv` for environment management

### Other Technologies
- **Docker** for containerized examples
- **Git** for version control best practices
- **Markdown** for all documentation

## Code Style Preferences

### Python
```python
# Use clear, descriptive variable names
user_input = get_user_message()  # Good
x = get()  # Bad

# Add type hints for function parameters and returns
def process_text(text: str, max_length: int = 100) -> str:
    """Process and truncate text to specified length.

    Args:
        text: The input text to process
        max_length: Maximum length of returned text (default: 100)

    Returns:
        Processed text truncated to max_length
    """
    return text[:max_length]

# Use docstrings for all functions (Google or NumPy style)
# Follow PEP 8 style guide
# Use f-strings for string formatting
```

### JavaScript/TypeScript
```javascript
// Use descriptive variable names with camelCase
const userName = getUserInput();  // Good
const x = get();  // Bad

// Add JSDoc comments for functions
/**
 * Process and truncate text to specified length
 * @param {string} text - The input text to process
 * @param {number} maxLength - Maximum length of returned text
 * @returns {string} Processed text truncated to maxLength
 */
function processText(text, maxLength = 100) {
    return text.slice(0, maxLength);
}

// Use const/let instead of var
// Prefer arrow functions for callbacks
// Use template literals for string formatting
```

## Folder Structure Conventions

```
/examples          - Standalone, focused examples demonstrating specific concepts
  /api-integration - API usage examples
  /data-processing - Data manipulation examples
  /ml-basics      - Machine learning fundamentals

/projects          - Complete tutorial projects for hands-on learning
  /project-name    - Each project in its own directory
    /src           - Source code
    /tests         - Test files
    /docs          - Project-specific documentation
    README.md      - Project setup and instructions

/templates         - Starter templates for common tasks
  /python-api      - Template for Python API projects
  /react-app       - Template for React applications
  /ml-pipeline     - Template for ML workflows

/docs              - General documentation and guides
  /guides          - How-to guides and tutorials
  /references      - Reference materials
```

### File Naming Conventions
- Use lowercase with hyphens for directories: `machine-learning-basics`
- Use lowercase with underscores for Python files: `data_processing.py`
- Use camelCase or kebab-case for JavaScript files: `dataProcessing.js` or `data-processing.js`
- Use descriptive names: `image_classifier.py` not `ic.py`

## Handling Sensitive Information

### ❌ NEVER commit:
- API keys or tokens
- Passwords or credentials
- Private keys or certificates
- Personal information (emails, phone numbers)
- Database connection strings with credentials
- `.env` files with real values

### ✅ ALWAYS:
- Use `.env` files locally (and add to `.gitignore`)
- Provide `.env.example` files with placeholder values
- Document required environment variables in README
- Use environment variable libraries (`python-dotenv`, `dotenv` npm package)
- Include setup instructions for obtaining API keys

### Example `.env.example`:
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# HubSpot Integration (for lead-gen projects)
HUBSPOT_API_KEY=your_hubspot_api_key_here
HUBSPOT_PORTAL_ID=your_portal_id_here

# Application Settings
DEBUG_MODE=false
LOG_LEVEL=info
```

## Working with Claude Code

### Best Practices for AI-Assisted Development

1. **Be Specific in Requests**
   - Provide clear, detailed requirements
   - Specify the programming language and framework
   - Mention any constraints or preferences

2. **Review AI-Generated Code**
   - Always review code before committing
   - Test functionality thoroughly
   - Ensure security best practices are followed
   - Verify documentation is accurate

3. **Iterative Development**
   - Start with small, working examples
   - Add features incrementally
   - Test after each change
   - Ask for explanations when code is unclear

4. **Leverage Context**
   - Reference existing files and patterns in the repo
   - Ask Claude to follow established conventions
   - Request consistency with existing code style

5. **Documentation First**
   - Consider writing README or design docs before code
   - Use Claude to generate documentation from code
   - Keep documentation up-to-date with changes

### Example Prompts for Claude Code

```
"Create a Python example that demonstrates how to use the OpenAI API
to generate text completions. Include error handling, environment
variable usage, and comprehensive docstrings."

"Build the AI Readiness Assessment Bot from the active projects list.
It should be a React/Node.js web app that scores users across our 6A
dimensions and creates HubSpot contacts with the results."

"Add a new template for a FastAPI project with authentication,
following the folder structure conventions in CLAUDE.md"

"Create a CLI tool for the Client Success Story Curator that takes
client project notes and generates formatted case studies and LinkedIn
posts that reference our 6A Method."

"Review the code in examples/data-processing for security issues
and suggest improvements"
```

## Contributing Guidelines

When adding new content to this repository:

1. **Follow the established structure** - Place files in the appropriate directory
2. **Include complete documentation** - Every example needs a README
3. **Test your code** - Ensure examples work as documented
4. **Keep it simple** - Examples should be educational, not production-ready
5. **Security review** - Double-check for exposed credentials
6. **Commit messages** - Use clear, descriptive commit messages

### Commit Message Format
```
Add: New example for sentiment analysis with transformers
Update: Improve error handling in API integration example
Fix: Correct environment variable usage in template
Docs: Add troubleshooting section to ML basics guide
```

## Resources for Learning

- [Python Official Documentation](https://docs.python.org/)
- [JavaScript MDN Web Docs](https://developer.mozilla.org/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Git Best Practices](https://git-scm.com/book/en/v2)

---

**Remember**: This repository is a learning resource. Prioritize clarity, safety, and educational value in all contributions.
