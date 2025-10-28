/**
 * Deutsche Labels, Tooltips und Texte für Web-Adobe Properties Panel
 *
 * Zentrale Sprachdatei für vollständige Lokalisierung
 */

export const labels = {
  // Panel Header
  panelTitle: 'Eigenschaften',
  pin: 'Anheften',
  close: 'Schließen',

  // Sections
  sections: {
    basis: 'Basis',
    validierung: 'Validierung',
    darstellung: 'Darstellung',
    verhalten: 'Verhalten',
    position: 'Position & Größe',
    datapad: 'dataPad Integration'
  },

  // Basis Fields
  basis: {
    fieldName: 'Feldname',
    displayName: 'Anzeigename',
    fieldType: 'Feldtyp',
    description: 'Beschreibung'
  },

  // Validation Fields
  validierung: {
    required: 'Pflichtfeld',
    minLength: 'Min. Länge',
    maxLength: 'Max. Länge',
    pattern: 'Validierungsmuster',
    regex: 'Regulärer Ausdruck',
    testRegex: 'Regex testen',
    customMessage: 'Fehlermeldung',
    characters: 'Zeichen'
  },

  // Darstellung Fields
  darstellung: {
    fontSize: 'Schriftgröße',
    fontColor: 'Schriftfarbe',
    fontFamily: 'Schriftart',
    border: 'Rahmen',
    borderWidth: 'Rahmenbreite',
    borderColor: 'Rahmenfarbe',
    background: 'Hintergrund',
    alignment: 'Ausrichtung',
    pt: 'pt',
    px: 'px'
  },

  // Verhalten Fields
  verhalten: {
    readonly: 'Schreibgeschützt',
    hidden: 'Ausgeblendet',
    multiline: 'Mehrere Zeilen',
    rows: 'Zeilen',
    disabled: 'Deaktiviert',
    autoFocus: 'Auto-Fokus'
  },

  // Position Fields
  position: {
    x: 'X-Position',
    y: 'Y-Position',
    width: 'Breite',
    height: 'Höhe',
    enableGrid: 'Raster aktivieren',
    snapToGrid: 'Am Raster ausrichten',
    gridSize: 'Rastergröße',
    alignment: 'Ausrichtung'
  },

  // DataPad Fields
  datapad: {
    mappingKey: 'Zuordnungsschlüssel',
    autoFill: 'Auto-Ausfüllen',
    previewInDataPad: 'Vorschau in dataPad',
    suggestedMappings: 'Vorgeschlagene Zuordnungen',
    mapping: 'dataPad-Zuordnung'
  },

  // Field Types
  fieldTypes: {
    text: 'Textfeld',
    checkbox: 'Kontrollkästchen',
    radio: 'Optionsfeld',
    dropdown: 'Auswahlliste',
    signature: 'Unterschrift',
    date: 'Datumsfeld',
    number: 'Zahlenfeld',
    email: 'E-Mail-Feld',
    phone: 'Telefonfeld',
    textarea: 'Mehrzeiliger Text'
  },

  // Alignment Options
  alignment: {
    left: 'Links',
    center: 'Mitte',
    right: 'Rechts',
    top: 'Oben',
    middle: 'Mitte',
    bottom: 'Unten'
  },

  // Border Styles
  borderStyles: {
    none: 'Kein Rahmen',
    solid: 'Durchgezogen',
    dashed: 'Gestrichelt',
    dotted: 'Gepunktet',
    double: 'Doppelt'
  },

  // Background Options
  backgrounds: {
    transparent: 'Transparent',
    white: 'Weiß',
    gray: 'Grau',
    custom: 'Benutzerdefiniert'
  },

  // Actions
  actions: {
    save: 'Speichern',
    saveAndClose: 'Speichern und schließen',
    cancel: 'Abbrechen',
    apply: 'Übernehmen',
    reset: 'Zurücksetzen',
    discard: 'Verwerfen',
    delete: 'Löschen',
    duplicate: 'Duplizieren',
    test: 'Testen'
  },

  // Validation Presets
  validationPresets: {
    email: 'E-Mail-Adresse',
    phone: 'Telefonnummer',
    postalCode: 'Postleitzahl',
    iban: 'IBAN',
    date: 'Datum (TT.MM.JJJJ)',
    url: 'Webadresse (URL)',
    custom: 'Benutzerdefiniert'
  },

  // Bulk Edit
  bulkEdit: {
    title: 'Mehrere Felder bearbeiten',
    fieldsSelected: 'Felder ausgewählt',
    mixed: 'Gemischt',
    applyChanges: 'Änderungen übernehmen',
    warning: 'Nur gemeinsame Eigenschaften werden angezeigt. Unterschiedliche Werte werden als "Gemischt" angezeigt.'
  },

  // Keyboard Shortcuts
  shortcuts: {
    title: 'Tastenkombinationen',
    togglePanel: 'Eigenschaften ein/aus',
    save: 'Speichern',
    saveAndClose: 'Speichern und schließen',
    cancel: 'Ohne Speichern schließen',
    nextField: 'Nächstes Eingabefeld'
  }
}

export const tooltips = {
  // Basis
  fieldName: 'Technischer Feldname (nur Buchstaben, Zahlen, Unterstrich). Wird intern zur Identifikation verwendet.',
  displayName: 'Anzeigename für Benutzer (in dataPad und Formularen sichtbar)',
  fieldType: 'Wählen Sie den Typ des Formularfelds',
  description: 'Optionale Beschreibung oder Hilfetext für das Feld',

  // Validierung
  required: 'Pflichtfeld - Muss vor dem Absenden ausgefüllt werden',
  minLength: 'Minimale Anzahl von Zeichen, die eingegeben werden müssen',
  maxLength: 'Maximale Anzahl von Zeichen, die eingegeben werden dürfen',
  pattern: 'Regular Expression für erweiterte Formatvalidierung',
  testRegex: 'Testen Sie Ihren regulären Ausdruck mit Beispieldaten',
  customMessage: 'Benutzerdefinierte Fehlermeldung bei Validierungsfehler',

  // Darstellung
  fontSize: 'Schriftgröße in Punkten (pt)',
  fontColor: 'Farbe des Textes im Formularfeld',
  fontFamily: 'Schriftart für das Formularfeld',
  border: 'Stil des Rahmens um das Feld',
  borderWidth: 'Breite des Rahmens in Pixeln',
  borderColor: 'Farbe des Rahmens',
  background: 'Hintergrundfarbe des Feldes',
  alignment: 'Textausrichtung innerhalb des Feldes',

  // Verhalten
  readonly: 'Feld kann angezeigt, aber nicht bearbeitet werden',
  hidden: 'Feld ist unsichtbar (wird nicht im Formular angezeigt)',
  multiline: 'Ermöglicht mehrzeilige Texteingabe',
  rows: 'Anzahl sichtbarer Zeilen bei mehrzeiligen Feldern',
  disabled: 'Feld ist deaktiviert und kann nicht verwendet werden',
  autoFocus: 'Feld erhält automatisch den Fokus beim Laden',

  // Position
  xPosition: 'Horizontale Position auf der Seite (von links)',
  yPosition: 'Vertikale Position auf der Seite (von oben)',
  width: 'Breite des Formularfelds',
  height: 'Höhe des Formularfelds',
  enableGrid: 'Raster für präzise Positionierung anzeigen',
  snapToGrid: 'Automatisch am Raster ausrichten',
  gridSize: 'Größe der Rasterzellen',

  // DataPad
  mappingKey: 'Automatische Zuordnung zu dataPad-Datenfeld (z.B. customer.firstName)',
  autoFill: 'Feld automatisch mit Daten aus dataPad befüllen',
  previewInDataPad: 'Vorschau anzeigen, wie das Feld in dataPad erscheint',
  suggestedMappings: 'Häufig verwendete Zuordnungen zu dataPad-Feldern',

  // General
  pin: 'Panel anheften, damit es geöffnet bleibt',
  close: 'Eigenschaften-Panel schließen',
  increment: 'Wert erhöhen',
  decrement: 'Wert verringern'
}

export const messages = {
  // Success
  saved: 'Eigenschaften gespeichert',
  autoSaved: 'Automatisch gespeichert um',
  applied: 'Änderungen übernommen',

  // Warnings
  unsavedChanges: 'Sie haben ungespeicherte Änderungen. Möchten Sie speichern?',
  invalidPattern: 'Ungültiger regulärer Ausdruck',
  invalidFieldName: 'Feldname darf nur Buchstaben, Zahlen und Unterstriche enthalten',
  fieldNameRequired: 'Feldname ist erforderlich',

  // Errors
  saveFailed: 'Speichern fehlgeschlagen',
  loadFailed: 'Laden der Eigenschaften fehlgeschlagen',
  validationFailed: 'Validierung fehlgeschlagen',

  // Confirmations
  confirmDelete: 'Möchten Sie dieses Feld wirklich löschen?',
  confirmDiscard: 'Änderungen verwerfen?',
  confirmReset: 'Alle Eigenschaften auf Standardwerte zurücksetzen?',

  // Info
  noFieldSelected: 'Kein Feld ausgewählt. Wählen Sie ein Feld im PDF aus, um seine Eigenschaften zu bearbeiten.',
  bulkEditInfo: 'Sie bearbeiten mehrere Felder gleichzeitig. Nur gemeinsame Eigenschaften werden angezeigt.',

  // Validation Test
  validInput: 'Gültige Eingabe',
  invalidInput: 'Ungültige Eingabe',
  testYourPattern: 'Testen Sie Ihr Muster mit einer Beispieleingabe'
}

export const placeholders = {
  fieldName: 'z.B. kundenname_vorname',
  displayName: 'z.B. Vorname des Kunden',
  description: 'Beschreibung eingeben...',
  regex: '^[A-Z]{2}\\d{6}$',
  testInput: 'AB123456',
  customMessage: 'Bitte geben Sie einen gültigen Wert ein',
  mappingKey: 'z.B. customer.firstName',
  search: 'Suchen...'
}

export const keyboardShortcuts = [
  { key: 'P', label: 'Eigenschaften ein/aus', mac: '⌘P', win: 'Strg+P' },
  { key: 'S', label: 'Speichern', mac: '⌘S', win: 'Strg+S' },
  { key: 'Enter', label: 'Speichern und schließen', mac: '⌘↵', win: 'Strg+Enter' },
  { key: 'Escape', label: 'Ohne Speichern schließen', mac: 'Esc', win: 'Esc' },
  { key: 'Tab', label: 'Nächstes Eingabefeld', mac: '⇥', win: 'Tab' }
]

export const dataPadMappingSuggestions = [
  { key: 'customer.firstName', label: 'Kundenname (Vorname)', category: 'Kunde' },
  { key: 'customer.lastName', label: 'Kundenname (Nachname)', category: 'Kunde' },
  { key: 'customer.email', label: 'E-Mail-Adresse', category: 'Kunde' },
  { key: 'customer.phone', label: 'Telefonnummer', category: 'Kunde' },
  { key: 'customer.company', label: 'Firmenname', category: 'Kunde' },
  { key: 'address.street', label: 'Straße', category: 'Adresse' },
  { key: 'address.houseNumber', label: 'Hausnummer', category: 'Adresse' },
  { key: 'address.postalCode', label: 'Postleitzahl', category: 'Adresse' },
  { key: 'address.city', label: 'Stadt', category: 'Adresse' },
  { key: 'address.country', label: 'Land', category: 'Adresse' },
  { key: 'order.number', label: 'Bestellnummer', category: 'Bestellung' },
  { key: 'order.date', label: 'Bestelldatum', category: 'Bestellung' },
  { key: 'order.total', label: 'Gesamtbetrag', category: 'Bestellung' },
  { key: 'user.username', label: 'Benutzername', category: 'Benutzer' },
  { key: 'user.role', label: 'Benutzerrolle', category: 'Benutzer' }
]

/**
 * Sync direction options
 */
export const syncDirections = {
  pdfToDatapad: {
    id: 'pdf-to-datapad',
    label: 'PDF → DataPad',
    description: 'Änderungen im PDF werden zu DataPad übertragen'
  },
  datapadToPdf: {
    id: 'datapad-to-pdf',
    label: 'DataPad → PDF',
    description: 'Änderungen in DataPad werden ins PDF übertragen'
  },
  bidirectional: {
    id: 'bidirectional',
    label: 'Bidirektional',
    description: 'Änderungen werden in beide Richtungen synchronisiert'
  }
}

/**
 * Conflict resolution strategies
 */
export const conflictStrategies = {
  pdfWins: { id: 'pdf-wins', label: 'PDF bevorzugen' },
  datapadWins: { id: 'datapad-wins', label: 'DataPad bevorzugen' },
  newest: { id: 'newest', label: 'Neueste Version' },
  manual: { id: 'manual', label: 'Manuell auflösen' }
}

/**
 * Helper function to replace placeholders in strings
 */
export function replacePlaceholders(
  text: string,
  replacements: Record<string, string | number>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return replacements[key]?.toString() ?? match
  })
}

/**
 * Helper function to get nested labels
 */
export function getLabel(path: string): string {
  const keys = path.split('.')
  let current: any = labels

  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`Label nicht gefunden: ${path}`)
      return path
    }
    current = current[key]
  }

  return current
}
