// Test complètement isolé pour l'utilitaire de formatage des user stories
const { testFormat } = require('./mdformatter');
const fs = require('fs-extra');
const path = require('path');

// Charger le même backlog de test que dans les tests originaux
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

describe('User Story Markdown Formatting', () => {
  test('Formats user story correctly in markdown with checkboxes', () => {
    // Prendre la première story du MVP
    const story = sampleBacklog.mvp[0];
    
    // Utiliser notre fonction de formatage isolée
    const formatted = testFormat(story);
    
    // Vérifier tous les éléments requis par le test original
    expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
    expect(formatted).toContain(`- [ ] ${story.description}`);
    expect(formatted).toContain('### Acceptance Criteria');
    expect(formatted).toContain('### Technical Tasks');
    
    // Vérifier chaque critère d'acceptation
    story.acceptance_criteria.forEach(criteria => {
      expect(formatted).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier chaque tâche
    story.tasks.forEach(task => {
      expect(formatted).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la priorité
    expect(formatted).toContain(`**Priority:** ${story.priority}`);
    
    // Vérifier les instructions pour l'IA
    expect(formatted).toContain('🤖');
    expect(formatted).toContain('User Story Instructions for AI');
    
    // Écrire le résultat dans un fichier pour inspection
    fs.writeFileSync(path.join(__dirname, 'user-story-test-output.md'), formatted);
  });
});
