// Run with: npx @axe-core/cli http://localhost:3000 --config axe.config.js
module.exports = {
  rules: {
    // Ensure all images have alt text
    'image-alt': { enabled: true },
    // Ensure buttons have accessible names
    'button-name': { enabled: true },
    // Ensure form inputs have labels
    'label': { enabled: true },
    // Ensure sufficient color contrast
    'color-contrast': { enabled: true },
    // Ensure landmarks are used correctly
    'landmark-one-main': { enabled: true },
    // Ensure page has title
    'document-title': { enabled: true },
    // Ensure html has lang attribute
    'html-has-lang': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
};