// ─── Transformation rules (applied in order) ───────────────────
const RULES = [
    {
        regex: /coutf\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
        replacer: (_, n, m) => `cout << fixed << setprecision(${n}) << ${m}`
    },
    {
        regex: /forr\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
        replacer: (_, varName, start, end) => `for(int ${varName}=${start};${varName}<${end};${varName}++)`
    },
    {
        regex: /forl\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
        replacer: (_, varName, start, end) => `for(int ${varName}=${start};${varName}>${end};${varName}--)`
    },
    {
        regex: /macos;/g,
        replacer: `\n    ios::sync_with_stdio(0);cin.tie(0);cout.tie(0);`
    },
    {
        regex: /#include\s*<Nonbangkok\.h>/g,
        replacer: `#include <bits/stdc++.h>`
    },
    {
        regex: /\bendll\b/g,
        replacer: `"\\n"`
    },
    {
        regex: /\bsp\b/g,
        replacer: `" "`
    }
];

// ─── Core transform (pure function) ────────────────────────────
function transform(code) {
    const filtered = code
        .split('\n')
        .filter(line => !line.startsWith('#define'))
        .join('\n');

    return RULES.reduce(
        (result, { regex, replacer }) => result.replace(regex, replacer),
        filtered
    );
}

// ─── Syntax highlighter ─────────────────────────────────────────
const KEYWORDS = new Set([
    'int','long','double','float','char','bool','void',
    'return','if','else','while','for','break','continue','do',
    'struct','class','const','auto','using','namespace',
    'string','endl','cin','cout','fixed','setprecision',
    'unsigned','signed','short','template','typename',
    'vector','map','set','pair','true','false','nullptr',
    'new','delete','sizeof','static','inline','virtual',
    'public','private','protected','ios',
]);

// ALTHEA shorthand — highlighted distinctly in the input pane
const MACROS = new Set(['forr','forl','coutf','macos','endll','sp']);

// Single-pass tokenizer — order of alternatives is priority
const TOKEN_RE = /(#\w+[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[uUlLfF]*|[+\-*\/=!<>&|^~%]+|[{}()\[\];:,.]|\b\w+\b|[ \t]+|\n|[\s\S])/g;

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code) {
    TOKEN_RE.lastIndex = 0;
    let out = '';
    let m;
    while ((m = TOKEN_RE.exec(code)) !== null) {
        const tok = m[0];
        const esc = escHtml(tok);
        if (tok[0] === '#') {
            out += `<span class="hl-pre">${esc}</span>`;
        } else if (tok[0] === '/' && (tok[1] === '/' || tok[1] === '*')) {
            out += `<span class="hl-comment">${esc}</span>`;
        } else if (tok[0] === '"' || tok[0] === "'") {
            out += `<span class="hl-string">${esc}</span>`;
        } else if (tok[0] >= '0' && tok[0] <= '9') {
            out += `<span class="hl-number">${esc}</span>`;
        } else if (MACROS.has(tok)) {
            out += `<span class="hl-macro">${esc}</span>`;
        } else if (KEYWORDS.has(tok)) {
            out += `<span class="hl-keyword">${esc}</span>`;
        } else if (/^[{}()\[\];:,.]$/.test(tok)) {
            out += `<span class="hl-punct">${esc}</span>`;
        } else if (/^[+\-*\/=!<>&|^~%]+$/.test(tok)) {
            out += `<span class="hl-operator">${esc}</span>`;
        } else {
            out += esc;
        }
    }
    return out;
}

// ─── Clipboard helper (with execCommand fallback for file://) ───
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback: works on file:// and older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    } finally {
        document.body.removeChild(ta);
    }
}

// ─── UI wiring ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const inputCode      = document.getElementById('inputCode');
    const inputHighlight = document.getElementById('inputHighlight');
    const processBtn     = document.getElementById('processBtn');
    const clearBtn       = document.getElementById('clearBtn');
    const outputCode     = document.getElementById('outputCode');
    const copyBtn        = document.getElementById('copyBtn');
    const copyLabel      = document.getElementById('copyLabel');
    const autoToggle     = document.getElementById('autoProcess');

    let currentOutput = ''; // raw text kept separate from highlighted HTML

    const PLACEHOLDER = '<span class="placeholder">// Translated code will appear here...</span>';

    // Update the input backdrop; append trailing space so the last
    // newline is visible (pre collapses a bare trailing \n otherwise)
    function syncInput() {
        inputHighlight.innerHTML = highlight(inputCode.value + ' ');
    }

    function run() {
        currentOutput = transform(inputCode.value);
        outputCode.innerHTML = currentOutput ? highlight(currentOutput) : PLACEHOLDER;
    }

    // Keep backdrop scrolled in sync with the textarea
    inputCode.addEventListener('scroll', () => {
        inputHighlight.scrollTop  = inputCode.scrollTop;
        inputHighlight.scrollLeft = inputCode.scrollLeft;
    });

    // Translate button
    processBtn.addEventListener('click', run);

    // Sync highlight on every keystroke; auto-translate if toggled
    inputCode.addEventListener('input', () => {
        syncInput();
        if (autoToggle.checked) run();
    });

    // Clear both panes
    clearBtn.addEventListener('click', () => {
        inputCode.value = '';
        currentOutput = '';
        inputHighlight.innerHTML = '';
        outputCode.innerHTML = PLACEHOLDER;
        inputCode.focus();
    });

    // Copy raw output to clipboard (not the highlighted HTML)
    copyBtn.addEventListener('click', () => {
        if (!currentOutput.trim()) return;

        copyToClipboard(currentOutput)
            .then(() => {
                copyLabel.textContent = 'Copied!';
                copyBtn.classList.add('btn-copied');
            })
            .catch(() => {
                copyLabel.textContent = 'Failed';
            })
            .finally(() => {
                setTimeout(() => {
                    copyLabel.textContent = 'Copy';
                    copyBtn.classList.remove('btn-copied');
                }, 1500);
            });
    });
});
