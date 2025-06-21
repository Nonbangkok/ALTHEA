document.addEventListener("DOMContentLoaded", () => {
    const inputCode = document.getElementById("inputCode");
    const processBtn = document.getElementById("processBtn");
    const outputCode = document.getElementById("outputCode");
    const copyBtn = document.getElementById("copyBtn");
    const copyMessage = document.getElementById("copyMessage");

    const replacements = [
        {
            regex: /coutf\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            replacer: (match, n, m) => `cout << fixed << setprecision(${n}) << ${m}`
        },
        {
            regex: /forr\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            replacer: (match, varName, start, end) => `for(int ${varName}=${start};${varName}<${end};${varName}++)`
        },
        {
            regex: /forl\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
            replacer: (match, varName, start, end) => `for(int ${varName}=${start};${varName}>${end};${varName}--)`
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

    processBtn.addEventListener("click", () => {
        const codeText = inputCode.value;

        const filteredCode = codeText
            .split('\n')
            .filter(line => {
                return !line.startsWith("#define");
            })
            .join('\n');
        
        let replacedCode = filteredCode;
        replacements.forEach(({ regex, replacer }) => {
            replacedCode = replacedCode.replace(regex, replacer);
        });

        outputCode.textContent = replacedCode;
    });

    copyBtn.addEventListener("click", () => {
        const textToCopy = outputCode.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyMessage.classList.add("visible");
            setTimeout(() => {
                copyMessage.classList.remove("visible");
            }, 2000);
        }).catch(err => {
            console.error("Failed to copy: ", err);
        });
    });
});

