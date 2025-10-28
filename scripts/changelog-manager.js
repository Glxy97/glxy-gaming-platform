#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

/**
 * Add a new entry to the changelog
 */
function addEntry(type, message) {
  const validTypes = ['Behobene Kritische Fehler', 'Neue Features', 'Infrastrukturverbesserungen', 'Sicherheitsverbesserungen', 'Leistungsverbesserungen', 'Verbesserte Spielelogik'];

  if (!validTypes.includes(type)) {
    console.error(`❌ Ungültiger Typ: ${type}`);
    console.log('Verfügbare Typen:', validTypes.join(', '));
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

  // Check if today's section exists
  const todayHeader = `## ${today}`;
  const typeHeader = `### ${type}`;
  const newEntry = `- ${message}`;

  if (!changelog.includes(todayHeader)) {
    // Add new date section
    const firstSection = changelog.indexOf('## ');
    const newSection = `${todayHeader}\n\n${typeHeader}\n${newEntry}\n\n`;
    changelog = changelog.slice(0, firstSection) + newSection + changelog.slice(firstSection);
  } else if (!changelog.includes(typeHeader)) {
    // Add new type section under today's date
    const todayIndex = changelog.indexOf(todayHeader);
    const nextSectionIndex = changelog.indexOf('## ', todayIndex + 1);
    const insertPoint = nextSectionIndex === -1 ? changelog.length : nextSectionIndex - 1;

    const newTypeSection = `${typeHeader}\n${newEntry}\n\n`;
    changelog = changelog.slice(0, insertPoint) + newTypeSection + changelog.slice(insertPoint);
  } else {
    // Add to existing type section
    const typeIndex = changelog.indexOf(typeHeader);
    const nextHeaderIndex = changelog.indexOf('###', typeIndex + 1);
    const nextSectionIndex = changelog.indexOf('##', typeIndex + 1);

    let insertPoint;
    if (nextHeaderIndex !== -1 && (nextSectionIndex === -1 || nextHeaderIndex < nextSectionIndex)) {
      insertPoint = nextHeaderIndex - 1;
    } else if (nextSectionIndex !== -1) {
      insertPoint = nextSectionIndex - 1;
    } else {
      insertPoint = changelog.length;
    }

    changelog = changelog.slice(0, insertPoint) + `${newEntry}\n` + changelog.slice(insertPoint);
  }

  fs.writeFileSync(CHANGELOG_PATH, changelog);
  console.log(`✅ Changelog-Eintrag hinzugefügt: ${type} - ${message}`);
}

/**
 * Generate changelog from git commits
 */
function generateFromGit() {
  try {
    const commits = execSync('git log --oneline --since="1 day ago"', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[a-f0-9]+ /, ''));

    if (commits.length === 0) {
      console.log('📝 Keine neuen Commits gefunden.');
      return;
    }

    console.log('🔍 Gefundene Commits:');
    commits.forEach((commit, i) => {
      console.log(`${i + 1}. ${commit}`);
    });

    // Auto-categorize commits
    commits.forEach(commit => {
      if (commit.match(/fix|bug|fehler|behoben/i)) {
        addEntry('Behobene Kritische Fehler', commit);
      } else if (commit.match(/feat|add|neu|hinzugefügt/i)) {
        addEntry('Neue Features', commit);
      } else if (commit.match(/security|sicher|auth/i)) {
        addEntry('Sicherheitsverbesserungen', commit);
      } else if (commit.match(/perf|optimiz|performance/i)) {
        addEntry('Leistungsverbesserungen', commit);
      } else if (commit.match(/infra|docker|deploy/i)) {
        addEntry('Infrastrukturverbesserungen', commit);
      } else {
        addEntry('Infrastrukturverbesserungen', commit);
      }
    });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Git-Commits:', error.message);
  }
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📝 Changelog Manager für GLXY Gaming Platform

Verwendung:
  node changelog-manager.js add <typ> <nachricht>  # Einzelnen Eintrag hinzufügen
  node changelog-manager.js generate               # Aus Git-Commits generieren
  node changelog-manager.js list                   # Verfügbare Typen anzeigen

Beispiele:
  node changelog-manager.js add "Behobene Kritische Fehler" "Behoben: Login-Problem"
  node changelog-manager.js add "Neue Features" "Hinzugefügt: Chat-System"
  node changelog-manager.js generate
    `);
    return;
  }

  const command = args[0];

  switch (command) {
    case 'add':
      if (args.length < 3) {
        console.error('❌ Verwendung: add <typ> <nachricht>');
        return;
      }
      const type = args[1];
      const message = args.slice(2).join(' ');
      addEntry(type, message);
      break;

    case 'generate':
      generateFromGit();
      break;

    case 'list':
      console.log('📋 Verfügbare Changelog-Typen:');
      const types = ['Behobene Kritische Fehler', 'Neue Features', 'Infrastrukturverbesserungen', 'Sicherheitsverbesserungen', 'Leistungsverbesserungen', 'Verbesserte Spielelogik'];
      types.forEach(type => console.log(`  - ${type}`));
      break;

    default:
      console.error(`❌ Unbekannter Befehl: ${command}`);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { addEntry, generateFromGit };