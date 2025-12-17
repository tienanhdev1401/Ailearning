**Sequence Diagram: Highlight Text → Translate (client-only)**

Purpose: user highlights text and the frontend calls external translation/dictionary APIs directly (no server involved). This diagram excludes copy, save, and read features.

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Frontend as `Page + TranslatePopup` (client)
    participant TranslateAPI as `mymemory.translated.net`
    participant DictAPI as `dictionaryapi.dev`

    %% User highlights text
    User->>Browser: Select text on page
    Browser->>Frontend: show `TranslatePopup` near selection
    User->>Frontend: click "Translate" (choose target language)

    Frontend-->>Browser: show loading state in popup

    alt text
    %% Frontend calls public translation API directly
    Frontend->>TranslateAPI: GET /get?q={text}&langpair={from}|{to}
    TranslateAPI-->>Frontend: 200 OK { translatedText }
    Frontend-->>Browser: update popup with translatedText

    %% If selection is a single English word, frontend also fetches dictionary data
    else single word
        Frontend->>DictAPI: GET /api/v2/entries/en/{word}
        DictAPI-->>Frontend: 200 OK { entry }
        Frontend-->>Browser: show phonetic and synonyms from entry
    end

    Frontend-->>Browser: hide loading state

    Note right of Frontend: handles fetch errors locally (e.g., show "Không thể dịch")
```

References: `client/src/component/TranslatePopup.jsx`.
