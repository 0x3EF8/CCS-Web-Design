/*!
 * CCS AI Chat Agent v5.0  � Gemini 3 Flash Edition
 * Powered by Google Gemini 3 Flash Preview (gemini-3-flash-preview)
 * Knowledge base: assets/data/ccs-knowledge.js (file:// safe)
 * Features: Intent detection, adaptive thinking levels, XML-structured
 *           system prompt, dynamic suggestions, multi-key rotation
 *
 * Gemini 3 Flash capabilities leveraged:
 *   - 1M token context window (frontier-class reasoning)
 *   - Adaptive thinkingLevel: minimal / low / medium / high
 *   - 16384 maxOutputTokens (Gemini 3 supports up to 64k)
 *   - Temperature kept at model default 1.0 per Google's official
 *     recommendation � do NOT lower it for Gemini 3 models
 *   - Knowledge cutoff: January 2025
 */

/* -------------------------------------------------------------
   SHARED CONFIG � single source of truth used by both the
   floating widget (chatbot.js) and the full-page chat (chat.html)
------------------------------------------------------------- */
window.CCS_CONFIG = {
  model:           'gemini-3-flash-preview',
  apiBase:         'https://generativelanguage.googleapis.com/v1beta/models/',
  keys: [
    // Add your Gemini API key(s) here
    // e.g. 'AIzaSy...'
  ],
  maxHistory:      16,   // last 16 turns � efficient for 1M token context
  maxOutputTokens: 16384 // Gemini 3 Flash supports up to 64k output tokens
  // NOTE: Temperature intentionally omitted � Gemini 3 requires default 1.0.
  // Lowering temperature on Gemini 3 causes looping / degraded reasoning.
};

/* =============================================================
   CCS AI ENGINE  � window.CCS_AI  (v5 � Gemini 3 Flash)
   Single source of truth for all Gemini logic:
   intent detection � XML-structured system prompt � adaptive
   thinkingLevel � API calls � key rotation
   Used by both the floating widget (chatbot.js) and the
   full-page chat (chat.html). Neither duplicates this logic.
============================================================= */
window.CCS_AI = (function () {
  'use strict';

  /* -----------------------------------------------------------
     PRIVATE STATE
  ----------------------------------------------------------- */
  var _knowledge = '';  // set via CCS_AI.setKnowledge()
  var _history   = [];  // Gemini conversation turns
  var _keyIndex  = 0;   // current API key index

  /* -----------------------------------------------------------
     SUGGESTION SETS
     Exposed publicly so any UI can render contextual chips.
  ----------------------------------------------------------- */
  var SUGGESTION_SETS = {
    greeting:    ['What programs does CCS offer?', 'How do I enroll in CCS?', 'BSCS vs BSIT \u2014 which suits me?', 'Are there scholarships available?'],
    general:     ['What programs does CCS offer?', 'How do I enroll in CCS?', 'BSCS vs BSIT \u2014 which suits me?', 'Are there scholarships available?'],
    programs:    ['What are the BSCS specialization tracks?', 'What are the BSIT specialization tracks?', 'What subjects will I take in Year 1?', 'What career paths lead from BSCS?'],
    enrollment:  ['What documents do I need to apply?', 'When is the application deadline?', 'How many slots are left?', 'What is the College Entrance Examination like?'],
    comparison:  ['Which program has better career opportunities?', 'Is BSCS harder than BSIT?', 'Can I shift programs after enrolling?', 'What are the salary ranges for each program?'],
    scholarship: ['What are the DOST scholarship requirements?', 'Is there a CHED scholarship?', 'How do I apply for the Academic Excellence Scholarship?', 'Are there industry partnership scholarships?'],
    faculty:     ['What research areas do faculty specialize in?', 'How many faculty members does CCS have?', 'Can I contact a specific professor?', 'What facilities does CCS have?'],
    events:      ['What student organizations can I join?', 'When is the next CCS Hackathon?', 'What is the Tech Talk Series?', 'What are the recent student achievements?'],
    career:      ['What companies hire CCS graduates?', 'What certifications should I get?', 'What is the starting salary for BSCS/BSIT?', 'How long is the OJT internship?']
  };

  /* -----------------------------------------------------------
     INTENT DETECTION
     Classifies user query into one of 8 intents so the system
     prompt and follow-up suggestions are always contextual.
     Ordered from most-specific to least-specific to avoid
     false positives on overlapping terms.
  ----------------------------------------------------------- */
  function detectIntent(text) {
    var t = text.toLowerCase();

    // GREETING: hi, hello, hey, good morning/afternoon/evening, etc.
    if (/^(hi+|hello+|hey+|good (morning|afternoon|evening|day)|howdy|sup|yo|greetings|what'?s up|how are you|how r u|kamusta|musta)[!?.\s]*$/i.test(t.trim())) return 'greeting';

    // ENROLLMENT: admissions process, documents, requirements, fees
    if (/enroll|admission|apply|applic|require|document|form 138|birth cert|good moral|tor\b|transcript|diploma|cee\b|entrance exam|slot|register|registrar|deadline|tuition|fee|payment|cashier|how to (apply|enroll|get in|join)|steps to|process of|when (can|do) i (apply|enroll)|accept|acceptance|incoming|freshman|incoming student/i.test(t)) return 'enrollment';

    // COMPARISON: choosing between programs, pros/cons
    if (/vs\.?|versus|compar|better|differ|which (program|is|should|one)|bscs.*bsit|bsit.*bscs|choose|prefer|recommend|pros? (and|&) cons?|good for me|right for me|suit(able|s)? for|should i take|what('s| is) the difference/i.test(t)) return 'comparison';

    // PROGRAMS: degree programs, curriculum, tracks, subjects
    if (/program|bscs|bsit|track|curriculum|subject|course|year (1|2|3|4|one|two|three|four)|semester|units?|specializ|degree|major|minor|elective|thesis|capstone|bachelor|computing|information tech|computer science|what (do|will) (i|we|you) (study|learn|take)|second year|third year|fourth year/i.test(t)) return 'programs';

    // SCHOLARSHIP: financial aid, grants, free tuition
    if (/scholar|grant|financial (aid|assistance|support)|dost\b|ched\b|unifast|tes\b|merit|free (tuition|education|school)|aid|stipend|spes\b|local government.*scholar|voucher|subsid|discount|how to (get|avail) (scholar|financial|aid)/i.test(t)) return 'scholarship';

    // FACULTY: teachers, laboratories, facilities, resources
    if (/faculty|professor|teacher|instructor|dean|chairperson|department head|lab(oratory)?|facilit|room|equipment|resource|portal|azure|github|microsoft|license|software|computer (room|lab)|innovation (lab|center)|learning management|lms\b|cisco|networking lab|multimedia/i.test(t)) return 'faculty';

    // CAREER: jobs, salaries, industry, certifications
    if (/job|career|salary|wage|pay|work|hire|company|certif|board exam|licensure|ojt\b|intern(ship)?|graduate|employ|after (graduation|college)|tech industry|programmer|developer|analyst|sys(tem)? admin|it (job|career|field)|career path|career opportunity|what job|what can i do|future|profession/i.test(t)) return 'career';

    // EVENTS: organizations, competitions, student life, achievements
    if (/event|org(anization)?|club|hackathon|contest|competition|activity|bits\b|coders|devsoc|cssp\b|synergy|tech talk|quiz bee|sportsfest|acquaintance|culminating|award|achievement|student life|campus life|extra.?curricular|what (org|club)|join (a|an|the)|how to join/i.test(t)) return 'events';

    return 'general';
  }

  /* -----------------------------------------------------------
     SYSTEM PROMPT BUILDER  (v5 � Gemini 3 Flash � XML-structured)
     Uses official Gemini 3 prompting best practices:
     - XML tags for clear structural separation
     - Grounding instruction (knowledge-base-only facts)
     - Knowledge cutoff declaration (January 2025)
     - Explicit planning for complex reasoning intents
     - Adaptive intent guides with student-centered design
     - No temperature changes � model reasons at default 1.0
  ----------------------------------------------------------- */
  function _buildSystemPrompt(intent) {

    /* ---- Intent-specific execution guides ---- */
    var intentGuides = {
      greeting: (
        '<current_focus>STUDENT GREETING</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Respond naturally to the greeting � warm, brief, human.\n'
        + '2. In 1�2 sentences, introduce yourself as the CCS AI Academic Advisor.\n'
        + '3. Mention 3�4 things you can help with (programs, enrollment, scholarships, student life, careers).\n'
        + '4. End with ONE open invitation question � do not ask about a specific topic yet.\n'
        + 'Keep the entire response under 5 sentences. Do NOT recite facts yet.\n'
        + '</execution_plan>'
      ),
      enrollment: (
        '<current_focus>ENROLLMENT / ADMISSIONS QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Parse whether the student is asking about (a) requirements, (b) steps/process, (c) deadlines, (d) fees, or (e) a specific form.\n'
        + '2. Provide the exact step-by-step admission process as a numbered checklist.\n'
        + '3. List every required document in a formatted checklist (use ? or bullet points).\n'
        + '4. State enrollment timelines and any applicable deadline urgency.\n'
        + '5. If limited slots exist, communicate urgency clearly but respectfully.\n'
        + '6. Close by directing the student to the official CCS Department Office (Room 201) or ccs.dept@school.edu.ph for final confirmation.\n'
        + '</execution_plan>'
      ),
      programs: (
        '<current_focus>DEGREE PROGRAMS QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Identify which program the student is asking about: BSCS, BSIT, or both.\n'
        + '2. Provide a thorough answer covering: full program description, program objectives, and admission prerequisites.\n'
        + '3. Present ALL specialization tracks in a clearly labeled table (do not skip any track).\n'
        + '4. Give a year-by-year curriculum overview with key subjects per year level.\n'
        + '5. Map each track to realistic career paths and specific companies that hire graduates.\n'
        + '6. If the student has not stated their interests, end with ONE precise question to help them choose a track.\n'
        + '</execution_plan>'
      ),
      comparison: (
        '<current_focus>PROGRAM COMPARISON QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Analyze what the student is truly deciding (which program, which track, or which career path).\n'
        + '2. Build a comprehensive markdown comparison table with these dimensions: math intensity, programming depth, hardware/networking coverage, career ceiling, average starting salary (PHP), board exam requirement, graduate school compatibility, and available specialization tracks.\n'
        + '3. Follow the table with a narrative section: describe the ideal student profile for each program in 2-3 sentences.\n'
        + '4. If the student has mentioned their interests (coding, business, networking, design, etc.), provide a clear personalized recommendation.\n'
        + '5. If NO interests have been mentioned, ask exactly ONE targeted question (e.g., "Are you more drawn to software development or systems/network management?") � do not guess.\n'
        + '6. Validate your comparison against the knowledge base before writing the table.\n'
        + '</execution_plan>'
      ),
      scholarship: (
        '<current_focus>SCHOLARSHIPS & FINANCIAL AID QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Present ALL available scholarships in a structured table: Name | Type | Eligibility | Coverage | Application Period.\n'
        + '2. Highlight DOST, CHED UniFAST, and any institutional/departmental scholarships with separate detailed sections.\n'
        + '3. Provide step-by-step application instructions with a complete, numbered requirements list.\n'
        + '4. Include any deadlines, selecting authority, and renewal conditions you can confirm from the knowledge base.\n'
        + '5. For details not in the knowledge base, direct the student to the Scholarship Office or OSAS.\n'
        + '</execution_plan>'
      ),
      faculty: (
        '<current_focus>FACULTY & FACILITIES QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Describe the faculty composition: number of faculty, academic qualifications, and specialization areas.\n'
        + '2. Highlight notable research focus areas and any recent publications or awards.\n'
        + '3. Describe all available laboratories with name, purpose, capacity, and key equipment.\n'
        + '4. List all digital resources available to students: Azure Dev Tools, GitHub Student Pack, LMS, student portal, and any licensed software.\n'
        + '5. If asking about a specific professor, provide what the knowledge base confirms; otherwise, direct to the CCS office.\n'
        + '</execution_plan>'
      ),
      career: (
        '<current_focus>CAREER OUTCOMES QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Differentiate career paths between BSCS graduates and BSIT graduates using concrete job titles.\n'
        + '2. Provide realistic salary ranges in Philippine Peso (entry-level, mid-level, senior-level).\n'
        + '3. List specific companies and industries known to hire CCS graduates.\n'
        + '4. Recommend the top 3-5 industry certifications that most increase employability for each program.\n'
        + '5. Describe the OJT/internship structure: duration, process, and how it connects to industry.\n'
        + '6. Mention board exam / licensure requirements where applicable (e.g., Electronics Engineer for networking roles).\n'
        + '</execution_plan>'
      ),
      events: (
        '<current_focus>STUDENT LIFE, EVENTS & ORGANIZATIONS QUERY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Describe all student organizations with their official name, focus area, and key annual activities.\n'
        + '2. List all regular CCS events with frequency (annual, semestral, monthly) and brief description.\n'
        + '3. Highlight recent student achievements or awards to inspire the student.\n'
        + '4. If the student is asking how to join, provide the general process and the best contact point.\n'
        + '5. Use a warm, enthusiastic tone for this intent � student life questions often come from students deciding whether to join.\n'
        + '</execution_plan>'
      ),
      general: (
        '<current_focus>GENERAL CCS INQUIRY</current_focus>\n'
        + '<execution_plan>\n'
        + '1. Identify the core intent behind the question � is it really about programs, enrollment, career, or something else?\n'
        + '2. If it maps to a known topic, treat it with the same depth as that topic\'s guide.\n'
        + '3. If the question is genuinely broad or vague, ask ONE precise clarifying question before answering.\n'
        + '4. For completely unrelated questions (e.g., cooking, sports, politics), politely redirect in one sentence and offer 2 CCS topics. Do NOT use this rule for greetings, casual small talk, or "what can you do" questions � those deserve a welcoming response.\n'
        + '</execution_plan>'
      )
    };

    var guide = intentGuides[intent] || intentGuides.general;

    return (
      /* ---- ROLE ---- */
      '<role>\n'
      + 'You are the official CCS AI Academic Advisor for the College of Computer Studies (CCS) Department.\n'
      + 'You are NOT a generic AI chatbot. You are a highly specialized, authoritative, and student-focused academic advisor who has deep expertise in:\n'
      + '- CCS degree programs (BSCS, BSIT, and ACT): all specialization tracks, subjects, curriculum structure, and prerequisites\n'
      + '- Admission procedures, enrollment steps, required documents, and important timelines\n'
      + '- Scholarships, government grants (DOST, CHED UniFAST), and institutional financial aid programs\n'
      + '- Faculty qualifications, laboratory facilities, and digital student resources\n'
      + '- Career outcomes, industry certifications, OJT programs, salary benchmarks, and hiring companies\n'
      + '- Student organizations, CCS events, competitions, and campus life\n'
      + 'Your knowledge cutoff date is January 2025. The current date is March 2026.\n'
      + '</role>\n\n'

      /* ---- PERSONA ---- */
      + '<persona>\n'
      + 'Tone: Professional, direct, and authoritative � like a trusted university academic advisor who genuinely invests in student success.\n'
      + 'Warmth: Increase warmth when a student seems anxious, undecided, or overwhelmed. Decrease formality for casual questions.\n'
      + 'DO: Begin answers with substance immediately. Use markdown structure. Be thorough. Be encouraging without being hollow.\n'
      + 'DO NOT: Use filler phrases: "Great question!", "Certainly!", "Of course!", "Sure!", "I\'d be happy to help", "As an AI".\n'
      + 'DO NOT: Self-introduce. The student knows who you are.\n'
      + 'DO NOT: Truncate answers. Never say "I can\'t go into detail" or "for more info, visit..." without first giving a complete answer.\n'
      + '</persona>\n\n'

      /* ---- GROUNDING ---- */
      + '<grounding>\n'
      + 'You are a strictly grounded assistant. In your answers, rely ONLY on facts directly present in the CCS Knowledge Base below.\n'
      + 'Do NOT fabricate program details, scholarship amounts, contact information, or faculty names.\n'
      + 'If a specific detail is not in the knowledge base, say: "Please confirm this directly with the CCS Department Office at Room 201 or ccs.dept@school.edu.ph � I want to ensure you receive accurate information."\n'
      + 'Do not speculate or infer from general knowledge about other schools or programs.\n'
      + '</grounding>\n\n'

      /* ---- REASONING (Gemini 3 structured planning) ---- */
      + '<reasoning>\n'
      + 'Before writing your response, silently complete these steps (do NOT output this reasoning):\n'
      + '1. What is the student REALLY asking? Identify the true underlying need, not just the surface question.\n'
      + '2. Does the CCS Knowledge Base contain a direct, factual answer to this? Locate the relevant section.\n'
      + '3. What is the optimal response structure? (numbered steps / markdown table / narrative / comparison / checklist)\n'
      + '4. Is this student showing signs of anxiety, confusion, or being overwhelmed? If YES, modulate tone appropriately.\n'
      + '5. What ONE genuinely useful follow-up would help this student the most?\n'
      + '6. Verify: Does my planned response stay fully within the Knowledge Base? Remove any invented details.\n'
      + '</reasoning>\n\n'

      /* ---- CURRENT INTENT & EXECUTION PLAN ---- */
      + '<task>\n'
      + guide + '\n'
      + '</task>\n\n'

      /* ---- OUTPUT FORMAT ---- */
      + '<output_format>\n'
      + (intent === 'greeting'
          ? '- Respond naturally as a warm, human greeting. You MAY start with a brief welcome.\n'
          : '- First word = the answer. No greetings, no filler, no self-introduction.\n'
        )
      + '- Markdown structure: ## for main sections, ### for sub-sections, **bold** for key terms and names.\n'
      + '- Use tables for comparisons and multi-attribute data.\n'
      + '- Use numbered lists for sequential steps/processes.\n'
      + '- Use bullet lists for features, requirements, or unordered items.\n'
      + '- End each response with exactly ONE contextual follow-up question or suggestion that genuinely helps the student advance.\n'
      + '- Zero decorative emoji. Use ? / ?? / ?? only when they meaningfully improve clarity in a list or checklist.\n'
      + '- For enrollment questions: always communicate the urgency of limited available slots.\n'
      + '- For "which should I choose" questions where interests are unknown: ask ONE targeted question; do not guess.\n'
      + '</output_format>\n\n'

      /* ---- KNOWLEDGE BASE (grounding source) ---- */
      + '<knowledge_base>\n'
      + _knowledge + '\n'
      + '</knowledge_base>'
    );
  }

  /* -----------------------------------------------------------
     EXTRACT TEXT FROM GEMINI RESPONSE
  ----------------------------------------------------------- */
  function _extractText(data) {
    try {
      var text = data.candidates[0].content.parts[0].text;
      return text || '(Empty response. Please try again.)';
    } catch (e) {
      if (data.promptFeedback && data.promptFeedback.blockReason) {
        return 'I couldn\u2019t answer due to content safety filters. Please rephrase your question.';
      }
      return 'Unexpected response received. Please try again.';
    }
  }

  /* -----------------------------------------------------------
     SEND  � core Gemini API call with auto key rotation
     @param {string}   userText   Raw user message
     @param {string}   intent     Detected intent string
     @param {object}   callbacks  { onReply(replyText), onError(errorMsg) }
     @param {number}   attempt    Internal retry counter (key rotation)
  ----------------------------------------------------------- */
  function send(userText, intent, callbacks, attempt) {
    var cfg   = window.CCS_CONFIG;
    attempt   = attempt   || 0;
    callbacks = callbacks || {};

    _history.push({ role: 'user', parts: [{ text: userText }] });

    var key  = cfg.keys[_keyIndex];
    var url  = cfg.apiBase + cfg.model + ':generateContent';

    // Adaptive thinking levels for Gemini 3 Flash:
    //   minimal � lightweight chat / general queries (fastest, lowest cost)
    //   low     � factual lookups: programs, enrollment, scholarship, events
    //   medium  � multi-step reasoning: comparisons, career guidance, faculty
    // NOTE: Temperature is intentionally omitted � Gemini 3 requires default
    //       1.0. Setting it manually causes looping / degraded reasoning.
    var thinkingLevels = {
      comparison: 'medium', career: 'medium', faculty: 'medium',
      programs:   'low',    enrollment: 'low', scholarship: 'low', events: 'low',
      general:    'minimal', greeting: 'minimal'
    };
    var thinkingLevel = thinkingLevels[intent] || 'low';

    var payload = {
      system_instruction: { parts: [{ text: _buildSystemPrompt(intent) }] },
      contents:           _history.slice(-cfg.maxHistory),
      generationConfig: {
        thinkingConfig:  { thinkingLevel: thinkingLevel },
        topP:            0.95,
        maxOutputTokens: cfg.maxOutputTokens
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body:    JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (d) { throw { status: res.status, body: d }; });
      return res.json();
    })
    .then(function (data) {
      var reply = _extractText(data);
      _history.push({ role: 'model', parts: [{ text: reply }] });
      if (callbacks.onReply) callbacks.onReply(reply);
    })
    .catch(function (err) {
      var status = err && err.status;

      // Auto-rotate to next API key on rate limit (429) or server overload (503)
      if ((status === 429 || status === 503) && attempt < cfg.keys.length - 1) {
        _keyIndex = (_keyIndex + 1) % cfg.keys.length;
        _history.pop();
        send(userText, intent, callbacks, attempt + 1);
        return;
      }

      _history.pop(); // remove the failed user turn
      var msg = 'Something went wrong. Please try again.';
      if      (status === 429)    msg = 'The service is currently busy. Please wait a moment and try again.';
      else if (status === 503)    msg = 'The AI service is temporarily unavailable. Please try again in a moment.';
      else if (status === 400)    msg = 'Request could not be processed \u2014 please rephrase your question.';
      else if (status === 403)    msg = 'API access issue detected. Please refresh the page.';
      else if (status === 404)    msg = 'AI model unavailable. Please refresh and try again.';
      else if (!navigator.onLine) msg = 'No internet connection detected. Please check your network.';
      if (callbacks.onError) callbacks.onError(msg);
    });
  }

  /* -----------------------------------------------------------
     PUBLIC API
  ----------------------------------------------------------- */
  return {
    SUGGESTION_SETS: SUGGESTION_SETS,
    detectIntent:    detectIntent,
    send:            send,
    setKnowledge:    function (text) { _knowledge = text || ''; },
    getHistory:      function ()     { return _history; },
    setHistory:      function (arr)  { _history = Array.isArray(arr) ? arr : []; },
    resetHistory:    function ()     { _history = []; _keyIndex = 0; }
  };

})();


/* =============================================================
   FLOATING WIDGET  � UI only
   Handles the FAB, chat panel, and all DOM interactions.
   All AI/Gemini work is delegated to window.CCS_AI.
============================================================= */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     DETECT SUBPAGE  (needed for script path resolution)
  ----------------------------------------------------------- */
  function _isSubpage() {
    return window.location.pathname.replace(/\\/g, '/').indexOf('/pages/') !== -1;
  }

  /* -----------------------------------------------------------
     WIDGET STATE  (UI concerns only � no AI state here)
  ----------------------------------------------------------- */
  var state = {
    open:       false,
    loading:    false,
    badged:     true,
    turnCount:  0,
    lastIntent: 'general'
  };

  /* -----------------------------------------------------------
     DOM REFS
  ----------------------------------------------------------- */
  var el = {};

  /* -----------------------------------------------------------
     BOOT
     1. Load knowledge base JS (works on file://, no CORS)
     2. Load marked.js from CDN for markdown rendering
     3. Init widget UI (skipped on the full-page chat screen)
  ----------------------------------------------------------- */
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Do not inject the floating widget on the full-page chat screen
    if (_isSubpage() && window.location.pathname.replace(/\\/g, '/').indexOf('/pages/chat.html') !== -1) return;

    var kbScriptPath = _isSubpage() ? '../assets/data/ccs-knowledge.js' : 'assets/data/ccs-knowledge.js';

    // Step 1 � load KB script (sets window.CCS_KB)
    loadScript(kbScriptPath, function () {
      // Step 2 � load marked.js
      loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', function () {
        if (window.marked) window.marked.setOptions({ breaks: true, gfm: true });

        // Step 3 � feed knowledge to the AI engine
        function bootWidget(knowledgeText) {
          window.CCS_AI.setKnowledge(knowledgeText);
          injectHTML(); cacheEls(); bindEvents(); showWelcome();
        }

        bootWidget(window.CCS_KB || '');
      });
    });
  });

  /* -------------------------------------------------------------
     INJECT HTML
  ------------------------------------------------------------- */
  function injectHTML() {
    var fab = document.createElement('button');
    fab.id        = 'ccsChatFab';
    fab.className = 'ccs-chat-fab';
    fab.setAttribute('aria-label',    'Open CCS AI Assistant');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML =
      '<svg class="fab-icon-chat" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
        + '<path d="M8 10h8M8 14h5" opacity=".6"/>'
      + '</svg>'
      + '<svg class="fab-icon-close" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">'
        + '<path d="M18 6L6 18M6 6l12 12"/>'
      + '</svg>'
      + '<span class="chat-badge" id="chatBadge" aria-hidden="true">1</span>';
    document.body.appendChild(fab);

    var win = document.createElement('div');
    win.id        = 'ccsChatWindow';
    win.className = 'ccs-chat-window';
    win.setAttribute('role',       'dialog');
    win.setAttribute('aria-label', 'CCS AI Assistant');
    win.innerHTML =
      '<div class="chat-header">'
        + '<div class="chat-header-avatar">'
          + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            + '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>'
            + '<path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-2.52-8.45-5.13C11.38 4.2 10.6 1.96 8.3 2.4m3.57 18.23c3.19-5 3.94-9.06 2.11-15.5"/>'
          + '</svg>'
        + '</div>'
        + '<div class="chat-header-info">'
          + '<div class="chat-name">CCS AI Assistant</div>'
          + '<div class="chat-status">Online &mdash; Powered by Gemini</div>'
        + '</div>'
        + '<div class="chat-header-actions">'
          + '<button class="chat-action-btn" id="chatExpandBtn" title="Open full chat" aria-label="Expand to full chat">'
            + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'
          + '</button>'
        + '</div>'
      + '</div>'
      + '<div class="chat-body" id="chatBody" role="log" aria-live="polite"></div>'
      + '<div class="chat-error-banner" id="chatErrorBanner" role="alert">'
        + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
        + '<span id="chatErrorText">Something went wrong. Please try again.</span>'
      + '</div>'
      + '<div class="chat-suggestions" id="chatSuggestions" aria-label="Suggested questions"></div>'
      + '<div class="chat-footer">'
        + '<div class="chat-input-row">'
          + '<div class="chat-input-wrap">'
            + '<textarea class="chat-textarea" id="chatInput" placeholder="Ask anything about CCS..." rows="1" aria-label="Message"></textarea>'
          + '</div>'
          + '<button class="chat-send-btn" id="chatSendBtn" aria-label="Send" disabled>'
            + '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
          + '</button>'
        + '</div>'
        + '<p class="chat-powered">Powered by <span>Google Gemini</span> &bull; CCS Department</p>'
      + '</div>';
    document.body.appendChild(win);
  }

  /* -------------------------------------------------------------
     CACHE ELEMENTS
  ------------------------------------------------------------- */
  function cacheEls() {
    el.fab     = document.getElementById('ccsChatFab');
    el.win     = document.getElementById('ccsChatWindow');
    el.body    = document.getElementById('chatBody');
    el.input   = document.getElementById('chatInput');
    el.send    = document.getElementById('chatSendBtn');
    el.expand  = document.getElementById('chatExpandBtn');
    el.badge   = document.getElementById('chatBadge');
    el.errBar  = document.getElementById('chatErrorBanner');
    el.errText = document.getElementById('chatErrorText');
    el.suggs   = document.getElementById('chatSuggestions');
  }

  /* -------------------------------------------------------------
     BIND EVENTS
  ------------------------------------------------------------- */
  function bindEvents() {
    el.fab.addEventListener('click', toggleChat);
    el.send.addEventListener('click', handleSend);
    el.expand.addEventListener('click', expandChat);

    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    el.input.addEventListener('input', function () {
      el.input.style.height = 'auto';
      el.input.style.height = Math.min(el.input.scrollHeight, 110) + 'px';
      el.send.disabled = !el.input.value.trim() || state.loading;
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.open) toggleChat();
    });
  }

  /* -----------------------------------------------------------
     TOGGLE
  ----------------------------------------------------------- */
  function toggleChat() {
    state.open = !state.open;
    el.fab.classList.toggle('is-open', state.open);
    el.fab.setAttribute('aria-expanded', String(state.open));
    el.win.classList.toggle('is-visible', state.open);
    if (state.open) {
      if (state.badged) { state.badged = false; el.badge.style.display = 'none'; }
      setTimeout(function () { el.input.focus(); }, 350);
      scrollDown();
    }
  }

  /* -----------------------------------------------------------
     WELCOME MESSAGE
  ----------------------------------------------------------- */
  function showWelcome() {
    addBotMsg(
      '**Hello! How can I help you today?**\n\n'
      + 'Your CCS Academic Advisor is ready. I can answer questions about:\n\n'
      + '- **Programs** \u2014 BSCS & BSIT, specialization tracks, curriculum, career paths\n'
      + '- **Enrollment** \u2014 Step-by-step process, requirements, deadlines *(3 slots remaining)*\n'
      + '- **Scholarships** \u2014 DOST, CHED, Academic Excellence, and more\n'
      + '- **Faculty & Facilities** \u2014 Labs, professors, student resources\n'
      + '- **Student Life** \u2014 Organizations, events, competitions, achievements\n\n'
      + 'What would you like to know?'
    );
    renderSuggs('general');
  }

  /* -----------------------------------------------------------
     HANDLE SEND  � detects intent then delegates to CCS_AI
  ----------------------------------------------------------- */
  function handleSend() {
    var text = el.input.value.trim();
    if (!text || state.loading) return;

    clearError();
    clearSuggs();
    addUserMsg(text);

    el.input.value        = '';
    el.input.style.height = 'auto';
    el.send.disabled      = true;
    state.loading         = true;

    state.lastIntent = window.CCS_AI.detectIntent(text);
    state.turnCount++;

    var typing = addTyping();

    window.CCS_AI.send(text, state.lastIntent, {
      onReply: function (reply) {
        removeTyping(typing);
        state.loading    = false;
        el.send.disabled = !el.input.value.trim();
        addBotMsg(reply);
        if (state.turnCount <= 6) renderSuggs(state.lastIntent);
      },
      onError: function (msg) {
        removeTyping(typing);
        state.loading    = false;
        el.send.disabled = !el.input.value.trim();
        showError(msg);
        addBotMsg('**Notice:** ' + msg + '\n\nFor urgent inquiries, contact the CCS Department Office at **Room 201** or **ccs.dept@school.edu.ph**.');
      }
    });
  }

  /* -------------------------------------------------------------
     MESSAGES
  ------------------------------------------------------------- */
  function addUserMsg(text) {
    var row = document.createElement('div');
    row.className = 'chat-message user';
    row.innerHTML =
      '<div class="msg-avatar" aria-hidden="true">You</div>'
      + '<div class="msg-content">'
        + '<div class="msg-bubble">' + esc(text) + '</div>'
        + '<div class="msg-time">' + nowStr() + '</div>'
      + '</div>';
    el.body.appendChild(row);
    scrollDown();
  }

  function addBotMsg(md) {
    var row = document.createElement('div');
    row.className = 'chat-message bot';
    row.innerHTML =
      '<div class="msg-avatar" aria-hidden="true">AI</div>'
      + '<div class="msg-content">'
        + '<div class="msg-bubble">' + md2html(md) + '</div>'
        + '<div class="msg-time">' + nowStr() + '</div>'
      + '</div>';
    el.body.appendChild(row);
    scrollDown();
  }

  /* -------------------------------------------------------------
     TYPING INDICATOR
  ------------------------------------------------------------- */
  function addTyping() {
    var row = document.createElement('div');
    row.className = 'chat-message bot';
    row.id = 'chatTypingRow';
    row.innerHTML =
      '<div class="msg-avatar" aria-hidden="true">AI</div>'
      + '<div class="msg-content">'
        + '<div class="chat-typing" aria-label="AI is thinking">'
          + '<span></span><span></span><span></span>'
        + '</div>'
      + '</div>';
    el.body.appendChild(row);
    scrollDown();
    return row;
  }

  function removeTyping(row) {
    if (row && row.parentNode) row.parentNode.removeChild(row);
  }

  /* -------------------------------------------------------------
     SUGGESTIONS
  ------------------------------------------------------------- */
  function renderSuggs(intent) {
    var set = window.CCS_AI.SUGGESTION_SETS[intent] || window.CCS_AI.SUGGESTION_SETS.general;
    el.suggs.innerHTML = '';
    set.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className   = 'chat-suggestion-btn';
      btn.textContent = s;
      btn.addEventListener('click', function () {
        el.input.value   = s;
        el.send.disabled = false;
        handleSend();
      });
      el.suggs.appendChild(btn);
    });
  }

  function clearSuggs() { el.suggs.innerHTML = ''; }

  /* -----------------------------------------------------------
     EXPAND CHAT � persist state then navigate to full-page chat
  ----------------------------------------------------------- */
  function expandChat() {
    // Collect rendered message bubbles for restoration in full-page chat
    var msgs = [];
    el.body.querySelectorAll('.chat-message').forEach(function (row) {
      var bubble = row.querySelector('.msg-bubble');
      var time   = row.querySelector('.msg-time');
      msgs.push({
        role: row.classList.contains('user') ? 'user' : 'bot',
        html: bubble ? bubble.innerHTML  : '',
        time: time   ? time.textContent  : ''
      });
    });

    try {
      sessionStorage.setItem('ccsChat_history',   JSON.stringify(window.CCS_AI.getHistory()));
      sessionStorage.setItem('ccsChat_msgs',      JSON.stringify(msgs));
      sessionStorage.setItem('ccsChat_returnUrl', window.location.href);
    } catch (e) {}

    el.win.classList.add('is-expanding');
    setTimeout(function () {
      window.location.href = _isSubpage() ? 'chat.html' : 'pages/chat.html';
    }, 380);
  }

  /* -------------------------------------------------------------
     ERROR BANNER
  ------------------------------------------------------------- */
  function showError(msg) {
    el.errText.textContent = msg;
    el.errBar.classList.add('visible');
  }

  function clearError() {
    el.errBar.classList.remove('visible');
  }

  /* -------------------------------------------------------------
     HELPERS
  ------------------------------------------------------------- */
  function scrollDown() {
    setTimeout(function () { el.body.scrollTop = el.body.scrollHeight; }, 40);
  }

  function nowStr() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
  }

  function esc(t) {
    return String(t)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/\n/g, '<br>');
  }

  /* -------------------------------------------------------------
     MARKDOWN -> HTML
     Uses marked.js (loaded from CDN) for reliable rendering.
     Falls back to a simple regex parser if CDN unavailable.
  ------------------------------------------------------------- */
  function md2html(t) {
    if (!t) return '';

    // Use marked.js if loaded (preferred)
    if (window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(t);
    }

    // -- Fallback: lightweight regex parser ---------------------
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fenced code blocks ? placeholder
    var codeBlocks = [];
    t = t.replace(/```([\w]*)\n?([\s\S]*?)```/g, function (_, lang, code) {
      var idx = codeBlocks.length;
      var esc = code.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      codeBlocks.push('<pre><code>' + esc + '</code></pre>');
      return '\x00CB' + idx + '\x00';
    });

    t = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    t = t.replace(/^[ \t]*(---+|___+|\*\*\*+)[ \t]*$/gm, '<hr>');
    t = t.replace(/^(#{1,4})[ \t]+(.+)$/gm, function(_, h, s){ var l=h.length<=2?2:h.length; return '<h'+l+'>'+s.trim()+'</h'+l+'>'; });
    t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
    t = t.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>');
    t = t.replace(/`([^`\n]+)`/g,       '<code>$1</code>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    t = t.replace(/((?:^[ \t]*[-*+] .+\n?)+)/gm, function(b){ return '<ul>'+b.trim().split('\n').map(function(l){ return '<li>'+l.replace(/^[ \t]*[-*+] /,'')+'</li>'; }).join('')+'</ul>'; });
    t = t.replace(/((?:^[ \t]*\d+\. .+\n?)+)/gm, function(b){ return '<ol>'+b.trim().split('\n').map(function(l){ return '<li>'+l.replace(/^[ \t]*\d+\. /,'')+'</li>'; }).join('')+'</ol>'; });
    t = t.split(/\n{2,}/).map(function(p){
      p = p.trim(); if(!p) return '';
      if(/^</.test(p) || p.indexOf('\x00CB')!==-1) return p;
      return '<p>'+p.replace(/\n/g,'<br>')+'</p>';
    }).join('');
    t = t.replace(/\x00CB(\d+)\x00/g, function(_,i){ return codeBlocks[+i]; });
    return t;
  }

})();
