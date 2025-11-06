# Examples

This directory contains **standalone, focused examples** that demonstrate specific AI concepts, integrations, and techniques. Each example is self-contained and designed to teach a particular skill or pattern.

## 📋 Purpose

The examples in this directory are meant to:
- Illustrate specific AI concepts and patterns
- Show how to integrate with various AI APIs and services
- Demonstrate best practices in a minimal, focused context
- Serve as reference implementations you can adapt for your projects

## 🗂️ Structure

Examples are organized by category and complexity:

### Planned Categories

- **`api-basics/`** - Basic API integration examples
  - Simple API calls to OpenAI, Anthropic, etc.
  - Request/response handling
  - Error handling patterns
  - Environment variable configuration

- **`data-processing/`** - Data handling and manipulation
  - Reading and processing CSV/JSON data
  - Data cleaning and transformation
  - Preparing data for AI models
  - Working with pandas and numpy

- **`ml-basics/`** - Machine learning fundamentals
  - Training simple models
  - Making predictions
  - Model evaluation
  - Feature engineering

- **`nlp-tasks/`** - Natural language processing
  - Text classification
  - Sentiment analysis
  - Named entity recognition
  - Text summarization

- **`vision-basics/`** - Computer vision examples
  - Image classification
  - Object detection
  - Image preprocessing
  - Working with image APIs

- **`advanced-patterns/`** - Advanced implementation patterns
  - Streaming responses
  - Conversation history management
  - Function calling / tool use
  - Prompt engineering techniques
  - Rate limiting and retries

## 🚀 How to Use

Each example directory contains:
- **`README.md`** - Explanation of the example, setup instructions, and usage
- **Source code** - Well-commented implementation
- **`.env.example`** - Required environment variables
- **`requirements.txt`** or **`package.json`** - Dependencies
- **Sample data** (if applicable) - Test data to run the example

### Running an Example

1. Navigate to the specific example directory:
   ```bash
   cd examples/api-basics/simple-completion
   ```

2. Follow the setup instructions in that example's README:
   - Install dependencies
   - Configure environment variables
   - Review the code and comments

3. Run the example:
   ```bash
   python main.py  # For Python examples
   # or
   node index.js   # For JavaScript examples
   ```

## 🎯 Learning Tips

- **Start simple**: Begin with `api-basics` before moving to advanced patterns
- **Modify and experiment**: Change parameters, try different inputs, break things!
- **Read the code**: Examples include extensive comments explaining what and why
- **Check the docs**: Each example links to relevant API documentation
- **Build on examples**: Use these as starting points for your own projects

## 🔗 Related Resources

- **`/projects`** - For complete, multi-file tutorial projects
- **`/templates`** - For production-ready project templates
- **`/docs`** - For comprehensive guides and documentation

## 📝 Contributing Examples

When adding a new example:

1. Create a new directory with a descriptive name (e.g., `sentiment-analysis`)
2. Include a comprehensive README explaining:
   - What the example demonstrates
   - Prerequisites and setup
   - Step-by-step usage instructions
   - Expected output
   - Key concepts illustrated
3. Add well-commented source code
4. Include `.env.example` with required variables
5. Provide sample data if needed
6. Test thoroughly before committing

See `/CLAUDE.md` for detailed contribution guidelines.

---

**Ready to learn?** Start with an example that matches your current skill level and build from there!
