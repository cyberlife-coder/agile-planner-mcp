/**
 * Tests isolés pour la fonction formatUserStory
 * Utilisés pour tester le formatage des user stories indépendamment des autres composants
 */
const { formatUserStory } = require('../../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');

// Charger le backlog d'exemple pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample-backlog.json'), 'utf8')
);

describe('User Story Markdown Formatting', () => {
  test('Formats user story correctly with all required elements', () => {
    // Prendre la première story du MVP
    const story = sampleBacklog.mvp[0];
    
    // Formater la user story
    const formatted = formatUserStory(story);
    
    // Vérifications de base
    expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
    expect(formatted).toContain(`- [ ] ${story.description}`);
    expect(formatted).toContain('### Acceptance Criteria');
    expect(formatted).toContain('### Technical Tasks');
    
    // Vérifier les critères d'acceptation
    story.acceptance_criteria.forEach(criteria => {
      expect(formatted).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier les tâches
    story.tasks.forEach(task => {
      expect(formatted).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la priorité
    if (story.priority) {
      expect(formatted).toContain(`**Priority:** ${story.priority}`);
    }
    
    // Vérifier les dépendances si elles existent
    if (story.dependencies && story.dependencies.length > 0) {
      expect(formatted).toContain(`**Dependencies:** ${story.dependencies.join(', ')}`);
    }
  });
  
  test('Includes enhanced AI instructions for status updates', () => {
    const story = sampleBacklog.mvp[0];
    const formatted = formatUserStory(story);
    
    // Vérifier les instructions pour l'IA
    expect(formatted).toContain('🤖 User Story Instructions for AI');
    expect(formatted).toContain('Mettez à jour le statut des tâches');
    expect(formatted).toContain('[ ] par [x]');
  });
});
