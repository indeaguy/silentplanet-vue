# FilterNav Component Requirements

## Input Field
- Allows multiple-word combinations based on configured sequence
- Each word must be from its corresponding list in \`wordLists.lists\`
- Word sequence is defined by \`wordLists.sequence\`
- Maintains proper spacing between phrases:
  - Adds space after phrases in \`wordLists.addSpaceAfter\`
  - Adds space after any phrase that has subsequent positions available
  - Preserves trailing spaces when deleting phrases
  - Preserves trailing spaces when filtering suggestions
  - Custom phrases follow same spacing rules as regular phrases based on \`addSpaceAfter\`
  - **TODO:** When backspacing at a space between phrases, should clear the phrase to the right of the cursor instead of removing the space

## Suggestion Behavior

### 1. Word Selection
- Shows suggestions based on cursor position relative to phrase boundaries
- Shows suggestions whenever a word is clicked
- Filters suggestions to include matches anywhere in the word (not just prefix matches)
- After selecting a word:
  - If next word isn't set, show next word suggestions
  - If next word is set, don't show any suggestions automatically
- When changing a word with subsequent words present:
  - Preserves subsequent words
  - Updates only the current word
  - Maintains cursor position
  - Doesn't show suggestions automatically
- Stops showing suggestions when:
  - All available phrases in the sequence are filled
  - Previous words are not valid phrases
  - Maximum number of phrases is reached
- Allows suggestions when:
  - Starting fresh with no phrases
  - Current phrase is valid
- Space key behavior:
  - Only commits phrase on exact match when no longer matches exist
  - Preserves partial matches for multi-word phrases (e.g., "new cheese")
  - Allows continued typing for partial matches

### Special Down Arrow Behavior
When cursor is on an existing selected phrase with:
- No leading space before cursor position AND
- Currently selected phrase matches the one in store

Then:
1. First down arrow press:
   - Show ALL available options for that phrase type
   - Select first option
2. Subsequent down arrow presses:
   - Navigate through all available options
3. If user starts typing:
   - Clear the current phrase
   - Return to normal filtered suggestion behavior
4. If user hits escape:
   - Restore previous phrase state
5. If input loses focus:
   - Reset to normal suggestion behavior

### 2. Custom Phrases
- Allows adding custom phrases when no exact match exists
- Custom phrases are stored per word type in \`customPhrases\`
- Custom phrases are properly removed when:
  - Backspacing over the phrase
  - Manually deleting the phrase
  - Replacing with a different phrase
- Shows "+" icon next to custom phrase suggestions
- Maintains spaces within multi-word custom phrases
- Allows freely adding spaces to custom phrases without requiring matches
- Prevents duplicate custom phrases
- Only offers custom phrase option when no partial matches exist

### 3. Keyboard Navigation
- Up/Down arrows navigate through suggestions when suggestions are visible
- Down arrow shows suggestions for current word position when suggestions are hidden
- Enter key selects highlighted suggestion
- Space key selects exact matching suggestion for current word
- Navigating up past first suggestion clears selection
- Shift+Up moves cursor to start of input
- Shift+Down moves cursor to end of input
- Left/Right arrows update suggestions based on cursor position
- Cursor position determines which word's suggestions are shown based on phrase boundaries
- Backspace removes entire phrases when cursor is within phrase boundaries

### 4. Cursor Position
- Uses \`phraseHistory.phrases\` to determine word boundaries
- Each phrase object contains:
  - phrase: The actual word
  - start: Starting cursor position
  - end: Ending cursor position
  - isCustom: Whether this is a custom phrase
- Updates suggestions based on which phrase boundary contains cursor
- Supports arrow key navigation within input text
- Maintains cursor position after selecting a word

## Visual Feedback
- Highlights currently selected suggestion
- Shows appropriate suggestions filtered by current input
- Maintains proper spacing between words
- Indicates custom phrases with "+" icon

## Configuration
- Uses wordLists object containing:
  - sequence: Array defining the order of word types
  - lists: Object containing named arrays of valid words for each type
  - addSpaceAfter: Array of word types that should auto-add spaces

## State Management
- Integrates with userStore to maintain phrase history
- \`phraseHistory.phrases\` stores word positions and boundaries
- \`phraseHistory.customPhrases\` tracks custom phrases by list type
- Uses phrase boundaries instead of spaces for word detection
- Maintains last used timestamps for phrase suggestions
- When adding/updating phrases:
  - Preserves existing phrase metadata for untouched phrases
  - Updates character positions sequentially to maintain proper boundaries
  - Only modifies isCustom flag for the current word being changed
  - Maintains proper spacing and positioning for the entire sequence

### 5. Selected Phrase Tracking
- Maintains selectedPhrase in userStore with:
  - index: Position in sequence
  - phrase: The actual text
  - start: Starting cursor position
  - end: Ending cursor position
  - isCustom: Whether it's a custom phrase
- Updates selectedPhrase when:
  - Cursor moves within phrase boundaries
  - New phrase is selected
  - Phrase is deleted
- Clears selectedPhrase when:
  - Cursor moves outside phrase boundaries
  - Input is cleared
- Uses selectedPhrase for:
  - Determining current phrase under cursor
  - Validating phrase boundaries
  - Supporting special down arrow behavior
