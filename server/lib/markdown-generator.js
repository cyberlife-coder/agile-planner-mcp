const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * AI automation instructions to add at the beginning of each file
 */
const aiAutomationInstructions = `
## 🤖 Instructions for AI

As an AI assistant, follow these guidelines when analyzing this document:
- Process the tasks below in the sequential order indicated
- Once a task is accomplished, mark it as completed by checking its box ([ ] → [x])
- Wait for user confirmation before moving to the next task
- Respect dependencies between tasks when mentioned
- Provide relevant suggestions based on acceptance criteria

---

`;

/**
 * Epic file specific instructions
 */
const epicFileInstructions = `
## 🤖 Epic Processing Instructions for AI

This file defines the main Epic of the project. When working with this file:
- Understand the overall vision and scope of the project from the Epic description
- Use this Epic as the strategic direction for all implementation work
- When implementing User Stories, always verify alignment with this Epic
- Suggest refinements to the Epic only if substantial project changes occur

---

`;

/**
 * MVP file specific instructions
 */
const mvpFileInstructions = `
## 🤖 MVP User Stories Instructions for AI

This file contains the Minimum Viable Product (MVP) User Stories that must be implemented first:
- Each User Story follows the format: "As a [role], I want [feature], so that [benefit]"
- Acceptance Criteria define the expected behavior and requirements
- Technical Tasks outline implementation steps (2-8 hour chunks of work)
- Priority indicates implementation order (HIGH → MEDIUM → LOW)
- Complete all HIGH priority stories before moving to MEDIUM priority ones

When implementing:
1. Start with one User Story at a time, in priority order
2. Implement all Technical Tasks for that User Story
3. Verify implementation against Acceptance Criteria
4. Mark User Story as complete only when all Acceptance Criteria are satisfied

---

`;

/**
 * Iterations file specific instructions
 */
const iterationFileInstructions = `
## 🤖 Iteration Planning Instructions for AI

This file contains User Stories for a specific iteration (development cycle):
- The Iteration has a specific goal and thematic focus
- User Stories in this iteration contribute to that specific goal
- Dependencies indicate User Stories that must be completed first
- Only move to Iteration stories after completing the MVP User Stories

When planning work:
1. Check that all dependencies are completed first
2. Focus on delivering the cohesive goal of this iteration
3. Implement in priority order within the iteration
4. Report progress against the iteration goal

---

`;

/**
 * Create a slug from a string for file naming
 * @param {string} text - Input text to convert to slug
 * @returns {string} Slugified text
 */
function createSlug(text) {
  return (text || 'item').toLowerCase().replace(/([^a-z0-9])+/g, '-');
}

/**
 * Validates the input backlog result
 * @param {Object} backlogResult - Result to validate
 * @returns {Object} - { valid, error }
 */
function validateBacklogResult(backlogResult) {
  if (!backlogResult || typeof backlogResult !== 'object') {
    return { 
      valid: false, 
      error: { message: 'Argument backlogResult manquant ou invalide' } 
    };
  }
  
  if (!backlogResult.success) {
    return { 
      valid: false, 
      error: backlogResult.error 
    };
  }
  
  return { valid: true };
}

/**
 * Generates epic markdown files
 * @param {Object} epic - Epic object
 * @param {string} outputDir - Base output directory
 * @returns {Promise<Object>} - { epicsDir }
 */
async function generateEpicFiles(epic, outputDir) {
  const epicsDir = path.join(outputDir, 'epics');
  await fs.ensureDir(epicsDir);
  
  // Epic file
  const epicPath = path.join(epicsDir, 'epic.md');
  const epicContent = aiAutomationInstructions + epicFileInstructions +
                     `# Epic: ${epic.title}\n\n${epic.description || 'No description provided.'}\n`;
  
  await fs.writeFile(epicPath, epicContent, 'utf8');
  return { epicsDir };
}

/**
 * Generates user story markdown files for MVP
 * @param {Array} mvpStories - Array of MVP user stories
 * @param {string} outputDir - Base output directory
 * @returns {Promise<void>}
 */
async function generateMvpFiles(mvpStories, outputDir) {
  const mvpDir = path.join(outputDir, 'mvp');
  await fs.ensureDir(mvpDir);
  
  // MVP user stories file
  const mvpPath = path.join(mvpDir, 'user-stories.md');
  let mvpContent = aiAutomationInstructions + mvpFileInstructions + 
                   `# MVP - User Stories\n\nThis file contains all user stories for the Minimum Viable Product (MVP).\n\n`;
  
  await fs.writeFile(mvpPath, mvpContent, 'utf8');
  
  // Individual user stories
  if (mvpStories && Array.isArray(mvpStories) && mvpStories.length > 0) {
    const usDir = path.join(mvpDir, 'user-stories');
    await fs.ensureDir(usDir);
    
    for (const userStory of mvpStories) {
      await generateUserStoryFiles(userStory, usDir);
    }
  }
}

/**
 * Generates markdown files for a user story and its tasks
 * @param {Object} userStory - User story object
 * @param {string} parentDir - Parent directory for user story files
 * @returns {Promise<void>}
 */
async function generateUserStoryFiles(userStory, parentDir) {
  const usSlug = createSlug(userStory.id || userStory.title);
  const usPath = path.join(parentDir, `${usSlug}.md`);
  
  await fs.writeFile(usPath, formatUserStory(userStory), 'utf8');
  
  // Generate task files if present
  if (userStory.tasks && userStory.tasks.length > 0) {
    const tasksDir = path.join(parentDir, `${usSlug}-tasks`);
    await fs.ensureDir(tasksDir);
    
    for (let idx = 0; idx < userStory.tasks.length; idx++) {
      const task = userStory.tasks[idx];
      const taskSlug = `task-${idx+1}`;
      const taskPath = path.join(tasksDir, `${taskSlug}.md`);
      await fs.writeFile(taskPath, `# Task\n\n${task}\n`, 'utf8');
    }
  }
}

/**
 * Generates iteration markdown files
 * @param {Array} iterations - Array of iterations
 * @param {string} outputDir - Base output directory 
 * @returns {Promise<void>}
 */
async function generateIterationFiles(iterations, outputDir) {
  if (!iterations || !Array.isArray(iterations) || iterations.length === 0) {
    return;
  }
  
  const iterationsDir = path.join(outputDir, 'iterations');
  await fs.ensureDir(iterationsDir);
  
  for (const iteration of iterations) {
    const iterationSlug = createSlug(iteration.name);
    const iterationDir = path.join(iterationsDir, iterationSlug);
    await fs.ensureDir(iterationDir);
    
    // Iteration file
    const iterationPath = path.join(iterationDir, 'iteration.md');
    let iterationContent = aiAutomationInstructions + iterationFileInstructions + 
                          `# ${iteration.name || 'Iteration'}\n`;
    
    if (iteration.goal) {
      iterationContent += `\n## Goal: ${iteration.goal}`;
    }
    
    await fs.writeFile(iterationPath, iterationContent, 'utf8');
    
    // Generate user stories for this iteration
    if (iteration.stories && Array.isArray(iteration.stories) && iteration.stories.length > 0) {
      const usDir = path.join(iterationDir, 'user-stories');
      await fs.ensureDir(usDir);
      
      for (const userStory of iteration.stories) {
        await generateUserStoryFiles(userStory, usDir);
      }
    }
  }
}

/**
 * Generates markdown files from a backlog
 * @param {Object} backlogResult - Result of generateBacklog (must contain success/result/error)
 * @param {string} outputDir - Directory to write output files to
 * @returns {Promise<Object>} - { success, files?, error? }
 */
async function generateMarkdownFilesFromResult(backlogResult, outputDir = process.cwd()) {
  // Ensure the output directory uses .agile-planner-backlog subdirectory
  outputDir = path.join(outputDir, '.agile-planner-backlog');
  
  // Validate input
  const validation = validateBacklogResult(backlogResult);
  if (!validation.valid) {
    process.stderr.write(`[ERROR] (markdown-generator) ${validation.error.message}\n`);
    return { success: false, error: validation.error };
  }
  
  // Extract the backlog from the result
  const backlog = backlogResult.result;
  
  try {
    // Ensure output directory exists
    await fs.ensureDir(outputDir);
    
    // Generate navigation file
    await fs.writeFile(
      path.join(outputDir, 'README.md'), 
      '# Agile Backlog\n\n' +
      '- [Epic](./epics/epic.md)\n' +
      '- [MVP](./mvp/user-stories.md)\n' +
      '- [Iterations](./iterations/)\n' +
      '- [Raw Backlog](./backlog.json)\n',
      'utf8'
    );
    
    // Generate epic files
    const epic = backlog.epic || (backlog.epics && backlog.epics[0]);
    if (!epic) {
      return { 
        success: false, 
        error: { message: 'Backlog does not contain an epic' } 
      };
    }
    
    const { epicsDir } = await generateEpicFiles(epic, outputDir);
    
    // Generate MVP files
    if (backlog.mvp && Array.isArray(backlog.mvp)) {
      await generateMvpFiles(backlog.mvp, outputDir);
    }
    
    // Generate iteration files
    await generateIterationFiles(backlog.iterations, outputDir);
    
    // Save the raw backlog
    await saveRawBacklog(backlog, outputDir);
    
    process.stderr.write('✓ Markdown files generated avec structure organisée\n');
    return { success: true, files: { epicsDir } };
  } catch (error) {
    process.stderr.write('[DEBUG] Error generating Markdown files: ' + error.message + '\n');
    return { 
      success: false, 
      error: { message: error.message, stack: error.stack } 
    };
  }
}

/**
 * Formats a User Story as Markdown
 * @param {Object} story - User Story in JSON format
 * @returns {string} Formatted Markdown content
 */
function formatUserStory(story) {
  let content = `## ${story.id}: ${story.title}\n\n`;
  content += `- [ ] ${story.description}\n\n`;
  
  // Add priority if it exists
  if (story.priority) {
    content += `**Priority:** ${story.priority}\n\n`;
  }
  
  // Add dependencies if they exist
  if (story.dependencies && story.dependencies.length > 0) {
    content += `**Dependencies:** ${story.dependencies.join(', ')}\n\n`;
  }
  
  content += `### Acceptance Criteria\n`;
  story.acceptance_criteria.forEach(criteria => {
    content += `- [ ] ${criteria}\n`;
  });
  
  content += `\n### Technical Tasks\n`;
  story.tasks.forEach(task => {
    content += `- [ ] ${task}\n`;
  });
  
  content += `\n---\n\n`;
  return content;
}

/**
 * Saves the raw JSON backlog to a file
 * @param {Object} backlog - Backlog to save
 * @param {string} outputDir - Directory to write output file to
 * @returns {Promise<string>} - Path to the generated file
 */
async function saveRawBacklog(backlog, outputDir = process.cwd()) {
  const jsonPath = path.join(outputDir, 'backlog.json');
  try {
    await fs.writeFile(jsonPath, JSON.stringify(backlog, null, 2), 'utf8');
    process.stderr.write('✓ Raw JSON file saved\n');
    return jsonPath;
  } catch (error) {
    process.stderr.write('[DEBUG] Error saving raw JSON file: ' + error.message + '\n');
    throw error;
  }
}

module.exports = {
  generateMarkdownFilesFromResult,
  formatUserStory,
  saveRawBacklog
};
